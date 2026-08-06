"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error";
  onDismiss: () => void;
  duration?: number;
};

export default function Toast({
  message,
  type = "success",
  onDismiss,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onDismiss]);

  const styles =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-sm"
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${styles}`}
      >
        <p className="flex-1">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="rounded p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
