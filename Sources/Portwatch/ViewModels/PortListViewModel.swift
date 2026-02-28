import SwiftUI

@MainActor
final class PortListViewModel: ObservableObject {
    @Published var ports: [PortEntry] = []
    @Published var searchText: String = ""
    @Published var isScanning: Bool = false

    private let scanner = PortScanner()
    private var timerTask: Task<Void, Never>?

    var filteredPorts: [PortEntry] {
        if searchText.isEmpty { return ports }
        let query = searchText.lowercased()
        return ports.filter { entry in
            entry.processName.lowercased().contains(query) ||
            String(entry.port).contains(query) ||
            String(entry.pid).contains(query)
        }
    }

    var portCount: Int { ports.count }

    func startMonitoring() {
        timerTask?.cancel()
        timerTask = Task {
            while !Task.isCancelled {
                await refresh()
                try? await Task.sleep(for: .seconds(5))
            }
        }
    }

    func stopMonitoring() {
        timerTask?.cancel()
        timerTask = nil
    }

    func refresh() async {
        isScanning = true
        defer { isScanning = false }

        do {
            let results = try await scanner.scan()
            self.ports = results
        } catch {
            // Silently handle scan failures — will retry on next cycle
        }
    }

    func killProcess(pid: Int32, force: Bool = false) {
        let signal = force ? SIGKILL : SIGTERM
        kill(pid, signal)

        Task {
            try? await Task.sleep(for: .milliseconds(500))
            await refresh()
        }
    }
}
