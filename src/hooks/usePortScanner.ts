import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PortEntry, ScanResult } from "../types/port";

const SCAN_INTERVAL_MS = 3000;

function portsEqual(a: PortEntry[], b: PortEntry[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].port !== b[i].port || a[i].pid !== b[i].pid) {
      return false;
    }
  }
  return true;
}

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
      setPorts((prev) => {
        if (portsEqual(prev, result.entries)) return prev;
        return result.entries;
      });
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
    intervalRef.current = setInterval(refresh, SCAN_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  const filteredPorts = useMemo(() => {
    if (!searchText) return ports;
    const query = searchText.toLowerCase();
    return ports.filter(
      (p) =>
        p.process_name.toLowerCase().includes(query) ||
        String(p.port).includes(query) ||
        String(p.pid).includes(query),
    );
  }, [ports, searchText]);

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
