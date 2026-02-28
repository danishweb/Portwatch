use crate::models::{PortCategory, PortEntry};
use super::PortScanner;
use std::collections::HashSet;
use std::process::Command;

pub struct WindowsScanner;

impl PortScanner for WindowsScanner {
    fn scan(&self) -> Result<Vec<PortEntry>, String> {
        let output = Command::new("netstat")
            .args(["-ano"])
            .output()
            .map_err(|e| format!("Failed to run netstat: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut entries = parse_netstat_output(&stdout)?;

        // Resolve PIDs to process names
        let process_map = get_process_map();
        for entry in &mut entries {
            if let Some(name) = process_map.get(&entry.pid) {
                entry.process_name = name.clone();
            }
        }

        Ok(entries)
    }
}

fn parse_netstat_output(output: &str) -> Result<Vec<PortEntry>, String> {
    let mut entries = Vec::new();
    let mut seen = HashSet::new();

    for line in output.lines() {
        let trimmed = line.trim();
        if !trimmed.contains("LISTENING") {
            continue;
        }

        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        // TCP    0.0.0.0:135    0.0.0.0:0    LISTENING    1044
        if parts.len() < 5 {
            continue;
        }

        let proto = parts[0];
        if proto != "TCP" {
            continue;
        }

        let local_addr = parts[1];
        let (address, port) = match parse_netstat_address(local_addr) {
            Some(v) => v,
            None => continue,
        };

        let pid: u32 = match parts[4].parse() {
            Ok(p) => p,
            Err(_) => continue,
        };

        let id = format!("{}-{}", pid, port);
        if !seen.insert(id.clone()) {
            continue;
        }

        let ip_version = if local_addr.contains('[') {
            "IPv6".to_string()
        } else {
            "IPv4".to_string()
        };

        entries.push(PortEntry {
            id,
            port,
            pid,
            process_name: format!("PID:{}", pid), // resolved later
            address,
            ip_version,
            category: PortCategory::categorize(port),
        });
    }

    entries.sort_by_key(|e| e.port);
    Ok(entries)
}

fn parse_netstat_address(addr: &str) -> Option<(String, u16)> {
    // Formats: "0.0.0.0:135", "[::]:135", "127.0.0.1:445"
    let last_colon = addr.rfind(':')?;
    let port: u16 = addr[last_colon + 1..].parse().ok()?;
    let mut address = &addr[..last_colon];

    if address.starts_with('[') && address.ends_with(']') {
        address = &address[1..address.len() - 1];
    }

    Some((address.to_string(), port))
}

fn get_process_map() -> std::collections::HashMap<u32, String> {
    let mut map = std::collections::HashMap::new();

    // Use tasklist to get PID→name mapping
    let output = match Command::new("tasklist")
        .args(["/FO", "CSV", "/NH"])
        .output()
    {
        Ok(o) => o,
        Err(_) => return map,
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        // "System Idle Process","0","Services","0","8 K"
        let fields: Vec<&str> = line.split(',').collect();
        if fields.len() >= 2 {
            let name = fields[0].trim_matches('"').to_string();
            if let Ok(pid) = fields[1].trim_matches('"').parse::<u32>() {
                map.insert(pid, name);
            }
        }
    }

    map
}
