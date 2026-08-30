"use client";
import { useRouter } from "next/navigation";
import { MessagesSquare, Mail, ArrowRight } from "lucide-react";
import { teal, ink, sub, muted, border } from "../../lib/marketing-theme";
import { WhatsAppGlyph } from "../../components/BrandIcons";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";

const CHANNELS = [
  {
    icon: <WhatsAppGlyph size={30} />,
    title: "WhatsApp Automation",
    desc: "Auto-reply to new leads, send order confirmations, and follow up on payments — all via WhatsApp, without lifting a finger.",
  },
  {
    icon: <MessagesSquare size={26} color={teal} />,
    title: "SMS Automation",
    desc: "Reach customers who don't have WhatsApp with automated SMS updates for the same triggers.",
  },
  {
    icon: <Mail size={26} color={teal} />,
    title: "Email Automation",
    desc: "Send branded email notifications automatically for new leads, conversions, and payment reminders.",
  },
];

const TRIGGERS = [
  "New Lead Added",
  "Lead Converted",
  "Follow-up Due Today",
  "Fee / Payment Due",
  "Fee / Payment Overdue",
];

export default function AutomationSuitePage() {
  const router = useRouter();
  return (
    <div style={{ background: "#fff", color: ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <MarketingNav />

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 48px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 14 }}>
          Automate Every <span style={{ color: teal }}>Follow-Up</span>, Every Channel
        </h1>
        <p style={{ fontSize: 16, color: sub, maxWidth: 600, margin: "0 auto" }}>
          Set it up once — WhatsApp, SMS, and Email messages go out automatically the moment something happens.
        </p>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "48px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {CHANNELS.map((c) => (
            <div key={c.title} style={{ border: `1px solid ${border}`, borderRadius: 14, padding: "28px 22px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>{c.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: sub, lineHeight: 1.55 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#f7fafa", padding: "72px 48px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 56, alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 27, fontWeight: 700, lineHeight: 1.3, marginBottom: 14 }}>
              Pick a <span style={{ color: teal }}>trigger</span>, write a message, done.
            </h3>
            <p style={{ fontSize: 14.5, color: sub, lineHeight: 1.6, marginBottom: 22, maxWidth: 380 }}>
              Every trigger below can send through WhatsApp, SMS, or Email — mix and match per trigger.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TRIGGERS.map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 600, color: ink }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: teal }} />
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 14, padding: 22, boxShadow: "0 16px 40px rgba(20,30,35,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>WhatsApp Automation</div>
              <div style={{ width: 34, height: 18, borderRadius: 20, background: teal, position: "relative" }}>
                <div style={{ position: "absolute", top: 2, right: 2, width: 14, height: 14, borderRadius: "50%", background: "#fff" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              <WhatsAppGlyph size={28} />
              <div style={{ background: "#f0f2f4", borderRadius: "4px 12px 12px 12px", padding: "10px 14px", maxWidth: 300 }}>
                <div style={{ fontSize: 12.5, color: ink, lineHeight: 1.5 }}>
                  Hi {"{{name}}"},<br />
                  Thank you for your interest! Our team will connect with you shortly.
                </div>
                <div style={{ fontSize: 9, color: muted, marginTop: 6, textAlign: "right" }}>10:30 AM ✓✓</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["SMS Automation", "Email Automation", "Follow-up Sequence"].map((l) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: `1px solid ${border}`,
                    borderRadius: 9,
                    padding: "9px 12px",
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{l}</span>
                  <span style={{ fontSize: 11, color: "#1f8a5c", display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1f8a5c" }} /> Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "80px 48px" }}>
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            background: `linear-gradient(120deg, ${teal} 0%, #045d60 100%)`,
            borderRadius: 20,
            padding: "40px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
              Automation is a Pro Max feature
            </div>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.8)" }}>See full pricing and what's included in each plan.</div>
          </div>
          <button
            onClick={() => router.push("/pricing")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              color: teal,
              border: "none",
              borderRadius: 9,
              padding: "13px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            View Pricing <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
