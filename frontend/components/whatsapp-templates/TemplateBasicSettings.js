"use client";
import { slugifyTemplateName } from "../../lib/template-validator";
import { label, sectionCard, textInput } from "./shared-styles";

// A subset of the language codes Meta's Template API accepts — the exact
// codes it expects (not just a display name), since this value is sent
// straight through in the submission payload's `language` field.
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "en_US", label: "English (US)" },
  { code: "en_GB", label: "English (UK)" },
  { code: "hi", label: "Hindi" },
  { code: "hi_IN", label: "Hindi (India)" },
  { code: "mr", label: "Marathi" },
  { code: "gu", label: "Gujarati" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "bn", label: "Bengali" },
  { code: "es", label: "Spanish" },
  { code: "pt_BR", label: "Portuguese (Brazil)" },
  { code: "ar", label: "Arabic" },
];

const CATEGORIES = [
  { key: "MARKETING", label: "Marketing", hint: "Promotions, offers, announcements" },
  { key: "UTILITY", label: "Utility", hint: "Order updates, account alerts, reminders" },
  { key: "AUTHENTICATION", label: "Authentication", hint: "One-time passcodes" },
];

export default function TemplateBasicSettings({ template, onChange, nameLocked }) {
  const slug = slugifyTemplateName(template.name);

  return (
    <div style={sectionCard}>
      <div style={label}>Template Name *</div>
      <input
        value={template.name || ""}
        onChange={(e) => onChange({ ...template, name: e.target.value })}
        placeholder="summer_sale_2026"
        disabled={nameLocked}
        style={{ ...textInput, opacity: nameLocked ? 0.6 : 1 }}
      />
      {template.name && slug !== template.name && (
        <div style={{ fontSize: 11, color: "var(--warn)", marginTop: 5 }}>Will be saved as: {slug}</div>
      )}
      <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 5 }}>Lowercase letters, numbers and underscores only — no spaces.</div>

      <div style={{ ...label, marginTop: 16 }}>Category *</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {CATEGORIES.map((c) => {
          const active = template.category === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onChange({ ...template, category: c.key })}
              title={c.hint}
              style={{
                padding: "9px 10px",
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
              {c.label}
            </button>
          );
        })}
      </div>

      <div style={{ ...label, marginTop: 16 }}>Language *</div>
      <select
        value={template.language || "en_US"}
        onChange={(e) => onChange({ ...template, language: e.target.value })}
        style={{ ...textInput, cursor: "pointer" }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
}
