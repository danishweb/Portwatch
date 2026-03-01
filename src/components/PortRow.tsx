import { useState } from "react";
import type { PortEntry } from "../types/port";
import { categoryConfig } from "../types/port";

interface Props {
  entry: PortEntry;
  onKill: (pid: number, force: boolean) => void;
  onCopy: (text: string) => void;
}

export function PortRow({ entry, onKill, onCopy }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const cat = categoryConfig[entry.category];
  const displayAddress = entry.address === "*" ? "all interfaces" : entry.address;

  return (
    <>
      <tr
        className="transition-colors text-sm"
        style={{ borderBottom: "1px solid var(--divider)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        {/* Category */}
        <td className="px-3 py-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: cat.color }}
            title={cat.label}
          />
        </td>

        {/* Port */}
        <td className="px-3 py-2 text-right font-mono font-semibold">
          {entry.port}
        </td>

        {/* Process */}
        <td className="px-3 py-2 font-medium truncate max-w-[160px]">
          {entry.process_name}
        </td>

        {/* PID */}
        <td
          className="px-3 py-2 text-right font-mono text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          {entry.pid}
        </td>

        {/* Address */}
        <td
          className="px-3 py-2 text-xs truncate max-w-[120px]"
          style={{ color: "var(--text-secondary)" }}
        >
          {displayAddress}
        </td>

        {/* Actions */}
        <td className="px-3 py-2">
          <div className="flex gap-1 justify-end">
            <button
              onClick={() =>
                onCopy(
                  `port ${entry.port} | ${entry.process_name} | PID ${entry.pid} | ${displayAddress}`,
                )
              }
              className="p-1 rounded transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
              title="Copy info (Cmd+C)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => onKill(entry.pid, false)}
              className="p-1 rounded hover:bg-orange-500/20 text-orange-400 transition-colors"
              title="Stop (SIGTERM)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
              title="Force kill (SIGKILL)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {/* Confirmation dialog */}
      {showConfirm && (
        <tr>
          <td colSpan={6} className="px-3 py-2">
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm">
              <span className="text-red-400">
                Force kill <strong>{entry.process_name}</strong> (PID {entry.pid}) on port {entry.port}?
              </span>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onKill(entry.pid, true);
                    setShowConfirm(false);
                  }}
                  className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs transition-colors"
                >
                  Force Kill
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
