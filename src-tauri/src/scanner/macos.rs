use crate::models::{PortCategory, PortEntry};
use super::PortScanner;
use std::collections::HashSet;
use std::process::Command;

pub struct MacScanner;

impl PortScanner for MacScanner {
    fn scan(&self) -> Result<Vec<PortEntry>, String> {
        let output = Command::new("/usr/sbin/lsof")
            .args(["-i", "-P", "-n", "-sTCP:LISTEN"])
            .output()
            .map_err(|e| format!("Failed to run lsof: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        parse_lsof_output(&stdout)
    }
}

fn parse_lsof_output(output: &str) -> Result<Vec<PortEntry>, String> {
    let mut entries = Vec::new();
    let mut seen = HashSet::new();

    for line in output.lines() {
        if !line.contains("(LISTEN)") {
            continue;
        }

        let components: Vec<&str> = line.split_whitespace().collect();
        if components.len() < 9 {
            continue;
        }

        let process_name = components[0].replace("\\x20", " ");

        let pid: u32 = match components[1].parse() {
            Ok(p) => p,
            Err(_) => continue,
        };

        let ip_version = components[4].to_string();
        let name_field = components[8];

        let (address, port) = match parse_address_port(name_field) {
            Some(v) => v,
            None => continue,
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
            ip_version,
            category: PortCategory::categorize(port),
        });
    }

    entries.sort_by_key(|e| e.port);
    Ok(entries)
}

fn parse_address_port(name: &str) -> Option<(String, u16)> {
    let last_colon = name.rfind(':')?;
    let port: u16 = name[last_colon + 1..].parse().ok()?;
    let mut address = &name[..last_colon];

    // Strip IPv6 brackets
    if address.starts_with('[') && address.ends_with(']') {
        address = &address[1..address.len() - 1];
    }

    Some((address.to_string(), port))
}
