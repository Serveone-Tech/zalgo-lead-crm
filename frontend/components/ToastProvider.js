"use client";
import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

let idCounter = 0;

// Two call shapes:
//   showToast("Saved!", "success")                      -- plain text, auto-dismiss (drop-in for every old alert()/local toast)
//   showToast({ content, actions, persistent, type })    -- rich variant: custom JSX + action buttons, no auto-dismiss —
//                                                            used by the follow-up popup (Feature 2), not a separate UI.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const showToast = useCallback((arg1, arg2) => {
    const opts = typeof arg1 === "string" ? { message: arg1, type: arg2 || "success" } : arg1 || {};
    const id = ++idCounter;
    const toast = {
      id,
      type: opts.type || "success",
      message: opts.message,
      content: opts.content,
      actions: opts.actions,
      persistent: !!opts.persistent,
    };
    setToasts((t) => [...t, toast]);
    if (!toast.persistent) {
      setTimeout(() => dismiss(id), 4000);
    }
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 380,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const bg = toast.type === "error" ? "var(--danger)" : toast.type === "info" ? "var(--teal)" : "var(--success)";

  if (toast.content) {
    return (
      <div
        style={{
          position: "relative",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
          overflow: "hidden",
          pointerEvents: "auto",
        }}
      >
        <button
          onClick={onDismiss}
          title="Dismiss"
          style={{ position: "absolute", top: 8, right: 10, background: "none", border: "none", color: "var(--text-muted)", fontSize: 16, cursor: "pointer", lineHeight: 1 }}
        >
          ✕
        </button>
        <div style={{ padding: "14px 32px 14px 14px" }}>{toast.content}</div>
        {toast.actions && toast.actions.length > 0 && (
          <div style={{ display: "flex", borderTop: "1px solid var(--border)" }}>
            {toast.actions.map((a, i) => (
              <button
                key={i}
                onClick={() => { a.onClick(); if (!a.keepOpen) onDismiss(); }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "transparent",
                  border: "none",
                  borderRight: i < toast.actions.length - 1 ? "1px solid var(--border)" : "none",
                  color: a.danger ? "var(--danger)" : "var(--teal-light)",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "var(--font-main)",
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onDismiss}
      style={{
        background: bg,
        color: "#fff",
        borderRadius: 10,
        padding: "12px 16px 12px 20px",
        fontFamily: "var(--font-main)",
        fontWeight: 600,
        fontSize: 13,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
        pointerEvents: "auto",
      }}
    >
      <span>{toast.message}</span>
      <span style={{ opacity: 0.75, fontSize: 12 }}>✕</span>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.showToast;
}
