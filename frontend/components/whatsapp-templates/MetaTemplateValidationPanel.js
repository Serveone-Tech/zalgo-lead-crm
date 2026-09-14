"use client";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const CHECK_LABELS = [
  { field: "name", label: "Template name valid" },
  { field: "category", label: "Category selected" },
  { field: "language", label: "Language selected" },
  { field: "header", label: "Header valid" },
  { field: "body", label: "Body valid" },
  { field: "footer", label: "Footer valid" },
  { field: "buttons", label: "Buttons valid" },
];

export default function MetaTemplateValidationPanel({ validation }) {
  const errors = validation?.errors || [];
  const warnings = validation?.warnings || [];
  const hasFieldError = (field) => errors.some((e) => e.field === field);

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "16px 18px" }}>
      <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-main)", marginBottom: 12 }}>
        Template Validation
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: errors.length || warnings.length ? 14 : 0 }}>
        {CHECK_LABELS.map((c) => {
          const bad = hasFieldError(c.field);
          return (
            <div key={c.field} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: bad ? "var(--danger)" : "var(--text-secondary)" }}>
              {bad ? <XCircle size={14} color="var(--danger)" /> : <CheckCircle2 size={14} color="var(--success)" />}
              {c.label}
            </div>
          );
        })}
      </div>

      {errors.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: warnings.length ? 10 : 0 }}>
          {errors.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 12, color: "var(--danger)", background: "var(--danger-dim)", borderRadius: 7, padding: "7px 10px" }}>
              <XCircle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {warnings.map((w, i) => (
            <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 12, color: "var(--warn)", background: "var(--warn-dim)", borderRadius: 7, padding: "7px 10px" }}>
              <AlertTriangle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        Meta approval is determined by Meta. This validation only checks technical/template requirements — it can't guarantee Meta will approve the content.
      </div>
    </div>
  );
}
