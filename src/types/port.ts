export type PortCategory =
  | "database"
  | "webserver"
  | "systemservice"
  | "development"
  | "other";

export interface PortEntry {
  id: string;
  port: number;
  pid: number;
  process_name: string;
  address: string;
  ip_version: string;
  category: PortCategory;
}

export interface ScanResult {
  entries: PortEntry[];
  is_admin: boolean;
}

export interface ProcessGroup {
  key: string;
  processName: string;
  pid: number;
  entries: PortEntry[];
  category: PortCategory;
}

export function groupByProcess(ports: PortEntry[]): ProcessGroup[] {
  const map = new Map<string, ProcessGroup>();
  for (const entry of ports) {
    const key = `${entry.process_name}-${entry.pid}`;
    const existing = map.get(key);
    if (existing) {
      existing.entries.push(entry);
    } else {
      map.set(key, {
        key,
        processName: entry.process_name,
        pid: entry.pid,
        entries: [entry],
        category: entry.category,
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => a.entries[0].port - b.entries[0].port,
  );
}

export const categoryConfig: Record<
  PortCategory,
  { color: string; icon: string; label: string }
> = {
  database: { color: "#a855f7", icon: "cylinder", label: "Database" },
  webserver: { color: "#3b82f6", icon: "globe", label: "Web Server" },
  systemservice: { color: "#f97316", icon: "cog", label: "System" },
  development: { color: "#22c55e", icon: "wrench", label: "Development" },
  other: { color: "#6b7280", icon: "network", label: "Other" },
};
