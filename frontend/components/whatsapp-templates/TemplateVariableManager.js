"use client";
import { extractVariablePositions } from "../../lib/template-validator";

// Shown under any text field that supports {{n}} variables (header/body).
// Positions are derived from the text itself (source of truth), not typed
// separately — this component's job is just to make sure every {{n}}
// actually present in the text has a friendly name + sample value attached,
// and to offer a one-click "insert next variable" button so a user never
// has to hand-type {{2}}, {{3}}... themselves.
export default function TemplateVariableManager({ text, variables, onVariablesChange, onInsertVariable, maxVariables }) {
  const positions = extractVariablePositions(text);
  const nextPosition = positions.length > 0 ? Math.max(...positions) + 1 : 1;
  const atMax = maxVariables != null && positions.length >= maxVariables;

  const updateVar = (position, field, value) => {
    const existing = variables || [];
    const idx = existing.findIndex((v) => v.position === position);
    const next = [...existing];
    if (idx >= 0) next[idx] = { ...next[idx], [field]: value };
    else next.push({ position, name: "", sample: "", [field]: value });
    onVariablesChange(next);
  };

  if (positions.length === 0 && maxVariables === 0) return null;

  return (
    <div style={{ marginTop: 10 }}>
      {positions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
          {positions.map((pos) => {
            const v = (variables || []).find((x) => x.position === pos) || {};
            return (
              <div key={pos} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}>
                <span style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 12, color: "var(--teal)", flexShrink: 0, minWidth: 36 }}>
                  {`{{${pos}}}`}
                </span>
                <input
                  value={v.name || ""}
                  onChange={(e) => updateVar(pos, "name", e.target.value)}
                  placeholder="Variable name (e.g. Customer Name)"
                  style={varInput}
                />
                <input
                  value={v.sample || ""}
                  onChange={(e) => updateVar(pos, "sample", e.target.value)}
                  placeholder="Sample value (e.g. Rahul)"
                  style={{ ...varInput, borderColor: !v.sample?.trim() ? "var(--danger)" : "var(--border)" }}
                />
              </div>
            );
          })}
        </div>
      )}
      {onInsertVariable && !atMax && (
        <button
          type="button"
          onClick={() => onInsertVariable(nextPosition)}
          style={{
            background: "transparent",
            border: "1px dashed var(--border-strong)",
            borderRadius: 7,
            padding: "6px 12px",
            color: "var(--teal)",
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-main)",
          }}
        >
          {`+ Insert {{${nextPosition}}}`}
        </button>
      )}
    </div>
  );
}

const varInput = {
  flex: 1,
  padding: "6px 9px",
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text-primary)",
  fontSize: 12,
  outline: "none",
};
