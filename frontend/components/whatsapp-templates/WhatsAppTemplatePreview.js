"use client";
import { Image as ImageIcon, Video, FileText, ExternalLink, Phone, MessageSquare } from "lucide-react";
import { API_ORIGIN } from "../../lib/api";

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
          header.media_url && header.format === "IMAGE" ? (
            <img src={`${API_ORIGIN}${header.media_url}`} alt="" style={{ margin: "10px 10px 0", width: "calc(100% - 20px)", height: 140, objectFit: "cover", borderRadius: 8, display: "block" }} />
          ) : header.media_url && header.format === "VIDEO" ? (
            <video src={`${API_ORIGIN}${header.media_url}`} controls style={{ margin: "10px 10px 0", width: "calc(100% - 20px)", height: 140, borderRadius: 8, display: "block", background: "#000" }} />
          ) : (
            <div style={{ margin: "10px 10px 0", background: "rgba(255,255,255,0.08)", borderRadius: 8, height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "rgba(255,255,255,0.5)" }}>
              {header.format === "IMAGE" && <ImageIcon size={28} />}
              {header.format === "VIDEO" && <Video size={28} />}
              {header.format === "DOCUMENT" && <FileText size={28} />}
              {header.format === "DOCUMENT" && header.file_name && (
                <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.6)" }}>{header.file_name}</span>
              )}
            </div>
          )
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

      {template.carousel?.cards?.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 10, paddingBottom: 4 }}>
          {template.carousel.cards.map((card, i) => (
            <div key={i} style={{ flexShrink: 0, width: 130, background: "#202c33", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
              {card.header?.media_url ? (
                card.header.format === "VIDEO" ? (
                  <video src={`${API_ORIGIN}${card.header.media_url}`} style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
                ) : (
                  <img src={`${API_ORIGIN}${card.header.media_url}`} alt="" style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
                )
              ) : (
                <div style={{ width: "100%", height: 80, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)" }}>
                  {card.header?.format === "VIDEO" ? <Video size={18} /> : <ImageIcon size={18} />}
                </div>
              )}
              <div style={{ padding: "6px 8px", color: "#e9edef", fontSize: 10.5, lineHeight: 1.4 }}>
                {card.body?.text ? renderWithSamples(card.body.text, card.body.variables) : <span style={{ opacity: 0.4, fontStyle: "italic" }}>Card text…</span>}
              </div>
              {(card.buttons || []).map((b, bi) => (
                <div key={bi} style={{ padding: "6px 8px", color: "#53bdeb", fontSize: 10, fontWeight: 600, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  {b.text?.trim() || "Button"}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", fontSize: 10.5, color: "var(--text-muted)", marginTop: 10 }}>
        Live preview — variables shown with their sample values
      </div>
    </div>
  );
}
