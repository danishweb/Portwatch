use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct ScanResult {
    pub entries: Vec<PortEntry>,
    pub is_admin: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct PortEntry {
    pub id: String,
    pub port: u16,
    pub pid: u32,
    pub process_name: String,
    pub address: String,
    pub ip_version: String,
    pub category: PortCategory,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PortCategory {
    Database,
    WebServer,
    SystemService,
    Development,
    Other,
}

impl PortCategory {
    pub fn categorize(port: u16) -> Self {
        const DATABASE_PORTS: &[u16] = &[5432, 3306, 27017, 6379, 6380, 5984, 9200, 9300, 26257];
        const WEB_PORTS: &[u16] = &[80, 443, 8080, 8443, 3000, 4000, 5000, 5173, 8000, 8888, 4200, 1234];

        if DATABASE_PORTS.contains(&port) {
            Self::Database
        } else if WEB_PORTS.contains(&port) {
            Self::WebServer
        } else if port < 1024 {
            Self::SystemService
        } else if (3000..=9999).contains(&port) {
            Self::Development
        } else {
            Self::Other
        }
    }
}
