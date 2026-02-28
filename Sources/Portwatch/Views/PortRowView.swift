import SwiftUI

struct PortRowView: View {
    let entry: PortEntry
    let onKill: (_ force: Bool) -> Void

    @State private var isHovered = false
    @State private var showConfirm = false

    var body: some View {
        HStack(spacing: 10) {
            // Category icon
            Image(systemName: entry.category.icon)
                .foregroundStyle(entry.category.color)
                .frame(width: 20)
                .help(entry.category.rawValue)

            // Port number
            Text("\(entry.port)")
                .font(.system(.body, design: .monospaced, weight: .semibold))
                .frame(width: 60, alignment: .trailing)

            // Process name
            Text(entry.processName)
                .font(.system(.body, weight: .medium))
                .lineLimit(1)
                .frame(minWidth: 100, alignment: .leading)

            // PID
            Text("\(entry.pid)")
                .font(.system(.caption, design: .monospaced))
                .foregroundStyle(.secondary)
                .frame(width: 60, alignment: .trailing)

            // Address
            Text(entry.displayAddress)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .frame(minWidth: 80, alignment: .leading)

            Spacer()

            // Kill buttons
            HStack(spacing: 4) {
                Button {
                    onKill(false)
                } label: {
                    Image(systemName: "stop.circle")
                        .foregroundStyle(.orange)
                }
                .buttonStyle(.borderless)
                .help("Stop (SIGTERM)")

                Button {
                    showConfirm = true
                } label: {
                    Image(systemName: "bolt.circle")
                        .foregroundStyle(.red)
                }
                .buttonStyle(.borderless)
                .help("Force kill (SIGKILL)")
                .alert("Force kill \(entry.processName)?", isPresented: $showConfirm) {
                    Button("Cancel", role: .cancel) {}
                    Button("Force Kill", role: .destructive) {
                        onKill(true)
                    }
                } message: {
                    Text("This will immediately terminate PID \(entry.pid) on port \(entry.port). Unsaved data may be lost.")
                }
            }
            .frame(width: 70)
        }
        .padding(.vertical, 2)
    }
}
