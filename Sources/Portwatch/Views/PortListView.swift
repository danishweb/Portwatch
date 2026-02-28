import SwiftUI

struct PortListView: View {
    @ObservedObject var viewModel: PortListViewModel

    var body: some View {
        VStack(spacing: 0) {
            // Toolbar area
            HStack(spacing: 12) {
                // Search
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(.secondary)
                    TextField("Filter by port, process, or PID...", text: $viewModel.searchText)
                        .textFieldStyle(.plain)
                }
                .padding(8)
                .background(.quaternary)
                .cornerRadius(8)

                // Refresh button
                Button {
                    Task { await viewModel.refresh() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .buttonStyle(.borderless)
                .help("Refresh")
                .disabled(viewModel.isScanning)

                if viewModel.isScanning {
                    ProgressView()
                        .scaleEffect(0.6)
                        .frame(width: 16, height: 16)
                }
            }
            .padding(12)

            Divider()

            // Column headers
            HStack(spacing: 10) {
                Text("")
                    .frame(width: 20)
                Text("Port")
                    .frame(width: 60, alignment: .trailing)
                Text("Process")
                    .frame(minWidth: 100, alignment: .leading)
                Text("PID")
                    .frame(width: 60, alignment: .trailing)
                Text("Address")
                    .frame(minWidth: 80, alignment: .leading)
                Spacer()
                Text("Actions")
                    .frame(width: 70)
            }
            .font(.caption.weight(.semibold))
            .foregroundStyle(.secondary)
            .padding(.horizontal, 16)
            .padding(.vertical, 6)
            .background(.quaternary.opacity(0.5))

            Divider()

            // Port list
            if viewModel.filteredPorts.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: viewModel.searchText.isEmpty ? "network.slash" : "magnifyingglass")
                        .font(.system(size: 40))
                        .foregroundStyle(.tertiary)
                    Text(viewModel.searchText.isEmpty
                         ? "No listening ports detected"
                         : "No ports matching \"\(viewModel.searchText)\"")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List {
                    ForEach(viewModel.filteredPorts) { entry in
                        PortRowView(entry: entry) { force in
                            viewModel.killProcess(pid: entry.pid, force: force)
                        }
                        .listRowInsets(EdgeInsets(top: 4, leading: 8, bottom: 4, trailing: 8))
                    }
                }
                .listStyle(.inset(alternatesRowBackgrounds: true))
            }

            Divider()

            // Status bar
            HStack {
                Circle()
                    .fill(.green)
                    .frame(width: 8, height: 8)
                Text("\(viewModel.filteredPorts.count) port\(viewModel.filteredPorts.count == 1 ? "" : "s")")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if viewModel.filteredPorts.count != viewModel.portCount {
                    Text("(\(viewModel.portCount) total)")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }

                Spacer()

                Text("Auto-refresh: 5s")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
        }
        .onAppear {
            viewModel.startMonitoring()
        }
    }
}
