import { useAutostart } from "../hooks/useAutostart";

export function AutostartToggle() {
  const { enabled, loading, toggle } = useAutostart();

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg transition-colors"
      style={{ color: enabled ? "#22c55e" : "var(--text-secondary)" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
      title={enabled ? "Disable launch at login" : "Enable launch at login"}
    >
      {enabled ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3l18 18"
          />
        </svg>
      )}
    </button>
  );
}
