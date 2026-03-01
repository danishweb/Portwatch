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
        use windows_sys::Win32::Foundation::CloseHandle;
        use windows_sys::Win32::System::Threading::{
            OpenProcess, TerminateProcess, PROCESS_TERMINATE,
        };

        // force parameter is ignored on Windows: TerminateProcess is always
        // a hard kill (equivalent to SIGKILL). Windows has no SIGTERM analog
        // at the process level.
        let _ = force;

        unsafe {
            let handle = OpenProcess(PROCESS_TERMINATE, 0, pid);
            if handle.is_null() {
                return Err(format!(
                    "Failed to open process {}. You may need to run as administrator.",
                    pid
                ));
            }

            let result = TerminateProcess(handle, 1);
            CloseHandle(handle);

            if result == 0 {
                Err(format!("Failed to terminate process {}", pid))
            } else {
                Ok(())
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .invoke_handler(tauri::generate_handler![scan_ports, kill_process])
        .run(tauri::generate_context!())
        .expect("error while running Portwatch");
}
