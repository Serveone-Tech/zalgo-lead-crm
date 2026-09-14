"use client";

// Local DRAFT/ERROR/SUBMITTING states plus Meta's own PENDING/APPROVED/
// REJECTED/PAUSED/DISABLED — whichever the template row currently has.
const STATUS_STYLES = {
  draft: { bg: "var(--bg-hover)", color: "var(--text-muted)", label: "Draft" },
  submitting: { bg: "var(--blue-dim)", color: "var(--blue)", label: "Submitting…" },
  pending: { bg: "var(--warn-dim)", color: "var(--warn)", label: "Pending Review" },
  approved: { bg: "var(--success-dim)", color: "var(--success)", label: "Approved" },
  rejected: { bg: "var(--danger-dim)", color: "var(--danger)", label: "Rejected" },
  paused: { bg: "var(--warn-dim)", color: "var(--warn)", label: "Paused" },
  disabled: { bg: "var(--danger-dim)", color: "var(--danger)", label: "Disabled" },
  error: { bg: "var(--danger-dim)", color: "var(--danger)", label: "Error" },
};

export default function TemplateStatusBadge({ status, size = "md" }) {
  const s = STATUS_STYLES[status] || { bg: "var(--bg-hover)", color: "var(--text-muted)", label: status || "Unknown" };
  const small = size === "sm";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: s.bg,
        color: s.color,
        fontSize: small ? 10 : 11,
        fontWeight: 700,
        borderRadius: 20,
        padding: small ? "2px 8px" : "3px 10px",
        fontFamily: "var(--font-main)",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}
