"use client";
import { Plus, Trash2, ExternalLink, Phone, MessageSquare } from "lucide-react";
import { extractVariablePositions, MAX_BUTTONS } from "../../lib/template-validator";
import { label, sectionCard, textInput } from "./shared-styles";

const TYPE_META = {
  QUICK_REPLY: { label: "Quick Reply", icon: MessageSquare },
  URL: { label: "Visit Website", icon: ExternalLink },
  PHONE_NUMBER: { label: "Call Phone Number", icon: Phone },
};

export default function TemplateButtonBuilder({ buttons, onChange, maxButtons = MAX_BUTTONS, bare = false }) {
  const list = buttons || [];
  const urlCount = list.filter((b) => b.type === "URL").length;
  const phoneCount = list.filter((b) => b.type === "PHONE_NUMBER").length;

  const addButton = (type) => {
    if (list.length >= maxButtons) return;
    if (type === "URL" && urlCount >= 1) return;
    if (type === "PHONE_NUMBER" && phoneCount >= 1) return;
    onChange([...list, { type, text: "", url: "", url_example: "", phone_number: "" }]);
  };
  const updateButton = (i, patch) => onChange(list.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const removeButton = (i) => onChange(list.filter((_, idx) => idx !== i));

  return (
    <div style={bare ? undefined : sectionCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ ...label, marginBottom: 0 }}>Buttons (optional, up to {maxButtons})</div>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{list.length}/{maxButtons}</span>
      </div>

      {list.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
          {list.map((b, i) => {
            const urlPositions = extractVariablePositions(b.url);
            const Icon = TYPE_META[b.type]?.icon || MessageSquare;
            return (
              <div key={i} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Icon size={13} color="var(--teal)" />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", fontFamily: "var(--font-main)", flex: 1 }}>
                    {TYPE_META[b.type]?.label || b.type}
                  </span>
                  <button type="button" onClick={() => removeButton(i)} style={iconBtn}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <input
                  value={b.text || ""}
                  onChange={(e) => updateButton(i, { text: e.target.value })}
                  placeholder="Button text (e.g. Shop Now)"
                  maxLength={25}
                  style={{ ...textInput, marginBottom: 8 }}
                />
                {b.type === "URL" && (
                  <>
                    <input
                      value={b.url || ""}
                      onChange={(e) => updateButton(i, { url: e.target.value })}
                      placeholder="https://example.com or https://example.com/order/{{1}}"
                      style={textInput}
                    />
                    {urlPositions.length === 1 && (
                      <input
                        value={b.url_example || ""}
                        onChange={(e) => updateButton(i, { url_example: e.target.value })}
                        placeholder="Sample value for {{1}} (e.g. ORD12345)"
                        style={{ ...textInput, marginTop: 8 }}
                      />
                    )}
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 6 }}>
                      Add {"{{1}}"} at the end of the URL for a per-recipient dynamic link.
                    </div>
                  </>
                )}
                {b.type === "PHONE_NUMBER" && (
                  <input
                    value={b.phone_number || ""}
                    onChange={(e) => updateButton(i, { phone_number: e.target.value })}
                    placeholder="+91XXXXXXXXXX"
                    style={textInput}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <AddBtn disabled={list.length >= maxButtons} onClick={() => addButton("QUICK_REPLY")} label="Quick Reply" />
        <AddBtn disabled={list.length >= maxButtons || urlCount >= 1} onClick={() => addButton("URL")} label="Website URL" />
        <AddBtn disabled={list.length >= maxButtons || phoneCount >= 1} onClick={() => addButton("PHONE_NUMBER")} label="Phone Number" />
      </div>
    </div>
  );
}

function AddBtn({ disabled, onClick, label }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 12px",
        borderRadius: 7,
        border: "1px dashed var(--border-strong)",
        background: "transparent",
        color: disabled ? "var(--text-muted)" : "var(--teal)",
        fontSize: 11.5,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "var(--font-main)",
      }}
    >
      <Plus size={12} /> {label}
    </button>
  );
}

const iconBtn = {
  background: "transparent",
  border: "none",
  color: "var(--danger)",
  cursor: "pointer",
  padding: 2,
  display: "flex",
};
