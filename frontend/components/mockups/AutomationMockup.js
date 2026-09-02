"use client";
import { Mail, MessageSquare } from "lucide-react";
import { teal, border, muted, sub, ink } from "../../lib/marketing-theme";
import { WhatsAppGlyph } from "../BrandIcons";
import MockupShell from "./MockupShell";

const Toggle = ({ on }) => (
  <div style={{ width: 26, height: 14, borderRadius: 20, background: on ? teal : "#dfe2e5", position: "relative", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: 2, [on ? "right" : "left"]: 2, width: 10, height: 10, borderRadius: "50%", background: "#fff" }} />
  </div>
);

const CHANNELS = [
  { icon: <Mail size={13} color={muted} />, label: "Email (SendGrid)", sub: "Outbound automated emails", on: false },
  { icon: <MessageSquare size={13} color={muted} />, label: "SMS (Twilio)", sub: "Outbound automated SMS", on: false },
  { icon: <WhatsAppGlyph size={16} />, label: "WhatsApp (Meta Cloud API)", sub: "Active", on: true, active: true },
];

// Automation mockup — mirrors the app's real Channel Setup tab (per-
// channel toggle cards) with fictional/blank credential fields.
export default function AutomationMockup() {
  return (
    <MockupShell active="Automation">
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Automation</div>
        <div style={{ fontSize: 7, color: muted, marginTop: 1 }}>Send automated messages via Email, SMS &amp; WhatsApp</div>
      </div>

      <div style={{ display: "flex", gap: 14, borderBottom: `1px solid ${border}`, margin: "10px 0 12px" }}>
        {["Channel Setup", "Triggers", "Manual Send", "Lead Sources"].map((t, i) => (
          <div
            key={t}
            style={{
              fontSize: 7.5,
              fontWeight: 700,
              color: i === 0 ? teal : muted,
              borderBottom: i === 0 ? `2px solid ${teal}` : "2px solid transparent",
              paddingBottom: 6,
            }}
          >
            {t}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CHANNELS.map((c) => (
          <div
            key={c.label}
            style={{
              background: "#fff",
              border: `1px solid ${c.active ? teal : border}`,
              borderLeft: c.active ? `2px solid ${teal}` : `1px solid ${border}`,
              borderRadius: 8,
              padding: "9px 12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: c.active ? 8 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {c.icon}
                <div>
                  <div style={{ fontSize: 8.5, fontWeight: 700, color: ink }}>{c.label}</div>
                  {c.active && <div style={{ fontSize: 6.5, color: "#1f8a5c", fontWeight: 600 }}>● {c.sub}</div>}
                </div>
              </div>
              <Toggle on={c.on} />
            </div>
            {c.active && (
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ flex: 1, background: "#f5f6f7", border: `1px solid ${border}`, borderRadius: 5, padding: "5px 8px", fontSize: 6.5, color: sub }}>
                  Phone Number ID: 12615•••••
                </div>
                <div style={{ flex: 1, background: "#f5f6f7", border: `1px solid ${border}`, borderRadius: 5, padding: "5px 8px", fontSize: 6.5, color: sub }}>
                  Access Token: ••••••••••
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </MockupShell>
  );
}
