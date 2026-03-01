import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
  onRefresh: () => void;
  onFocusSearch: () => void;
  onClearSearch: () => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
  onCopySelected: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // Cmd/Ctrl+R — Refresh
      if (meta && e.key === "r") {
        e.preventDefault();
        handlers.onRefresh();
        return;
      }

      // Cmd/Ctrl+F — Focus search
      if (meta && e.key === "f") {
        e.preventDefault();
        handlers.onFocusSearch();
        return;
      }

      // Cmd/Ctrl+C — Copy selected (only when not in input)
      if (meta && e.key === "c" && !isInput) {
        e.preventDefault();
        handlers.onCopySelected();
        return;
      }

      // Escape — Clear search
      if (e.key === "Escape") {
        e.preventDefault();
        handlers.onClearSearch();
        return;
      }

      // Arrow keys — Navigate rows (only when not in input)
      if (!isInput) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          handlers.onNavigateUp();
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          handlers.onNavigateDown();
          return;
        }
      }
    },
    [handlers],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
