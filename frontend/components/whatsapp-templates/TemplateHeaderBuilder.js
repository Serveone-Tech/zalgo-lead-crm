"use client";
import { useRef } from "react";
import { Image as ImageIcon, Video, FileText, Type, Ban } from "lucide-react";
import TemplateVariableManager from "./TemplateVariableManager";
import { label, sectionCard, textInput } from "./shared-styles";

// Media headers (IMAGE/VIDEO/DOCUMENT) need Meta's resumable upload-session
// API, which isn't wired up yet — showing them as disabled with an
// explanation is safer than a header type that produces an invalid
// payload. The component list is deliberately data-driven so adding a real
// media header later is "flip mediaHeadersEnabled" plus a handler, not a
// UI rewrite (see /docs/whatsapp-template-builder.md).
const HEADER_TYPES = [
  { format: "NONE", label: "None", icon: Ban, enabled: true },
  { format: "TEXT", label: "Text", icon: Type, enabled: true },
  { format: "IMAGE", label: "Image", icon: ImageIcon, enabled: false },
  { format: "VIDEO", label: "Video", icon: Video, enabled: false },
  { format: "DOCUMENT", label: "Document", icon: FileText, enabled: false },
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
              disabled={!t.enabled}
              title={!t.enabled ? "Media headers need a media upload flow that isn't built yet — coming in a later update." : undefined}
              onClick={() => t.enabled && setFormat(t.format)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                borderRadius: 8,
                border: `1px solid ${active ? "var(--teal)" : "var(--border)"}`,
                background: active ? "var(--teal-dim)" : "var(--bg-input)",
                color: !t.enabled ? "var(--text-muted)" : active ? "var(--teal-light)" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: t.enabled ? "pointer" : "not-allowed",
                opacity: t.enabled ? 1 : 0.55,
                fontFamily: "var(--font-main)",
              }}
            >
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {!HEADER_TYPES.find((t) => t.format === header.format)?.enabled && header.format !== "NONE" && header.format !== "TEXT" && (
        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 8 }}>
          {header.format} headers aren't available yet — they require Meta's media upload flow, which is planned for a future update.
        </div>
      )}

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
    </div>
  );
}
