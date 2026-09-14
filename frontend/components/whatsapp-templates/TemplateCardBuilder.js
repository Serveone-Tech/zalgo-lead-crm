"use client";
import { useRef } from "react";
import { Image as ImageIcon, Video, Copy, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import MediaUploadField from "./MediaUploadField";
import TemplateVariableManager from "./TemplateVariableManager";
import TemplateButtonBuilder from "./TemplateButtonBuilder";
import { MAX_CAROUSEL_CARD_BUTTONS } from "../../lib/template-validator";
import { label, textInput } from "./shared-styles";

// One card inside a carousel template — its own image/video header
// (Meta requires media here, no text/none header on carousel cards),
// body text with variables, and up to 2 buttons.
export default function TemplateCardBuilder({ card, index, total, onChange, onDuplicate, onDelete, onMoveUp, onMoveDown }) {
  const bodyRef = useRef(null);
  const header = card.header || { format: "IMAGE" };
  const body = card.body || { text: "", variables: [] };

  const insertVariable = (position) => {
    const el = bodyRef.current;
    const cursor = el ? el.selectionStart : (body.text || "").length;
    const text = body.text || "";
    const next = `${text.slice(0, cursor)}{{${position}}}${text.slice(cursor)}`;
    onChange({ ...card, body: { ...body, text: next } });
  };

  return (
    <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-main)" }}>Card {index + 1}</span>
        <div style={{ display: "flex", gap: 5 }}>
          <button type="button" onClick={onMoveUp} disabled={index === 0} style={iconBtn(index === 0)} title="Move up"><ChevronUp size={13} /></button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1} style={iconBtn(index === total - 1)} title="Move down"><ChevronDown size={13} /></button>
          <button type="button" onClick={onDuplicate} style={iconBtn(false)} title="Duplicate card"><Copy size={13} /></button>
          <button type="button" onClick={onDelete} style={{ ...iconBtn(false), color: "var(--danger)" }} title="Delete card"><Trash2 size={13} /></button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[{ format: "IMAGE", icon: ImageIcon }, { format: "VIDEO", icon: Video }].map((t) => {
          const active = header.format === t.format;
          const Icon = t.icon;
          return (
            <button
              key={t.format}
              type="button"
              onClick={() => onChange({ ...card, header: { format: t.format } })}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7,
                border: `1px solid ${active ? "var(--teal)" : "var(--border)"}`,
                background: active ? "var(--teal-dim)" : "var(--bg-card)",
                color: active ? "var(--teal-light)" : "var(--text-secondary)",
                fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-main)",
              }}
            >
              <Icon size={12} /> {t.format === "IMAGE" ? "Image" : "Video"}
            </button>
          );
        })}
      </div>

      <MediaUploadField format={header.format} value={header} onChange={(media) => onChange({ ...card, header: { ...header, ...media } })} compact />

      <div style={{ ...label, marginTop: 12 }}>Body *</div>
      <textarea
        ref={bodyRef}
        value={body.text || ""}
        onChange={(e) => onChange({ ...card, body: { ...body, text: e.target.value } })}
        placeholder='e.g. "Black Formal Derby ₹899"'
        maxLength={160}
        style={{ ...textInput, minHeight: 60, resize: "vertical" }}
      />
      <TemplateVariableManager
        text={body.text}
        variables={body.variables}
        onVariablesChange={(variables) => onChange({ ...card, body: { ...body, variables } })}
        onInsertVariable={insertVariable}
      />

      <div style={{ marginTop: 10 }}>
        <TemplateButtonBuilder
          buttons={card.buttons}
          onChange={(buttons) => onChange({ ...card, buttons })}
          maxButtons={MAX_CAROUSEL_CARD_BUTTONS}
          bare
        />
      </div>
    </div>
  );
}

function iconBtn(disabled) {
  return {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 24, height: 24, borderRadius: 6, border: "1px solid var(--border)",
    background: "transparent", color: disabled ? "var(--text-muted)" : "var(--text-secondary)",
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
  };
}
