import Foundation

struct PortScanner {

    func scan() async throws -> [PortEntry] {
        let output = try await runLsof()
        return parseLsofOutput(output)
    }

    private func runLsof() async throws -> String {
        let process = Process()
        let pipe = Pipe()

        process.executableURL = URL(fileURLWithPath: "/usr/sbin/lsof")
        process.arguments = ["-i", "-P", "-n", "-sTCP:LISTEN"]
        process.standardOutput = pipe
        process.standardError = FileHandle.nullDevice

        try process.run()

        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()

        return String(data: data, encoding: .utf8) ?? ""
    }

    func parseLsofOutput(_ output: String) -> [PortEntry] {
        var entries: [PortEntry] = []
        let lines = output.components(separatedBy: "\n")

        for line in lines {
            guard line.contains("(LISTEN)") else { continue }

            let components = line.split(separator: " ", omittingEmptySubsequences: true)
                .map(String.init)

            guard components.count >= 9 else { continue }

            let processName = components[0]
                .replacingOccurrences(of: "\\x20", with: " ")

            guard let pid = Int32(components[1]) else { continue }

            let ipVersion = components[4]
            let nameField = components[8]

            guard let (address, port) = parseAddressPort(nameField) else { continue }

            let entry = PortEntry(
                id: "\(pid)-\(port)",
                port: port,
                pid: pid,
                processName: processName,
                address: address,
                ipVersion: ipVersion
            )
            entries.append(entry)
        }

        var seen = Set<String>()
        let unique = entries.filter { seen.insert($0.id).inserted }
        return unique.sorted { $0.port < $1.port }
    }

    private func parseAddressPort(_ name: String) -> (String, Int)? {
        guard let lastColon = name.lastIndex(of: ":") else { return nil }

        let portString = String(name[name.index(after: lastColon)...])
        guard let port = Int(portString) else { return nil }

        var address = String(name[..<lastColon])
        if address.hasPrefix("[") && address.hasSuffix("]") {
            address = String(address.dropFirst().dropLast())
        }

        return (address, port)
    }
}
