import SwiftUI

struct PortRowView: View {
    let entry: PortEntry
    let onKill: (_ force: Bool) -> Void

    @State private var isHovered = false

    var body: some View {
        HStack(spacing: 10) {
            // Category icon
            Image(systemName: entry.category.icon)
                .foregroundStyle(entry.category.color)
                .frame(width: 20)

            // Port number
            Text("\(entry.port)")
                .font(.system(.body, design: .monospaced, weight: .semibold))
                .frame(width: 55, alignment: .trailing)

            // Process info
            VStack(alignment: .leading, spacing: 1) {
                Text(entry.processName)
                    .font(.system(.body, weight: .medium))
                    .lineLimit(1)
                Text("PID \(entry.pid) \u{2022} \(entry.displayAddress)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            // Kill buttons (on hover)
            if isHovered {
                Button {
                    onKill(false)
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.red)
                }
                .buttonStyle(.borderless)
                .help("Stop process (SIGTERM)")

                Button {
                    onKill(true)
                } label: {
                    Image(systemName: "bolt.circle.fill")
                        .foregroundStyle(.red)
                }
                .buttonStyle(.borderless)
                .help("Force kill (SIGKILL)")
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(isHovered ? Color.primary.opacity(0.05) : Color.clear)
        .cornerRadius(4)
        .onHover { hovering in
            isHovered = hovering
        }
    }
}
