import SwiftUI

struct PortListView: View {
    @ObservedObject var viewModel: PortListViewModel

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Portwatch")
                    .font(.headline)
                Spacer()
                if viewModel.isScanning {
                    ProgressView()
                        .scaleEffect(0.5)
                }
                Button {
                    Task { await viewModel.refresh() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .buttonStyle(.borderless)
                .help("Refresh")
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)

            Divider()

            // Search
            TextField("Filter ports...", text: $viewModel.searchText)
                .textFieldStyle(.roundedBorder)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)

            Divider()

            // Port list
            if viewModel.filteredPorts.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "network.slash")
                        .font(.largeTitle)
                        .foregroundStyle(.secondary)
                    Text(viewModel.searchText.isEmpty
                         ? "No listening ports"
                         : "No matching ports")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, minHeight: 100)
                .padding()
            } else {
                ScrollView {
                    LazyVStack(spacing: 1) {
                        ForEach(viewModel.filteredPorts) { entry in
                            PortRowView(entry: entry) { force in
                                viewModel.killProcess(pid: entry.pid, force: force)
                            }
                        }
                    }
                }
                .frame(maxHeight: 400)
            }

            Divider()

            // Footer
            HStack {
                Text("\(viewModel.filteredPorts.count) ports")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Button("Quit") {
                    NSApplication.shared.terminate(nil)
                }
                .buttonStyle(.borderless)
                .font(.caption)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
        }
        .frame(width: 380)
        .onAppear {
            viewModel.startMonitoring()
        }
        .onDisappear {
            viewModel.stopMonitoring()
        }
    }
}
