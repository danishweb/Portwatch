mod models;
mod scanner;

use models::ScanResult;
use scanner::create_scanner;

#[tauri::command]
fn scan_ports() -> Result<ScanResult, String> {
    let scanner = create_scanner();
    let entries = scanner.scan()?;

    let is_admin = {
        #[cfg(windows)]
        {
            unsafe { windows_sys::Win32::UI::Shell::IsUserAnAdmin() != 0 }
        }
        #[cfg(not(windows))]
        {
            true // Unix: lsof/ss handle permissions internally
        }
    };

    Ok(ScanResult { entries, is_admin })
}

#[tauri::command]
fn kill_process(pid: u32, force: bool) -> Result<(), String> {
    #[cfg(unix)]
    {
        use nix::sys::signal::{self, Signal};
        use nix::unistd::Pid;

        let signal = if force { Signal::SIGKILL } else { Signal::SIGTERM };
        signal::kill(Pid::from_raw(pid as i32), signal)
            .map_err(|e| format!("Failed to kill process {}: {}", pid, e))
    }

    #[cfg(windows)]
    {
        use std::process::Command;

        let mut cmd = Command::new("taskkill");
        cmd.args(["/PID", &pid.to_string()]);
        if force {
            cmd.arg("/F");
        }
        let output = cmd.output().map_err(|e| format!("Failed to kill process: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("taskkill failed: {}", stderr))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![scan_ports, kill_process])
        .run(tauri::generate_context!())
        .expect("error while running Portwatch");
}
