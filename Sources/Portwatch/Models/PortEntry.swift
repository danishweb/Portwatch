import SwiftUI

struct PortEntry: Identifiable, Hashable {
    let id: String
    let port: Int
    let pid: Int32
    let processName: String
    let address: String
    let ipVersion: String

    var displayAddress: String {
        if address == "*" { return "all interfaces" }
        return address
    }

    var category: PortCategory {
        PortCategory.categorize(port)
    }
}

enum PortCategory: String {
    case database
    case webServer
    case systemService
    case development
    case other

    var color: Color {
        switch self {
        case .database:      return .purple
        case .webServer:     return .blue
        case .systemService: return .orange
        case .development:   return .green
        case .other:         return .gray
        }
    }

    var icon: String {
        switch self {
        case .database:      return "cylinder"
        case .webServer:     return "globe"
        case .systemService: return "gearshape"
        case .development:   return "hammer"
        case .other:         return "network"
        }
    }

    static func categorize(_ port: Int) -> PortCategory {
        let databasePorts: Set<Int> = [5432, 3306, 27017, 6379, 6380, 5984, 9200, 9300, 26257]
        let webPorts: Set<Int> = [80, 443, 8080, 8443, 3000, 4000, 5000, 5173, 8000, 8888, 4200, 1234]

        if databasePorts.contains(port) { return .database }
        if webPorts.contains(port) { return .webServer }
        if port < 1024 { return .systemService }
        if (3000...9999).contains(port) { return .development }
        return .other
    }
}
