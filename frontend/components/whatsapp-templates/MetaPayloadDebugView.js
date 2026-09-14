"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { buildMetaComponents } from "../../lib/template-validator";

// Developer/debug tab — shows the exact `components` array Meta's Template
// API will receive, so a rejection can be cross-checked against Meta's own
// docs without guessing what was actually sent. No credentials/tokens ever
// pass through this — only the template's own structural payload.
export default function MetaPayloadDebugView({ template }) {
  const [copied, setCopied] = useState(false);

  const payload = {
    name: template.name,
    language: template.language,
    category: template.category,
    components: buildMetaComponents(template),
  };
  const json = JSON.stringify(payload, null, 2);

  const copy = () => {
    navigator.clipboard?.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-main)" }}>
          Meta Payload
        </div>
        <button
          onClick={copy}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px", color: copied ? "var(--success)" : "var(--teal)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy JSON"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          background: "var(--bg-input)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 12,
          fontSize: 11.5,
          color: "var(--text-secondary)",
          overflowX: "auto",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          lineHeight: 1.5,
          maxHeight: 420,
        }}
      >
        {json}
      </pre>
    </div>
  );
}
