"use client";
import { useState, useEffect } from "react";
import api from "../lib/api";

const VARS = ["{name}", "{phone}", "{email}", "{business_name}"];

// Compose-and-send for a hand-picked set of customers or leads (checkboxes
// on their list page) — same backend endpoint and per-channel senders as
// the segment-based Broadcast tab, just with an explicit id list instead
// of a segment rule. `target` picks which table the ids belong to.
export default function SendToSelectedModal({ customerIds, target = "customers", onClose, onSent }) {
  const [channels, setChannels] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [templateParams, setTemplateParams] = useState([]);
  const [whatsappRate, setWhatsappRate] = useState(0.85);

  useEffect(() => {
    api.get("/automation/whatsapp-templates").then((r) => setTemplates(r.data.filter((t) => t.status === "approved"))).catch(() => {});
    api.get("/automation/whatsapp-rate").then((r) => setWhatsappRate(r.data.rate)).catch(() => {});
  }, []);

  const toggleChannel = (ch) =>
    setChannels((c) => (c.includes(ch) ? c.filter((x) => x !== ch) : [...c, ch]));

  const usingTemplate = !!templateId;
  const selectedTemplate = templates.find((t) => String(t.id) === String(templateId));
  const extraVars = Math.max(0, (selectedTemplate?.variable_count || 1) - 1);
  const label = target === "leads" ? "lead" : "customer";

  const send = async () => {
    if ((!usingTemplate && !message.trim()) || channels.length === 0) return;
    const costNote =
      usingTemplate && channels.includes("whatsapp")
        ? ` (~₹${(customerIds.length * whatsappRate).toFixed(2)} estimated WhatsApp cost)`
        : "";
    if (!confirm(`Send this to ${customerIds.length} selected ${label}(s)?${costNote}`)) return;
    setSending(true);
    setError("");
    try {
      const { data } = await api.post("/automation/broadcast", {
        audience: "selected",
        target,
        customer_ids: customerIds,
        channels,
        message: message.trim(),
        template_id: templateId || undefined,
        template_params: templateParams,
      });
      onSent?.(data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 250, padding: 20 }}
    >
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "24px 22px", width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-main)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Message Selected {target === "leads" ? "Leads" : "Customers"}</h2>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {customerIds.length} {label}{customerIds.length !== 1 ? "s" : ""} selected
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {error && (
          <div style={{ marginBottom: 14, padding: "9px 13px", background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: 8, fontSize: 12, color: "var(--danger)" }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 10, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-main)" }}>
            Send Via
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { k: "email", l: "Email", icon: "✉️" },
              { k: "sms", l: "SMS", icon: "💬" },
              { k: "whatsapp", l: "WhatsApp", icon: "🟢" },
            ].map((ch) => (
              <button
                key={ch.k}
                onClick={() => toggleChannel(ch.k)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  border: `2px solid ${channels.includes(ch.k) ? "var(--teal)" : "var(--border)"}`,
                  background: channels.includes(ch.k) ? "var(--teal-dim)" : "transparent",
                  color: channels.includes(ch.k) ? "var(--teal-light)" : "var(--text-secondary)",
                  fontFamily: "var(--font-main)",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {ch.icon} {ch.l}
              </button>
            ))}
          </div>
        </div>

        {channels.includes("whatsapp") && (
          <div style={{ marginBottom: 16, padding: "12px 14px", background: "var(--bg-surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
            <label style={{ display: "block", fontSize: 10, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-main)" }}>
              WhatsApp Delivery
            </label>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.5 }}>
              Plain text only reaches {label}s who messaged you in the last 24 hours — use an approved template to reach anyone else.
            </div>
            {templates.length > 0 && (
              <select
                value={templateId}
                onChange={(e) => { setTemplateId(e.target.value); setTemplateParams([]); }}
                style={{ width: "100%", padding: "9px 11px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, outline: "none" }}
              >
                <option value="">— Plain text (24h window only) —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            {usingTemplate && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                  {"{{1}}"} is auto-filled with each {label}'s name.
                  {extraVars > 0 && " Fill in the rest below:"}
                </div>
                {Array.from({ length: extraVars }).map((_, i) => (
                  <input
                    key={i}
                    value={templateParams[i] || ""}
                    onChange={(e) => {
                      const next = [...templateParams];
                      next[i] = e.target.value;
                      setTemplateParams(next);
                    }}
                    placeholder={`{{${i + 2}}} value`}
                    style={{ width: "100%", padding: "9px 11px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, outline: "none", marginBottom: 6 }}
                  />
                ))}
                <div style={{ fontSize: 12, color: "var(--warn)", marginTop: 4 }}>
                  Estimated WhatsApp cost: ~₹{(customerIds.length * whatsappRate).toFixed(2)} ({customerIds.length} × ₹{whatsappRate}/msg)
                </div>
              </div>
            )}
          </div>
        )}

        {!usingTemplate && (
          <>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: 10, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-main)" }}>
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Hi {name}, ..."
                style={{
                  width: "100%",
                  padding: "9px 11px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                  resize: "vertical",
                  minHeight: 100,
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {VARS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMessage((m) => m + v)}
                  style={{ padding: "3px 10px", borderRadius: 20, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}
                >
                  {v}
                </button>
              ))}
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={send}
            disabled={sending || (!usingTemplate && !message.trim()) || channels.length === 0}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: sending || (!usingTemplate && !message.trim()) || channels.length === 0 ? "var(--bg-surface)" : "var(--teal)",
              color: "#fff",
              fontFamily: "var(--font-main)",
              fontWeight: 600,
              fontSize: 13,
              cursor: sending || (!usingTemplate && !message.trim()) || channels.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            {sending ? "Sending..." : "📣 Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
