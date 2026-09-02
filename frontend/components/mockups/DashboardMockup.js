"use client";
import { Users, Zap, TrendingUp, AlertTriangle, Bell, Search, BellRing } from "lucide-react";
import { teal, border, muted, sub } from "../../lib/marketing-theme";
import MockupShell from "./MockupShell";

const STATS = [
  { l: "Total Leads", v: "1,363", icon: <Users size={12} color={teal} /> },
  { l: "Active", v: "42", icon: <Zap size={12} color={teal} /> },
  { l: "Converted", v: "319", icon: <TrendingUp size={12} color="#1f8a5c" /> },
  { l: "Overdue", v: "17", icon: <AlertTriangle size={12} color="#c8372f" /> },
  { l: "Follow-up Today", v: "9", icon: <Bell size={12} color="#b06a00" /> },
];

const ROWS = [
  { n: "Rahul Sharma", p: "+91 98765 43210", s: "New", sc: "#2a6fb0", src: "WhatsApp" },
  { n: "Priya Verma", p: "+91 91234 56789", s: "Contacted", sc: "#b06a00", src: "Meta Lead Form" },
  { n: "Vivek Singh", p: "+91 99876 54321", s: "Follow-up", sc: "#565d63", src: "Missed Call" },
  { n: "Anjali Mehta", p: "+91 97654 32109", s: "Order Confirm", sc: "#00868a", src: "Google Ads" },
];

// Dashboard mockup — mirrors the app's real Dashboard layout (stat card
// row, recent leads, reminders) with entirely fictional sample data.
export default function DashboardMockup() {
  return (
    <MockupShell active="Dashboard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Dashboard</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#f2f3f5", borderRadius: 6, padding: "4px 8px" }}>
            <Search size={10} color={muted} />
            <span style={{ fontSize: 9, color: muted }}>Search leads, calls, notes...</span>
          </div>
          <BellRing size={13} color={sub} />
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: teal }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 7, marginBottom: 12 }}>
        {STATS.map((s) => (
          <div key={s.l} style={{ border: `1px solid ${border}`, borderRadius: 8, padding: "7px 8px", background: "#fff" }}>
            <div style={{ marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{s.v}</div>
            <div style={{ fontSize: 6.5, color: muted, marginTop: 1 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 10 }}>
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, padding: 9, background: "#fff" }}>
          <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 6 }}>Recent Leads</div>
          {ROWS.map((r) => (
            <div key={r.n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderTop: `1px solid ${border}` }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 8, fontWeight: 600 }}>{r.n}</div>
                <div style={{ fontSize: 7, color: muted }}>{r.p}</div>
              </div>
              <span style={{ fontSize: 6.5, fontWeight: 700, color: r.sc, background: `${r.sc}18`, borderRadius: 10, padding: "2px 6px", whiteSpace: "nowrap" }}>
                {r.s}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ border: `1px solid ${border}`, borderRadius: 8, padding: 9, background: "#fff" }}>
            <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4 }}>Follow-ups Today</div>
            {["Follow up with Priya · 15m", "Call back Vivek · 30m", "Send proposal · 1h"].map((r) => (
              <div key={r} style={{ fontSize: 6.5, color: sub, marginBottom: 4 }}>
                {r}
              </div>
            ))}
          </div>
          <div style={{ border: `1px solid ${border}`, borderRadius: 8, padding: 9, textAlign: "center", background: "#fff" }}>
            <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4 }}>Today&apos;s Calls</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: teal }}>28</div>
            <div style={{ fontSize: 6.5, color: muted }}>Total Calls</div>
          </div>
        </div>
      </div>
    </MockupShell>
  );
}
