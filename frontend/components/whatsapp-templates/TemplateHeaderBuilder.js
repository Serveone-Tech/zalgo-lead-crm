"use client";
import { useRef } from "react";
import { Image as ImageIcon, Video, FileText, Type, Ban } from "lucide-react";
import TemplateVariableManager from "./TemplateVariableManager";
import MediaUploadField from "./MediaUploadField";
import { label, sectionCard, textInput } from "./shared-styles";

// The header-type list is data-driven so a future Meta-supported format
// just needs a new entry here (plus a validator/payload change) — not a
// rewrite of this component. Media formats go through Meta's Resumable
// Upload API (backend/utils/meta-media-upload.js) via MediaUploadField.
const HEADER_TYPES = [
  { format: "NONE", label: "None", icon: Ban },
  { format: "TEXT", label: "Text", icon: Type },
  { format: "IMAGE", label: "Image", icon: ImageIcon },
  { format: "VIDEO", label: "Video", icon: Video },
  { format: "DOCUMENT", label: "Document", icon: FileText },
];

export default function TemplateHeaderBuilder({ header, onChange }) {
  const inputRef = useRef(null);

  const setFormat = (format) => onChange({ format, text: "", variables: [] });
  const setText = (text) => onChange({ ...header, text });
  const insertVariable = (position) => {
    const el = inputRef.current;
    const cursor = el ? el.selectionStart : (header.text || "").length;
    const text = header.text || "";
    const next = `${text.slice(0, cursor)}{{${position}}}${text.slice(cursor)}`;
    onChange({ ...header, text: next });
  };

  return (
    <div style={sectionCard}>
      <div style={label}>Header</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {HEADER_TYPES.map((t) => {
          const active = header.format === t.format;
          const Icon = t.icon;
          return (
            <button
              key={t.format}
              type="button"
              onClick={() => setFormat(t.format)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                borderRadius: 8,
                border: `1px solid ${active ? "var(--teal)" : "var(--border)"}`,
                background: active ? "var(--teal-dim)" : "var(--bg-input)",
                color: active ? "var(--teal-light)" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-main)",
              }}
            >
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {header.format === "TEXT" && (
        <>
          <input
            ref={inputRef}
            value={header.text || ""}
            onChange={(e) => setText(e.target.value)}
            placeholder='e.g. "🔥 Hello {{1}}"'
            maxLength={60}
            style={textInput}
          />
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 4, textAlign: "right" }}>{(header.text || "").length}/60</div>
          <TemplateVariableManager
            text={header.text}
            variables={header.variables}
            onVariablesChange={(variables) => onChange({ ...header, variables })}
            onInsertVariable={insertVariable}
            maxVariables={1}
          />
        </>
      )}

      {["IMAGE", "VIDEO", "DOCUMENT"].includes(header.format) && (
        <MediaUploadField format={header.format} value={header} onChange={(media) => onChange({ ...header, ...media })} />
      )}
    </div>
  );
}
