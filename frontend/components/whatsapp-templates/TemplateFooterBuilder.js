"use client";
import { label, sectionCard, textInput } from "./shared-styles";

export default function TemplateFooterBuilder({ footer, onChange }) {
  return (
    <div style={sectionCard}>
      <div style={label}>Footer (optional)</div>
      <input
        value={footer?.text || ""}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder='e.g. "Reply STOP to opt out"'
        maxLength={60}
        style={textInput}
      />
      <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 4, textAlign: "right" }}>{(footer?.text || "").length}/60</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Footer text can't contain variables.</div>
    </div>
  );
}
