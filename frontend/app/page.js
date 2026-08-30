"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  ArrowRight,
  Download,
  BellRing,
  MessagesSquare,
  TrendingUp as TrendingUpIcon,
  UserPlus,
  Send,
  Target,
  Rocket,
  Users2,
  Eye,
  Mail,
} from "lucide-react";
import { teal, ink, sub, muted, border } from "../lib/marketing-theme";
import { GoogleAdsGlyph, MetaGlyph, PhoneCallGlyph, WhatsAppGlyph } from "../components/BrandIcons";
import MarketingNav from "../components/MarketingNav";
import MarketingFooter from "../components/MarketingFooter";
import SectionHeading from "../components/SectionHeading";

export default function HomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("crm_token");
    if (token) {
      router.push("/dashboard");
    } else {
      setChecked(true);
    }
  }, []);

  if (!checked) return null;

  const inboxChannels = [
    { icon: <MetaGlyph />, label: "Meta Lead Forms" },
    { icon: <PhoneCallGlyph />, label: "Calls &\nMissed Calls" },
    { icon: <WhatsAppGlyph />, label: "WhatsApp\nMessages" },
    { icon: <GoogleAdsGlyph />, label: "Google Ads — Beta" },
  ];

  const capabilityCards = [
    {
      icon: <Download size={20} color={teal} />,
      title: "Automatic\nLead Capture",
      desc: "Capture leads from all channels automatically in real-time.",
    },
    {
      icon: <BellRing size={20} color={teal} />,
      title: "Smart Follow-up\nReminders",
      desc: "Never forget a follow-up with smart reminders & nudges.",
    },
    {
      icon: <MessagesSquare size={20} color={teal} />,
      title: "WhatsApp, SMS &\nEmail Automation",
      desc: "Automate personalized messages across multiple channels.",
    },
    {
      icon: <TrendingUpIcon size={20} color={teal} />,
      title: "Lead Status &\nSales Tracking",
      desc: "Track lead status, conversations & conversions seamlessly.",
    },
  ];

  const steps = [
    { icon: <Download size={22} color="#fff" />, title: "Capture", desc: "Leads from multiple channels in real-time." },
    { icon: <UserPlus size={22} color="#fff" />, title: "Assign", desc: "Auto-assign leads to the right representative." },
    { icon: <Send size={22} color="#fff" />, title: "Automate", desc: "Engage instantly with automated messages & reminders." },
    { icon: <Target size={22} color="#fff" />, title: "Convert", desc: "Track progress and close more deals." },
  ];

  const benefits = [
    { icon: <Rocket size={20} color={teal} />, title: "Faster Response", desc: "Respond instantly & never miss a lead." },
    { icon: <TrendingUpIcon size={20} color={teal} />, title: "Better Engagement", desc: "Automated, personalized communication." },
    { icon: <Target size={20} color={teal} />, title: "Higher Conversion", desc: "Nurture leads and close more deals." },
    { icon: <Eye size={20} color={teal} />, title: "Complete Visibility", desc: "360° view of leads & sales pipeline." },
  ];

  return (
    <div style={{ background: "#fff", color: ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <MarketingNav />

      {/* ── HERO ────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(180deg, #ffffff 0%, #eef8f7 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -160,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,168,173,0.14) 0%, rgba(0,168,173,0) 70%)",
          }}
        />
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "72px 48px 96px",
            display: "grid",
            gridTemplateColumns: "1fr 1.05fr",
            gap: 56,
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", zIndex: 2 }}>
            <h1 style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.12, letterSpacing: "-0.02em", marginBottom: 6 }}>
              Never Miss
              <br />a <span style={{ color: teal }}>Lead</span> Again
            </h1>
            <div style={{ fontSize: 21, fontWeight: 600, color: ink, margin: "18px 0 20px" }}>
              Capture. Automate. Follow Up. <span style={{ color: teal }}>Convert.</span>
            </div>
            <p style={{ fontSize: 15, color: sub, lineHeight: 1.6, marginBottom: 30, maxWidth: 420 }}>
              Meta Ads, Calls, WhatsApp &amp; Forms — All Leads in One CRM.
            </p>
            <button
              onClick={() => router.push("/register")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: teal,
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "13px 26px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 10px 24px rgba(0,134,138,0.28)",
                marginBottom: 22,
              }}
            >
              Book a Free Demo <ArrowRight size={16} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: muted }}>
              <Users2 size={15} />
              Built for Telecalling &amp; Sales Teams
            </div>
          </div>

          {/* Dashboard mockup */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: `1px solid ${border}`,
                boxShadow: "0 24px 60px rgba(20,30,35,0.14)",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex" }}>
                <div style={{ width: 110, background: ink, padding: "16px 10px", flexShrink: 0 }}>
                  <div style={{ color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", marginBottom: 18, paddingLeft: 4 }}>
                    ZALGO
                  </div>
                  {["Dashboard", "Leads", "Inbox", "Calls", "Follow-ups", "Automation", "Reports", "Settings"].map((item, i) => (
                    <div
                      key={item}
                      style={{
                        fontSize: 10,
                        color: i === 0 ? "#fff" : "rgba(255,255,255,0.55)",
                        background: i === 0 ? teal : "transparent",
                        borderRadius: 6,
                        padding: "6px 8px",
                        marginBottom: 3,
                        fontWeight: i === 0 ? 700 : 500,
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, padding: "14px 16px", minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Dashboard</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#f2f3f5", borderRadius: 6, padding: "4px 8px" }}>
                        <Search size={10} color={muted} />
                        <span style={{ fontSize: 9, color: muted }}>Search leads, calls, notes...</span>
                      </div>
                      <Bell size={13} color={sub} />
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: teal }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
                    {[
                      { l: "Total Leads", v: "1,248", d: "+18% this week", up: true },
                      { l: "New Leads", v: "312", d: "-12% this week", up: false },
                      { l: "Contacted", v: "680", d: "+16% this week", up: true },
                      { l: "Converted", v: "124", d: "+20% this week", up: true },
                    ].map((s) => (
                      <div key={s.l} style={{ border: `1px solid ${border}`, borderRadius: 8, padding: "8px 9px" }}>
                        <div style={{ fontSize: 8, color: muted, marginBottom: 3 }}>{s.l}</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{s.v}</div>
                        <div style={{ fontSize: 7, color: s.up ? "#1f8a5c" : "#c8372f", marginTop: 2 }}>{s.d}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 10 }}>
                    <div style={{ border: `1px solid ${border}`, borderRadius: 8, padding: 9 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 6 }}>Recent Leads</div>
                      {[
                        { n: "Rahul Sharma", p: "+91 98765 43210", s: "New", sc: "#2a6fb0", src: "WhatsApp" },
                        { n: "Priya Verma", p: "+91 91234 56789", s: "Contacted", sc: "#b06a00", src: "Meta Lead Form" },
                        { n: "Vivek Singh", p: "+91 99876 54321", s: "Follow-up", sc: "#565d63", src: "Missed Call" },
                        { n: "Anjali Mehta", p: "+91 97654 32109", s: "Interested", sc: "#00868a", src: "Google Ads (Beta)" },
                      ].map((r) => (
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
                      <div style={{ border: `1px solid ${border}`, borderRadius: 8, padding: 9 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4 }}>Reminders</div>
                        {["Follow up with Priya · in 15m", "Call back Vivek · in 30m", "Send proposal to Anjali · in 1h"].map((r) => (
                          <div key={r} style={{ fontSize: 6.5, color: sub, marginBottom: 4 }}>
                            {r}
                          </div>
                        ))}
                      </div>
                      <div style={{ border: `1px solid ${border}`, borderRadius: 8, padding: 9, textAlign: "center" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4 }}>Today&apos;s Calls</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: teal }}>28</div>
                        <div style={{ fontSize: 6.5, color: muted }}>Total Calls</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, border: `1px solid ${border}`, borderRadius: 8, padding: 9 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 6 }}>Automation Overview</div>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <WhatsAppGlyph size={14} />
                        <span style={{ fontSize: 8 }}>WhatsApp Sent <b>156</b></span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <MessagesSquare size={12} color={teal} />
                        <span style={{ fontSize: 8 }}>SMS Sent <b>98</b></span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Mail size={12} color={teal} />
                        <span style={{ fontSize: 8 }}>Emails Sent <b>72</b></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SMART INBOX ─────────────────────────────────── */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "96px 48px 40px" }}>
        <SectionHeading>
          Every Lead. One <span style={{ color: teal }}>Smart Inbox.</span>
        </SectionHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 4 }}>
          {inboxChannels.map((c) => (
            <div
              key={c.label}
              style={{
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: "26px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "pre-line", lineHeight: 1.4 }}>{c.label}</div>
            </div>
          ))}
        </div>

        <svg width="100%" height="70" viewBox="0 0 1000 70" preserveAspectRatio="none" style={{ display: "block" }}>
          <defs>
            <marker id="flowArrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={teal} />
            </marker>
          </defs>
          {[125, 375, 625, 875].map((x, i) => (
            <path
              key={x}
              d={`M${x} 0 C ${x} 35, 500 35, 500 60`}
              fill="none"
              stroke={teal}
              strokeWidth="2"
              strokeDasharray="6 6"
              markerEnd={i === 3 ? "url(#flowArrow)" : undefined}
              className="flow-path"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </svg>
        <style>{`
          .flow-path {
            animation: flowDash 0.9s linear infinite;
          }
          @keyframes flowDash {
            to { stroke-dashoffset: -24; }
          }
        `}</style>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 44 }}>
          <div
            style={{
              background: teal,
              color: "#fff",
              borderRadius: 14,
              padding: "22px 64px",
              textAlign: "center",
              boxShadow: "0 16px 34px rgba(0,134,138,0.3)",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.02em" }}>CRM</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Centralized. Organized. Actionable.</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
          {capabilityCards.map((c) => (
            <div key={c.title} style={{ border: `1px solid ${border}`, borderRadius: 12, padding: "20px 18px" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9,
                  background: "rgba(0,134,138,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                {c.icon}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "pre-line", lineHeight: 1.35, marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: 12.5, color: sub, lineHeight: 1.5 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FIRST ENQUIRY TO CONVERSION ─────────────────── */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "80px 48px" }}>
        <SectionHeading>
          From First Enquiry to <span style={{ color: teal }}>Conversion</span>
        </SectionHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: 22,
              left: "12.5%",
              right: "12.5%",
              height: 0,
              borderTop: `2px dashed ${border}`,
              zIndex: 0,
            }}
          />
          {steps.map((s, i) => (
            <div key={s.title} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: teal,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontWeight: 800,
                  fontSize: 15,
                  boxShadow: "0 8px 18px rgba(0,134,138,0.32)",
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 12.5, color: sub, maxWidth: 190, margin: "0 auto", lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TURN EVERY ENQUIRY INTO OPPORTUNITY ─────────── */}
      <div style={{ background: "#f7fafa", padding: "80px 48px" }}>
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "0.9fr 1.1fr",
            gap: 56,
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ fontSize: 27, fontWeight: 700, lineHeight: 1.3, marginBottom: 14 }}>
              Turn Every Enquiry Into an <span style={{ color: teal }}>Opportunity</span>
            </h3>
            <p style={{ fontSize: 14.5, color: sub, lineHeight: 1.6, marginBottom: 26, maxWidth: 380 }}>
              Engage leads instantly &amp; consistently across their preferred channels.
            </p>
            <div style={{ display: "flex", gap: 28 }}>
              {[
                { icon: <WhatsAppGlyph size={26} />, label: "WhatsApp" },
                { icon: <MessagesSquare size={22} color={teal} />, label: "SMS" },
                { icon: <Mail size={22} color={teal} />, label: "Email" },
              ].map((c) => (
                <div key={c.label} style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>{c.icon}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: sub }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: 22,
              boxShadow: "0 16px 40px rgba(20,30,35,0.08)",
            }}
          >
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

      {/* ── BENEFITS ─────────────────────────────────────── */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
          {benefits.map((b) => (
            <div key={b.title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "rgba(0,134,138,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {b.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{b.title}</div>
                <div style={{ fontSize: 12.5, color: sub, lineHeight: 1.5 }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM CTA ───────────────────────────────────── */}
      <div style={{ padding: "0 48px 48px" }}>
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
            position: "relative",
            overflow: "hidden",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -20,
              top: -20,
              width: 220,
              height: 220,
              backgroundImage: "radial-gradient(rgba(255,255,255,0.18) 1.5px, transparent 1.5px)",
              backgroundSize: "14px 14px",
              opacity: 0.6,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", zIndex: 1 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <TrendingUpIcon size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 3 }}>Book Your Free CRM Demo</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                See how ZALGO INFOTECH CRM can transform your telecalling and sales process.
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push("/register")}
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
              position: "relative",
              zIndex: 1,
              whiteSpace: "nowrap",
            }}
          >
            Book a Free Demo <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
