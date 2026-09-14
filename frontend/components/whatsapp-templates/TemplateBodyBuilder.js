"use client";
import { useRef } from "react";
import TemplateVariableManager from "./TemplateVariableManager";
import { label, sectionCard, textarea } from "./shared-styles";

export default function TemplateBodyBuilder({ body, onChange }) {
  const ref = useRef(null);

  const setText = (text) => onChange({ ...body, text });
  const insertVariable = (position) => {
    const el = ref.current;
    const cursor = el ? el.selectionStart : (body.text || "").length;
    const text = body.text || "";
    const next = `${text.slice(0, cursor)}{{${position}}}${text.slice(cursor)}`;
    onChange({ ...body, text: next });
  };

  return (
    <div style={sectionCard}>
      <div style={label}>Body *</div>
      <textarea
        ref={ref}
        value={body.text || ""}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Hello {{1}} 👋\n\nYour order {{2}} has been confirmed.\nAmount: ₹{{3}}\n\nThank you for shopping with us ❤️"}
        maxLength={1024}
        style={textarea}
      />
      <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 4, textAlign: "right" }}>{(body.text || "").length}/1024</div>
      <TemplateVariableManager
        text={body.text}
        variables={body.variables}
        onVariablesChange={(variables) => onChange({ ...body, variables })}
        onInsertVariable={insertVariable}
      />
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>
        Emojis and line breaks are fine. Variables must be sequential — {"{{1}}"}, then {"{{2}}"}, and so on.
      </div>
    </div>
  );
}
