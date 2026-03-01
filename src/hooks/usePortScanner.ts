import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PortEntry, ScanResult } from "../types/port";

export function usePortScanner() {
  const [ports, setPorts] = useState<PortEntry[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setIsScanning(true);
    try {
      const result = await invoke<ScanResult>("scan_ports");
      setPorts(result.entries);
      setIsAdmin(result.is_admin);
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const killProcess = useCallback(
    async (pid: number, force: boolean) => {
      try {
        await invoke("kill_process", { pid, force });
        // Refresh after a short delay
        setTimeout(() => refresh(), 500);
      } catch (err) {
        console.error("Kill failed:", err);
      }
    },
    [refresh],
  );

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  const query = searchText.toLowerCase();
  const filteredPorts = searchText
    ? ports.filter(
        (p) =>
          p.process_name.toLowerCase().includes(query) ||
          String(p.port).includes(query) ||
          String(p.pid).includes(query),
      )
    : ports;

  return {
    ports,
    filteredPorts,
    searchText,
    setSearchText,
    isScanning,
    isAdmin,
    refresh,
    killProcess,
  };
}
