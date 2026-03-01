use crate::models::{PortCategory, PortEntry};
use super::PortScanner;
use std::collections::{HashMap, HashSet};
use std::process::Command;

// Win32 API imports
use windows_sys::Win32::Foundation::{CloseHandle, INVALID_HANDLE_VALUE, NO_ERROR};
use windows_sys::Win32::NetworkManagement::IpHelper::GetExtendedTcpTable;
use windows_sys::Win32::Networking::WinSock::{AF_INET, AF_INET6};
use windows_sys::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS,
};

pub struct WindowsScanner;

impl PortScanner for WindowsScanner {
    fn scan(&self) -> Result<Vec<PortEntry>, String> {
        // Try Win32 API first, fall back to netstat
        match scan_with_api() {
            Ok(entries) if !entries.is_empty() => Ok(entries),
            Ok(_) => scan_with_netstat(),
            Err(_) => scan_with_netstat(),
        }
    }
}

// ---------------------------------------------------------------------------
// Win32 API scanner (primary)
// ---------------------------------------------------------------------------

fn scan_with_api() -> Result<Vec<PortEntry>, String> {
    let process_map = get_process_map_api();

    let mut entries = Vec::new();
    let mut seen = HashSet::new();

    // IPv4 listening ports
    if let Ok(tcp4) = get_tcp4_listeners() {
        for (address, port, pid) in tcp4 {
            let id = format!("{}-{}", pid, port);
            if !seen.insert(id.clone()) {
                continue;
            }
            let process_name = process_map
                .get(&pid)
                .cloned()
                .unwrap_or_else(|| format!("PID:{}", pid));
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
    }

    // IPv6 listening ports
    if let Ok(tcp6) = get_tcp6_listeners() {
        for (address, port, pid) in tcp6 {
            let id = format!("{}-{}", pid, port);
            if !seen.insert(id.clone()) {
                continue;
            }
            let process_name = process_map
                .get(&pid)
                .cloned()
                .unwrap_or_else(|| format!("PID:{}", pid));
            entries.push(PortEntry {
                id,
                port,
                pid,
                process_name,
                address,
                ip_version: "IPv6".to_string(),
                category: PortCategory::categorize(port),
            });
        }
    }

    entries.sort_by_key(|e| e.port);
    Ok(entries)
}

/// Build PID → process name map using CreateToolhelp32Snapshot
fn get_process_map_api() -> HashMap<u32, String> {
    let mut map = HashMap::new();

    unsafe {
        let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if snapshot == INVALID_HANDLE_VALUE {
            return map;
        }

        let mut entry: PROCESSENTRY32W = std::mem::zeroed();
        entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;

        if Process32FirstW(snapshot, &mut entry) != 0 {
            loop {
                let name_len = entry
                    .szExeFile
                    .iter()
                    .position(|&c| c == 0)
                    .unwrap_or(entry.szExeFile.len());
                let name = String::from_utf16_lossy(&entry.szExeFile[..name_len]);
                map.insert(entry.th32ProcessID, name);

                if Process32NextW(snapshot, &mut entry) == 0 {
                    break;
                }
            }
        }

        CloseHandle(snapshot);
    }

    map
}

/// Get IPv4 listening TCP ports via GetExtendedTcpTable
fn get_tcp4_listeners() -> Result<Vec<(String, u16, u32)>, String> {
    // TCP_TABLE_OWNER_PID_LISTENER = 3
    const TABLE_CLASS: i32 = 3;
    let mut size: u32 = 0;

    unsafe {
        // First call: get required buffer size
        let ret = GetExtendedTcpTable(
            std::ptr::null_mut(),
            &mut size,
            0,
            AF_INET as u32,
            TABLE_CLASS,
            0,
        );

        // ERROR_INSUFFICIENT_BUFFER = 122
        if ret != 122 {
            return Err(format!("GetExtendedTcpTable size query failed: {}", ret));
        }

        // Allocate buffer and retrieve data
        let mut buffer = vec![0u8; size as usize];
        let ret = GetExtendedTcpTable(
            buffer.as_mut_ptr() as *mut _,
            &mut size,
            0,
            AF_INET as u32,
            TABLE_CLASS,
            0,
        );

        if ret != NO_ERROR {
            return Err(format!("GetExtendedTcpTable failed: {}", ret));
        }

        // Parse: first 4 bytes = dwNumEntries, then array of rows
        // Each row: dwState(4) + dwLocalAddr(4) + dwLocalPort(4) + dwRemoteAddr(4) + dwRemotePort(4) + dwOwningPid(4)
        let count = u32::from_ne_bytes([buffer[0], buffer[1], buffer[2], buffer[3]]) as usize;
        let row_size = 24; // 6 * 4 bytes per MIB_TCPROW_OWNER_PID
        let rows_start = 4; // after dwNumEntries

        let mut results = Vec::new();
        for i in 0..count {
            let offset = rows_start + i * row_size;
            if offset + row_size > buffer.len() {
                break;
            }

            // dwLocalAddr at offset+4 (after dwState)
            let addr_bytes = &buffer[offset + 4..offset + 8];
            let address = format!(
                "{}.{}.{}.{}",
                addr_bytes[0], addr_bytes[1], addr_bytes[2], addr_bytes[3]
            );

            // dwLocalPort at offset+8 (network byte order)
            let port_bytes = [buffer[offset + 8], buffer[offset + 9]];
            let port = u16::from_be_bytes(port_bytes);

            // dwOwningPid at offset+20
            let pid = u32::from_ne_bytes([
                buffer[offset + 20],
                buffer[offset + 21],
                buffer[offset + 22],
                buffer[offset + 23],
            ]);

            let display_addr = if address == "0.0.0.0" {
                "*".to_string()
            } else {
                address
            };

            results.push((display_addr, port, pid));
        }

        Ok(results)
    }
}

/// Get IPv6 listening TCP ports via GetExtendedTcpTable
fn get_tcp6_listeners() -> Result<Vec<(String, u16, u32)>, String> {
    // TCP_TABLE_OWNER_PID_LISTENER = 3
    const TABLE_CLASS: i32 = 3;
    let mut size: u32 = 0;

    unsafe {
        let ret = GetExtendedTcpTable(
            std::ptr::null_mut(),
            &mut size,
            0,
            AF_INET6 as u32,
            TABLE_CLASS,
            0,
        );

        if ret != 122 {
            return Err(format!("GetExtendedTcpTable v6 size query failed: {}", ret));
        }

        let mut buffer = vec![0u8; size as usize];
        let ret = GetExtendedTcpTable(
            buffer.as_mut_ptr() as *mut _,
            &mut size,
            0,
            AF_INET6 as u32,
            TABLE_CLASS,
            0,
        );

        if ret != NO_ERROR {
            return Err(format!("GetExtendedTcpTable v6 failed: {}", ret));
        }

        // MIB_TCP6ROW_OWNER_PID layout:
        // ucLocalAddr[16] + dwLocalScopeId(4) + dwLocalPort(4) +
        // ucRemoteAddr[16] + dwRemoteScopeId(4) + dwRemotePort(4) +
        // dwState(4) + dwOwningPid(4) = 52 bytes per row
        let count = u32::from_ne_bytes([buffer[0], buffer[1], buffer[2], buffer[3]]) as usize;
        let row_size = 52;
        let rows_start = 4;

        let mut results = Vec::new();
        for i in 0..count {
            let offset = rows_start + i * row_size;
            if offset + row_size > buffer.len() {
                break;
            }

            // ucLocalAddr at offset+0 (16 bytes)
            let mut addr_bytes = [0u8; 16];
            addr_bytes.copy_from_slice(&buffer[offset..offset + 16]);
            let ipv6 = std::net::Ipv6Addr::from(addr_bytes);
            let address = ipv6.to_string();

            // dwLocalPort at offset+20 (after ucLocalAddr[16] + dwLocalScopeId[4])
            let port_bytes = [buffer[offset + 20], buffer[offset + 21]];
            let port = u16::from_be_bytes(port_bytes);

            // dwOwningPid at offset+48 (last 4 bytes of the row)
            let pid = u32::from_ne_bytes([
                buffer[offset + 48],
                buffer[offset + 49],
                buffer[offset + 50],
                buffer[offset + 51],
            ]);

            let display_addr = if address == "::" {
                "*".to_string()
            } else {
                address
            };

            results.push((display_addr, port, pid));
        }

        Ok(results)
    }
}

// ---------------------------------------------------------------------------
// Netstat fallback scanner
// ---------------------------------------------------------------------------

fn scan_with_netstat() -> Result<Vec<PortEntry>, String> {
    let output = Command::new("netstat")
        .args(["-ano"])
        .output()
        .map_err(|e| format!("Failed to run netstat: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut entries = parse_netstat_output(&stdout)?;

    // Resolve PIDs to process names
    let process_map = get_process_map_cmd();
    for entry in &mut entries {
        if let Some(name) = process_map.get(&entry.pid) {
            entry.process_name = name.clone();
        }
    }

    Ok(entries)
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

/// Build PID → process name map using tasklist command (fallback)
fn get_process_map_cmd() -> HashMap<u32, String> {
    let mut map = HashMap::new();

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
