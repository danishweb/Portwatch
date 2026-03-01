import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 200);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-200 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{
        backgroundColor: "var(--bg-secondary)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-color)",
      }}
    >
      {message}
    </div>
  );
}
