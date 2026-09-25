"use client";
import { useState } from "react";

function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Centered, blocking modal for one due follow-up at a time — deliberately
// has no close/X and the backdrop click does nothing, so an employee can't
// silently dismiss a due follow-up. The only ways out are the two actions
// below: actually go handle it, or consciously log why it's being skipped.
export default function FollowUpModal({ lead, onFollowUpNow, onIgnore }) {
  const [ignoring, setIgnoring] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const startIgnore = () => {
    setIgnoring(true);
    setReason("");
    setReasonError("");
    setSubmitError("");
  };

  const cancelIgnore = () => {
    setIgnoring(false);
    setReasonError("");
    setSubmitError("");
  };

  const submitIgnore = async () => {
    if (!reason.trim()) {
      setReasonError("A reason is required to ignore this follow-up.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await onIgnore(lead, reason.trim());
    } catch (e) {
      setSubmitError(e?.response?.data?.error || "Could not submit — try again");
      setSubmitting(false);
    }
  };

  const note = lead.notes?.trim();

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10500, padding: 20,
      }}
    >
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, padding: "26px 26px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--warn)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, fontFamily: "var(--font-main)" }}>
          ⏰ Follow-up Due
        </div>
        <div style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 19, color: "var(--text-primary)" }}>{lead.name}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{lead.phone} · was due {fmtTime(lead.follow_up_date)}</div>

        {note && (
          <div style={{ marginTop: 16, padding: "10px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "var(--font-main)" }}>Follow-up Note</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{note}</div>
          </div>
        )}
        {lead.last_message && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "var(--font-main)" }}>Last Message</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{lead.last_message}</div>
          </div>
        )}

        {!ignoring ? (
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button
              onClick={startIgnore}
              style={{ flex: 1, padding: "11px 0", borderRadius: 9, background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-main)" }}
            >
              Ignore
            </button>
            <button
              onClick={() => onFollowUpNow(lead)}
              style={{ flex: 1, padding: "11px 0", borderRadius: 9, background: "var(--teal)", border: "none", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-main)" }}
            >
              Follow Up Now
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            <label style={{ display: "block", fontSize: 10, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-main)" }}>
              Why are you ignoring this follow-up? *
            </label>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => { setReason(e.target.value); if (reasonError) setReasonError(""); }}
              rows={3}
              placeholder="e.g. Customer asked to call back next week, unreachable, already handled over WhatsApp..."
              style={{ width: "100%", padding: "9px 11px", background: "var(--bg-input)", border: `1px solid ${reasonError ? "var(--danger)" : "var(--border)"}`, borderRadius: 8, color: "var(--text-primary)", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "var(--font-main)" }}
            />
            {reasonError && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 6 }}>{reasonError}</div>}
            {submitError && (
              <div style={{ fontSize: 12, color: "var(--danger)", background: "rgba(224,82,82,0.1)", border: "1px solid rgba(224,82,82,0.3)", borderRadius: 8, padding: "8px 12px", marginTop: 8 }}>
                {submitError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                disabled={submitting}
                onClick={cancelIgnore}
                style={{ flex: 1, padding: "11px 0", borderRadius: 9, background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13.5, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "var(--font-main)" }}
              >
                Back
              </button>
              <button
                disabled={submitting}
                onClick={submitIgnore}
                style={{ flex: 1, padding: "11px 0", borderRadius: 9, background: submitting ? "var(--bg-hover)" : "var(--danger)", border: "none", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "var(--font-main)" }}
              >
                {submitting ? "Submitting…" : "Confirm Ignore"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
