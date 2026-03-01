import { useState, useEffect, useCallback } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

export function useAutostart() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isEnabled()
      .then(setEnabled)
      .catch((err) => console.error("Autostart check failed:", err))
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (enabled) {
        await disable();
      } else {
        await enable();
      }
      // Re-read from OS to confirm the change took effect
      const current = await isEnabled();
      setEnabled(current);
    } catch (err) {
      console.error("Autostart toggle failed:", err);
    }
  }, [enabled]);

  return { enabled, loading, toggle };
}
