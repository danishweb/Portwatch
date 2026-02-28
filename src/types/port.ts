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
