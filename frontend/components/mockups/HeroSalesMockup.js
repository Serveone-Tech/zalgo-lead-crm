"use client";
import { Home, Users, Package, Boxes, Truck, Settings, HelpCircle, Search, Bell, TrendingUp } from "lucide-react";
import { teal, border, muted, sub, ink } from "../../lib/marketing-theme";
import { WhatsAppGlyph } from "../BrandIcons";

const NAV = [
  { icon: <Home size={11} />, label: "Dashboard", active: false },
  { icon: <Users size={11} />, label: "Leads", active: true },
  { icon: <WhatsAppGlyph size={11} />, label: "WhatsApp", active: false },
  { icon: <TrendingUp size={11} />, label: "Automation", active: false },
  { icon: <Package size={11} />, label: "Orders", active: false },
  { icon: <Boxes size={11} />, label: "Inventory", active: false },
  { icon: <Truck size={11} />, label: "Delivery", active: false },
];

const STATS = [
  { l: "New leads", v: "24", delta: "+20%", icon: <Users size={13} color={teal} /> },
  { l: "Follow-ups", v: "08", delta: "+14%", icon: <WhatsAppGlyph size={13} /> },
  { l: "Orders", v: "12", delta: "+33%", icon: <Package size={13} color={teal} /> },
];

const ROWS = [
  { n: "Rahul Sharma", src: "Meta Ads", p: "+91 98765 43210", s: "New", sc: "#2a6fb0", d: "9 Sep 2024" },
  { n: "Priya Verma", src: "Facebook Form", p: "+91 91234 56789", s: "Follow-up", sc: "#b06a00", d: "9 Sep 2024" },
  { n: "Vivek Singh", src: "WhatsApp", p: "+91 99876 54321", s: "Order confirmed", sc: "#1f8a5c", d: "8 Sep 2024" },
  { n: "Anjali Mehta", src: "Instagram Form", p: "+91 97654 32109", s: "Follow-up", sc: "#b06a00", d: "8 Sep 2024" },
  { n: "Suresh Patel", src: "Meta Ads", p: "+91 90987 65432", s: "New", sc: "#2a6fb0", d: "7 Sep 2024" },
];

// Sparkline — a tiny decorative up-trend line, matching the little chart
// under each stat card in the reference design.
function Spark() {
  return (
    <svg width="46" height="16" viewBox="0 0 46 16" fill="none">
      <path d="M1 13 L10 9 L18 11 L27 5 L36 7 L45 2" stroke={teal} strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// The "Sales overview" screenshot in the hero — a bespoke mockup (not
// MockupShell, which other marketing pages share) so this one can match
// the reference design's exact sidebar/stat/table content without
// affecting mockups used elsewhere on the site.
export default function HeroSalesMockup() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        border: `1px solid ${border}`,
        boxShadow: "0 30px 70px rgba(20,30,35,0.16)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex" }}>
        <div style={{ width: 128, background: "#14181b", padding: "16px 10px", flexShrink: 0 }}>
          <div style={{ color: "#fff", fontSize: 12, fontWeight: 800, letterSpacing: "0.03em", marginBottom: 2, paddingLeft: 4 }}>
            ZALGO
          </div>
          <div style={{ color: teal, fontSize: 6, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8, paddingLeft: 4 }}>
            INFOTECH
          </div>
          <div style={{ fontSize: 6, color: "rgba(255,255,255,0.35)", padding: "0 8px 10px" }}>Sample workspace</div>
          {NAV.map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 8.5,
                color: item.active ? "#fff" : "rgba(255,255,255,0.55)",
                background: item.active ? teal : "transparent",
                borderRadius: 5,
                padding: "5px 8px",
                marginBottom: 2,
                fontWeight: item.active ? 700 : 500,
              }}
            >
              {item.icon} {item.label}
            </div>
          ))}
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 8.5, color: "rgba(255,255,255,0.45)", padding: "5px 8px" }}>
            <Settings size={11} /> Settings
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 8.5, color: "rgba(255,255,255,0.45)", padding: "5px 8px" }}>
            <HelpCircle size={11} /> Help
          </div>
        </div>

        <div style={{ flex: 1, padding: "14px 18px", minWidth: 0, background: "#fafbfb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: `1px solid ${border}`, borderRadius: 7, padding: "5px 10px", flex: 1, maxWidth: 220 }}>
              <Search size={10} color={muted} />
              <span style={{ fontSize: 8, color: muted }}>Search leads, orders, customers...</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={13} color={sub} />
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: teal, color: "#fff", fontSize: 7, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                AS
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: ink }}>Sales overview</div>
              <div style={{ fontSize: 8, color: muted, marginTop: 2 }}>Track your leads, follow-ups and deliveries in real time.</div>
            </div>
            <div style={{ fontSize: 7.5, color: sub, border: `1px solid ${border}`, borderRadius: 6, padding: "4px 8px" }}>Last 30 days ▾</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
            {STATS.map((s) => (
              <div key={s.l} style={{ border: `1px solid ${border}`, borderRadius: 9, padding: "9px 10px", background: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(0,134,138,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {s.icon}
                  </div>
                  <span style={{ fontSize: 7, fontWeight: 700, color: "#1f8a5c" }}>↑ {s.delta}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: ink, marginTop: 5 }}>{s.v}</div>
                <div style={{ fontSize: 6.5, color: muted, marginBottom: 3 }}>{s.l}</div>
                <Spark />
              </div>
            ))}
          </div>

          <div style={{ border: `1px solid ${border}`, borderRadius: 9, padding: 10, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700 }}>Recent Leads</div>
              <span style={{ fontSize: 7, color: teal, fontWeight: 600 }}>View all →</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1.1fr 0.9fr 0.8fr", gap: 4, fontSize: 6, color: muted, padding: "0 2px 4px", borderBottom: `1px solid ${border}` }}>
              <span>Name</span><span>Source</span><span>Phone</span><span>Status</span><span>Created</span>
            </div>
            {ROWS.map((r) => (
              <div key={r.n} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1.1fr 0.9fr 0.8fr", gap: 4, alignItems: "center", padding: "5px 2px", borderBottom: `1px solid ${border}` }}>
                <span style={{ fontSize: 7, fontWeight: 600, color: ink }}>{r.n}</span>
                <span style={{ fontSize: 6.5, color: sub }}>{r.src}</span>
                <span style={{ fontSize: 6.5, color: sub }}>{r.p}</span>
                <span style={{ fontSize: 6, fontWeight: 700, color: r.sc, background: `${r.sc}18`, borderRadius: 10, padding: "2px 5px", textAlign: "center", whiteSpace: "nowrap" }}>{r.s}</span>
                <span style={{ fontSize: 6.5, color: muted }}>{r.d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
