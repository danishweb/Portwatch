use crate::models::{PortCategory, PortEntry};
use super::PortScanner;
use std::collections::HashSet;
use std::process::Command;

pub struct LinuxScanner;

impl PortScanner for LinuxScanner {
    fn scan(&self) -> Result<Vec<PortEntry>, String> {
        // Try ss first (more reliable), fall back to /proc/net/tcp
        match scan_with_ss() {
            Ok(entries) if !entries.is_empty() => Ok(entries),
            _ => scan_with_proc(),
        }
    }
}

fn scan_with_ss() -> Result<Vec<PortEntry>, String> {
    let output = Command::new("ss")
        .args(["-tlnp"])
        .output()
        .map_err(|e| format!("Failed to run ss: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_ss_output(&stdout)
}

fn parse_ss_output(output: &str) -> Result<Vec<PortEntry>, String> {
    let mut entries = Vec::new();
    let mut seen = HashSet::new();

    for line in output.lines().skip(1) {
        // Skip header
        let parts: Vec<&str> = line.split_whitespace().collect();
        // State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
        if parts.len() < 5 {
            continue;
        }

        let local_addr = parts[3];
        let (address, port) = match parse_ss_address(local_addr) {
            Some(v) => v,
            None => continue,
        };

        // Parse process info: users:(("node",pid=1234,fd=6))
        let (process_name, pid) = if parts.len() >= 6 {
            parse_ss_process(parts[5])
        } else {
            ("unknown".to_string(), 0)
        };

        let id = format!("{}-{}", pid, port);
        if !seen.insert(id.clone()) {
            continue;
        }

        entries.push(PortEntry {
            id,
            port,
            pid,
            process_name,
            address,
            ip_version: if local_addr.starts_with('[') || local_addr.contains("::") {
                "IPv6".to_string()
            } else {
                "IPv4".to_string()
            },
            category: PortCategory::categorize(port),
        });
    }

    entries.sort_by_key(|e| e.port);
    Ok(entries)
}

fn parse_ss_address(addr: &str) -> Option<(String, u16)> {
    // Formats: "0.0.0.0:80", "*:80", "[::]:80", "[::1]:80"
    let last_colon = addr.rfind(':')?;
    let port: u16 = addr[last_colon + 1..].parse().ok()?;
    let mut address = &addr[..last_colon];

    if address.starts_with('[') && address.ends_with(']') {
        address = &address[1..address.len() - 1];
    }

    Some((address.to_string(), port))
}

fn parse_ss_process(info: &str) -> (String, u32) {
    // users:(("node",pid=1234,fd=6))
    let name = info
        .split('"')
        .nth(1)
        .unwrap_or("unknown")
        .to_string();

    let pid = info
        .split("pid=")
        .nth(1)
        .and_then(|s| s.split(|c: char| !c.is_ascii_digit()).next())
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);

    (name, pid)
}

fn scan_with_proc() -> Result<Vec<PortEntry>, String> {
    // Fallback: parse /proc/net/tcp
    let content = std::fs::read_to_string("/proc/net/tcp")
        .map_err(|e| format!("Failed to read /proc/net/tcp: {}", e))?;

    let mut entries = Vec::new();
    let mut seen = HashSet::new();

    for line in content.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 4 {
            continue;
        }

        // State 0A = LISTEN
        if parts[3] != "0A" {
            continue;
        }

        let local = parts[1];
        let (address, port) = match parse_proc_address(local) {
            Some(v) => v,
            None => continue,
        };

        // inode is parts[9], map to PID via /proc/[pid]/fd/
        let inode = parts.get(9).unwrap_or(&"0");
        let (process_name, pid) = find_process_by_inode(inode);

        let id = format!("{}-{}", pid, port);
        if !seen.insert(id.clone()) {
            continue;
        }

        entries.push(PortEntry {
            id,
            port,
            pid,
            process_name,
            address,
            ip_version: "IPv4".to_string(),
            category: PortCategory::categorize(port),
        });
    }

    entries.sort_by_key(|e| e.port);
    Ok(entries)
}

fn parse_proc_address(hex_addr: &str) -> Option<(String, u16)> {
    // Format: "0100007F:1F90" (hex ip:hex port)
    let parts: Vec<&str> = hex_addr.split(':').collect();
    if parts.len() != 2 {
        return None;
    }

    let port = u16::from_str_radix(parts[1], 16).ok()?;
    let ip_hex = u32::from_str_radix(parts[0], 16).ok()?;

    let address = format!(
        "{}.{}.{}.{}",
        ip_hex & 0xFF,
        (ip_hex >> 8) & 0xFF,
        (ip_hex >> 16) & 0xFF,
        (ip_hex >> 24) & 0xFF
    );

    if address == "0.0.0.0" {
        Some(("*".to_string(), port))
    } else {
        Some((address, port))
    }
}

fn find_process_by_inode(inode: &str) -> (String, u32) {
    // Walk /proc/[pid]/fd/ to find which process owns this socket inode
    let proc_dir = match std::fs::read_dir("/proc") {
        Ok(d) => d,
        Err(_) => return ("unknown".to_string(), 0),
    };

    let socket_target = format!("socket:[{}]", inode);

    for entry in proc_dir.flatten() {
        let pid_str = entry.file_name().to_string_lossy().to_string();
        let pid: u32 = match pid_str.parse() {
            Ok(p) => p,
            Err(_) => continue,
        };

        let fd_path = format!("/proc/{}/fd", pid);
        if let Ok(fds) = std::fs::read_dir(&fd_path) {
            for fd in fds.flatten() {
                if let Ok(link) = std::fs::read_link(fd.path()) {
                    if link.to_string_lossy() == socket_target {
                        let name = std::fs::read_to_string(format!("/proc/{}/comm", pid))
                            .unwrap_or_else(|_| "unknown".to_string())
                            .trim()
                            .to_string();
                        return (name, pid);
                    }
                }
            }
        }
    }

    ("unknown".to_string(), 0)
}
