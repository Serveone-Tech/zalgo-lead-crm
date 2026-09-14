"use client";
import { Send } from "lucide-react";

export default function MetaSubmissionDialog({ template, submitting, onCancel, onConfirm }) {
  const varCount = (template.body?.variables || []).length + (template.header?.variables || []).length;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}
    >
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "26px 24px", width: "100%", maxWidth: 440 }}>
        <h2 style={{ fontFamily: "var(--font-main)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
          Submit this template to Meta for review?
        </h2>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 18 }}>
          Once submitted, this template can't be edited directly — you'll need to duplicate it to make changes.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, marginBottom: 20 }}>
          <Row label="Template Name" value={template.name} />
          <Row label="Category" value={template.category} />
          <Row label="Language" value={template.language} />
          <Row label="Header" value={template.header?.format === "TEXT" ? "Text" : template.header?.format === "NONE" ? "None" : template.header?.format} />
          <Row label="Body preview" value={(template.body?.text || "").slice(0, 60) + ((template.body?.text || "").length > 60 ? "…" : "")} />
          <Row label="Buttons" value={template.buttons?.length ? `${template.buttons.length}` : "None"} />
          <Row label="Variables" value={String(varCount)} />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={submitting}
            style={{ padding: "9px 18px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13, cursor: submitting ? "not-allowed" : "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 20px", borderRadius: 8,
              background: submitting ? "var(--bg-hover)" : "var(--gradient-accent)",
              border: "none", color: "#fff", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13,
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: submitting ? "none" : "var(--shadow-glow)",
            }}
          >
            <Send size={14} /> {submitting ? "Submitting…" : "Submit for Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5 }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: "var(--text-primary)", fontWeight: 600, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
}
