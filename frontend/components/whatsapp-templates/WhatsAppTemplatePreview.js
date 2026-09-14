"use client";
import { Image as ImageIcon, Video, FileText, ExternalLink, Phone, MessageSquare } from "lucide-react";

// Substitutes each {{n}} with its sample value so the preview shows exactly
// what a reviewer (and eventually a real recipient) would see — falls back
// to the raw {{n}} token when no sample has been entered yet, so a user can
// tell at a glance which variables still need one.
function renderWithSamples(text, variables) {
  return String(text || "").replace(/\{\{(\d+)\}\}/g, (_, n) => {
    const v = variables?.find((x) => x.position === parseInt(n, 10));
    return v?.sample?.trim() || `{{${n}}}`;
  });
}

const BUTTON_ICON = { URL: ExternalLink, PHONE_NUMBER: Phone, QUICK_REPLY: MessageSquare };

export default function WhatsAppTemplatePreview({ template }) {
  const header = template.header || { format: "NONE" };
  const body = template.body || {};
  const footer = template.footer || {};
  const buttons = template.buttons || [];

  return (
    <div
      style={{
        background: "#0b141a",
        borderRadius: 16,
        padding: 20,
        maxWidth: 340,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          background: "#005c4b",
          borderRadius: "12px 12px 2px 12px",
          padding: 0,
          overflow: "hidden",
          boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
        }}
      >
        {header.format === "TEXT" && header.text?.trim() && (
          <div style={{ padding: "10px 12px 0", color: "#fff", fontWeight: 700, fontSize: 14, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {renderWithSamples(header.text, header.variables)}
          </div>
        )}
        {["IMAGE", "VIDEO", "DOCUMENT"].includes(header.format) && (
          <div style={{ margin: "10px 10px 0", background: "rgba(255,255,255,0.08)", borderRadius: 8, height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)" }}>
            {header.format === "IMAGE" && <ImageIcon size={28} />}
            {header.format === "VIDEO" && <Video size={28} />}
            {header.format === "DOCUMENT" && <FileText size={28} />}
          </div>
        )}

        <div style={{ padding: "10px 12px", color: "#e9edef", fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {body.text?.trim() ? renderWithSamples(body.text, body.variables) : (
            <span style={{ color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>Body text will appear here…</span>
          )}
        </div>

        {footer.text?.trim() && (
          <div style={{ padding: "0 12px 10px", color: "rgba(233,237,239,0.6)", fontSize: 11.5 }}>{footer.text}</div>
        )}

        {!footer.text?.trim() && <div style={{ paddingBottom: 4 }} />}

        {buttons.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            {buttons.map((b, i) => {
              const Icon = BUTTON_ICON[b.type] || MessageSquare;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    padding: "10px 12px",
                    color: "#53bdeb",
                    fontSize: 13,
                    fontWeight: 600,
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.12)" : "none",
                  }}
                >
                  <Icon size={13} /> {b.text?.trim() || "Button text"}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ textAlign: "center", fontSize: 10.5, color: "var(--text-muted)", marginTop: 10 }}>
        Live preview — variables shown with their sample values
      </div>
    </div>
  );
}
