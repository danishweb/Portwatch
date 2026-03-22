import { useState, useCallback, useRef, useMemo } from "react";
import { usePortScanner } from "../hooks/usePortScanner";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { groupByProcess } from "../types/port";
import { PortRow } from "./PortRow";
import { ProcessGroupRow } from "./ProcessGroupRow";
import { AutostartToggle } from "./AutostartToggle";
import { ThemeToggle } from "./ThemeToggle";
import { Toast } from "./Toast";

type ViewMode = "flat" | "grouped";

export function PortList() {
  const {
    ports,
    filteredPorts,
    searchText,
    setSearchText,
    isScanning,
    isAdmin,
    isFocused,
    refresh,
    killProcess,
  } = usePortScanner();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem("portwatch-view") as ViewMode) || "flat";
  });
  const searchRef = useRef<HTMLInputElement>(null);

  const toggleViewMode = () => {
    const next = viewMode === "flat" ? "grouped" : "flat";
    setViewMode(next);
    localStorage.setItem("portwatch-view", next);
  };

  const groups = useMemo(
    () => groupByProcess(filteredPorts),
    [filteredPorts],
  );

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToastMessage("Copied to clipboard");
    });
  }, []);

  const copySelectedEntry = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < filteredPorts.length) {
      const e = filteredPorts[selectedIndex];
      const addr = e.address === "*" ? "all interfaces" : e.address;
      copyToClipboard(`port ${e.port} | ${e.process_name} | PID ${e.pid} | ${addr}`);
    }
  }, [selectedIndex, filteredPorts, copyToClipboard]);

  const shortcutHandlers = useMemo(
    () => ({
      onRefresh: refresh,
      onFocusSearch: () => searchRef.current?.focus(),
      onClearSearch: () => {
        setSearchText("");
        setSelectedIndex(-1);
        searchRef.current?.blur();
      },
      onNavigateUp: () =>
        setSelectedIndex((prev) => Math.max(0, prev - 1)),
      onNavigateDown: () =>
        setSelectedIndex((prev) =>
          Math.min(filteredPorts.length - 1, prev + 1),
        ),
      onCopySelected: copySelectedEntry,
    }),
    [refresh, setSearchText, filteredPorts.length, copySelectedEntry],
  );

  useKeyboardShortcuts(shortcutHandlers);

  const handleSelect = useCallback(
    (index: number) => setSelectedIndex(index),
    [],
  );

  return (
    <div className="app-shell">
      {/* macOS overlay titlebar drag region */}
      <div className="titlebar-drag" />

      {/* Toolbar */}
      <div className="toolbar flex items-center gap-3 px-4 py-3">
        <div className="search-box flex items-center flex-1 gap-2 px-3 py-1.5 rounded-lg">
          <svg
            className="w-4 h-4 shrink-0 text-muted"
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
            ref={searchRef}
            type="text"
            placeholder="Filter by port, process, or PID... (Cmd+F)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input flex-1 bg-transparent outline-none text-sm"
          />
        </div>
        {/* View toggle */}
        <button
          onClick={toggleViewMode}
          className="btn-toolbar"
          title={viewMode === "flat" ? "Group by process" : "Flat list"}
        >
          {viewMode === "flat" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          )}
        </button>
        <button
          onClick={refresh}
          disabled={isScanning}
          className="btn-toolbar disabled:opacity-50"
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
        <AutostartToggle />
        <ThemeToggle />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filteredPorts.length === 0 ? (
          <div className="empty-state flex flex-col items-center justify-center h-full gap-3">
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
            <thead className="table-head sticky top-0 text-xs uppercase tracking-wider">
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
              {viewMode === "flat"
                ? filteredPorts.map((entry, index) => (
                    <PortRow
                      key={entry.id}
                      entry={entry}
                      onKill={killProcess}
                      onCopy={copyToClipboard}
                      isSelected={index === selectedIndex}
                      onSelect={() => handleSelect(index)}
                    />
                  ))
                : groups.map((group) => (
                    <ProcessGroupRow
                      key={group.key}
                      group={group}
                      onKill={killProcess}
                      onCopy={copyToClipboard}
                    />
                  ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status bar */}
      <div className="status-bar flex items-center gap-2 px-4 py-2 text-xs">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
        <span>
          {filteredPorts.length} port{filteredPorts.length !== 1 ? "s" : ""}
        </span>
        {viewMode === "grouped" && (
          <span className="text-muted">
            in {groups.length} process{groups.length !== 1 ? "es" : ""}
          </span>
        )}
        {filteredPorts.length !== ports.length && (
          <span className="text-muted">
            ({ports.length} total)
          </span>
        )}
        {!isAdmin && (
          <span
            className="text-muted"
            title="Run as administrator to see all system processes"
          >
            Limited view
          </span>
        )}
        <span className="ml-auto text-muted">
          {isFocused ? "Auto-refresh: 3s" : "Idle: 30s"}
        </span>
      </div>

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </div>
  );
}
