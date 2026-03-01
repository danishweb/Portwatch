import { useState } from "react";
import type { ProcessGroup } from "../types/port";
import { categoryConfig } from "../types/port";

interface Props {
  group: ProcessGroup;
  onKill: (pid: number, force: boolean) => void;
  onCopy: (text: string) => void;
}

export function ProcessGroupRow({ group, onKill, onCopy }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [showKillAll, setShowKillAll] = useState(false);
  const cat = categoryConfig[group.category];
  const portList = group.entries.map((e) => e.port).join(", ");

  return (
    <>
      {/* Group header */}
      <tr
        className="cursor-pointer transition-colors text-sm"
        style={{ borderBottom: "1px solid var(--divider)" }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        <td className="px-3 py-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
        </td>
        <td className="px-3 py-2" colSpan={2}>
          <div className="flex items-center gap-2">
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
              style={{ color: "var(--text-muted)" }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">{group.processName}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: "var(--bg-input)",
                color: "var(--text-secondary)",
              }}
            >
              {group.entries.length} port{group.entries.length !== 1 ? "s" : ""}
            </span>
          </div>
        </td>
        <td
          className="px-3 py-2 text-right font-mono text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          {group.pid}
        </td>
        <td
          className="px-3 py-2 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {portList}
        </td>
        <td className="px-3 py-2">
          <div className="flex gap-1 justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy(
                  `${group.processName} | PID ${group.pid} | ports: ${portList}`,
                );
              }}
              className="p-1 rounded transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
              title="Copy group info"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (group.entries.length > 1) {
                  setShowKillAll(true);
                } else {
                  onKill(group.pid, false);
                }
              }}
              className="p-1 rounded hover:bg-orange-500/20 text-orange-400 transition-colors"
              title={group.entries.length > 1 ? "Kill all" : "Stop (SIGTERM)"}
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {/* Kill all confirmation */}
      {showKillAll && (
        <tr>
          <td colSpan={6} className="px-3 py-2">
            <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 text-sm">
              <span className="text-orange-400">
                Kill <strong>{group.processName}</strong> (PID {group.pid})?
                This will close {group.entries.length} ports.
              </span>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setShowKillAll(false)}
                  className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onKill(group.pid, false);
                    setShowKillAll(false);
                  }}
                  className="px-3 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs transition-colors"
                >
                  Kill All
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Expanded port entries */}
      {expanded &&
        group.entries.map((entry) => (
          <tr
            key={entry.id}
            className="transition-colors text-sm"
            style={{
              borderBottom: "1px solid var(--divider)",
              backgroundColor: "var(--bg-hover)",
            }}
          >
            <td className="px-3 py-1.5"></td>
            <td className="px-3 py-1.5 text-right font-mono font-semibold text-xs">
              {entry.port}
            </td>
            <td
              className="px-3 py-1.5 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {entry.ip_version}
            </td>
            <td className="px-3 py-1.5"></td>
            <td
              className="px-3 py-1.5 text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              {entry.address === "*" ? "all interfaces" : entry.address}
            </td>
            <td className="px-3 py-1.5">
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() =>
                    onCopy(
                      `port ${entry.port} | ${entry.process_name} | PID ${entry.pid} | ${entry.address === "*" ? "all interfaces" : entry.address}`,
                    )
                  }
                  className="p-1 rounded transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--bg-secondary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                  title="Copy port info"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ))}
    </>
  );
}
