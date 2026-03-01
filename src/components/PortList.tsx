import { usePortScanner } from "../hooks/usePortScanner";
import { PortRow } from "./PortRow";
import { ThemeToggle } from "./ThemeToggle";

export function PortList() {
  const {
    ports,
    filteredPorts,
    searchText,
    setSearchText,
    isScanning,
    refresh,
    killProcess,
  } = usePortScanner();

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-color)" }}
      >
        <div
          className="flex items-center flex-1 gap-2 px-3 py-1.5 rounded-lg"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-color)",
          }}
        >
          <svg
            className="w-4 h-4 shrink-0"
            style={{ color: "var(--text-muted)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Filter by port, process, or PID..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
        <button
          onClick={refresh}
          disabled={isScanning}
          className="p-2 rounded-lg transition-colors disabled:opacity-50"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
          title="Refresh (Cmd+R)"
        >
          <svg
            className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <ThemeToggle />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filteredPorts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-3"
            style={{ color: "var(--text-muted)" }}
          >
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4"
              />
            </svg>
            <p>
              {searchText
                ? `No ports matching "${searchText}"`
                : "No listening ports detected"}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead
              className="sticky top-0 text-xs uppercase tracking-wider"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-muted)",
              }}
            >
              <tr>
                <th className="px-3 py-2 text-left w-10"></th>
                <th className="px-3 py-2 text-right w-20">Port</th>
                <th className="px-3 py-2 text-left">Process</th>
                <th className="px-3 py-2 text-right w-20">PID</th>
                <th className="px-3 py-2 text-left">Address</th>
                <th className="px-3 py-2 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPorts.map((entry) => (
                <PortRow
                  key={entry.id}
                  entry={entry}
                  onKill={killProcess}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center gap-2 px-4 py-2 text-xs"
        style={{
          borderTop: "1px solid var(--border-color)",
          color: "var(--text-secondary)",
        }}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
        <span>
          {filteredPorts.length} port{filteredPorts.length !== 1 ? "s" : ""}
        </span>
        {filteredPorts.length !== ports.length && (
          <span style={{ color: "var(--text-muted)" }}>
            ({ports.length} total)
          </span>
        )}
        <span className="ml-auto" style={{ color: "var(--text-muted)" }}>
          Auto-refresh: 5s
        </span>
      </div>
    </div>
  );
}
