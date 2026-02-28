use crate::models::PortEntry;

pub trait PortScanner {
    fn scan(&self) -> Result<Vec<PortEntry>, String>;
}

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "windows")]
mod windows;

pub fn create_scanner() -> Box<dyn PortScanner> {
    #[cfg(target_os = "macos")]
    { Box::new(macos::MacScanner) }

    #[cfg(target_os = "linux")]
    { Box::new(linux::LinuxScanner) }

    #[cfg(target_os = "windows")]
    { Box::new(windows::WindowsScanner) }
}
