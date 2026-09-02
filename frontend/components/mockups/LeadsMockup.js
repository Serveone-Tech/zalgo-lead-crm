"use client";
import { Search } from "lucide-react";
import { teal, border, muted, sub, ink } from "../../lib/marketing-theme";
import MockupShell from "./MockupShell";

const ROWS = [
  { n: "Karan Mehta", p: "98765 43210", src: "WhatsApp", stage: "Order Confirm", sc: "#1f8a5c", asg: "Riya S." },
  { n: "Sneha Patil", p: "91234 56789", src: "LinkedIn", stage: "Follow-up", sc: "#b06a00", asg: "Aman K." },
  { n: "Deepak Rao", p: "99876 54321", src: "Meta Ads", stage: "Ringing", sc: "#c8372f", asg: "Riya S." },
  { n: "Farhan Ali", p: "97654 32109", src: "Phone Call", stage: "New", sc: "#2a6fb0", asg: "Aman K." },
  { n: "Meena Iyer", p: "90123 45678", src: "Google Ads", stage: "Order Confirm", sc: "#1f8a5c", asg: "Riya S." },
];

// Leads-table mockup — mirrors the app's real Leads list (search/filter
// bar, assignee + stage columns, per-row actions) with fictional data.
export default function LeadsMockup() {
  return (
    <MockupShell active="Leads">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Leads</div>
          <div style={{ fontSize: 7, color: muted, marginTop: 1 }}>1,363 total leads</div>
        </div>
        <div style={{ background: teal, color: "#fff", borderRadius: 6, padding: "5px 10px", fontSize: 8, fontWeight: 700 }}>+ Add Lead</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", border: `1px solid ${border}`, borderRadius: 6, padding: "5px 9px", marginBottom: 10 }}>
        <Search size={10} color={muted} />
        <span style={{ fontSize: 8, color: muted }}>Search by name, phone, notes...</span>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 0.9fr 0.9fr", background: "#f5f6f7", padding: "6px 10px" }}>
          {["Name / Phone", "Source", "Stage", "Assigned"].map((h) => (
            <div key={h} style={{ fontSize: 6.5, color: muted, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase" }}>
              {h}
            </div>
          ))}
        </div>
        {ROWS.map((r, i) => (
          <div
            key={r.n}
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 1fr 0.9fr 0.9fr",
              padding: "7px 10px",
              alignItems: "center",
              borderTop: i > 0 ? `1px solid ${border}` : "none",
            }}
          >
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, color: ink }}>{r.n}</div>
              <div style={{ fontSize: 6.5, color: muted }}>{r.p}</div>
            </div>
            <div style={{ fontSize: 7, color: sub }}>{r.src}</div>
            <span
              style={{
                fontSize: 6.5,
                fontWeight: 700,
                color: r.sc,
                background: `${r.sc}18`,
                borderRadius: 10,
                padding: "2px 7px",
                width: "fit-content",
              }}
            >
              {r.stage}
            </span>
            <div style={{ fontSize: 7, color: sub }}>{r.asg}</div>
          </div>
        ))}
      </div>
    </MockupShell>
  );
}
