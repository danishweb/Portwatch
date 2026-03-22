import { useAutostart } from "../hooks/useAutostart";

export function AutostartToggle() {
  const { enabled, loading, toggle } = useAutostart();

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      className="btn-toolbar"
      style={enabled ? { color: "#22c55e" } : undefined}
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
