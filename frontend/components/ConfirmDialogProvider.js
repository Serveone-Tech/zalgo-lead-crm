"use client";
import { createContext, useContext, useState } from "react";

const ConfirmContext = createContext(null);

// confirmDialog({ title, message, confirmLabel, cancelLabel, danger, onConfirm? })
//   - No onConfirm: resolves true/false the moment a button is clicked — drop-in
//     replacement for `if (!confirm("...")) return;`.
//   - With onConfirm (async): the dialog stays open and shows a loading state on
//     the confirm button while it runs, blocks a second click, and only resolves
//     true once onConfirm() actually succeeds — an onConfirm that throws shows
//     the error inline and leaves the dialog open to retry/cancel, it never
//     closes on failure. This is what "don't close prematurely / no double-
//     submit" means in practice for an action that's really an API call.
export function ConfirmDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const confirmDialog = (opts) => {
    return new Promise((resolve) => {
      setError("");
      setDialog({ ...opts, resolve });
    });
  };

  const close = (result) => {
    if (dialog) dialog.resolve(result);
    setDialog(null);
    setSubmitting(false);
    setError("");
  };

  const handleConfirm = async () => {
    if (!dialog || submitting) return;
    if (dialog.onConfirm) {
      setSubmitting(true);
      setError("");
      try {
        await dialog.onConfirm();
        close(true);
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || "Something went wrong");
        setSubmitting(false);
      }
    } else {
      close(true);
    }
  };

  return (
    <ConfirmContext.Provider value={confirmDialog}>
      {children}
      {dialog && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget && !submitting) close(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: 20 }}
        >
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, width: "100%", maxWidth: 420 }}>
            <div style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 10 }}>{dialog.title}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: error ? 10 : 20 }}>{dialog.message}</div>
            {error && (
              <div style={{ fontSize: 12, color: "var(--danger)", background: "rgba(224,82,82,0.1)", border: "1px solid rgba(224,82,82,0.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 16 }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                disabled={submitting}
                onClick={() => close(false)}
                style={{ padding: "9px 18px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "var(--font-main)" }}
              >
                {dialog.cancelLabel || "Cancel"}
              </button>
              <button
                disabled={submitting}
                onClick={handleConfirm}
                style={{
                  padding: "9px 20px", borderRadius: 8, border: "none",
                  background: submitting ? "var(--bg-hover)" : (dialog.danger ? "var(--danger)" : "var(--teal)"),
                  color: "#fff", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Processing…" : (dialog.confirmLabel || "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmContext);
  if (ctx === null) throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  return ctx;
}
