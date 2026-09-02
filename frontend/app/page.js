"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
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
import Reveal from "../components/Reveal";
import DashboardMockup from "../components/mockups/DashboardMockup";

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
      desc: "The moment someone fills a form, messages you, or misses a call, it's already sitting in your CRM — no manual entry, no copy-paste between tools.",
    },
    {
      icon: <BellRing size={20} color={teal} />,
      title: "Smart Follow-up\nReminders",
      desc: "Set a follow-up once and it nudges the right person at the right time — every lead gets chased until it's actually closed, not forgotten in a spreadsheet.",
    },
    {
      icon: <MessagesSquare size={20} color={teal} />,
      title: "WhatsApp, SMS &\nEmail Automation",
      desc: "Trigger a personalized WhatsApp, SMS, or email the instant a lead comes in, changes stage, or has a payment due — fully automated, sent from your own numbers.",
    },
    {
      icon: <TrendingUpIcon size={20} color={teal} />,
      title: "Lead Status &\nSales Tracking",
      desc: "See exactly where every lead sits in your pipeline, who's handling it, and what was last said — a full history, not a guess.",
    },
  ];

  const steps = [
    { icon: <Download size={22} color="#fff" />, title: "Capture", desc: "Every lead from every connected channel lands automatically, tagged with its source." },
    { icon: <UserPlus size={22} color="#fff" />, title: "Assign", desc: "Routed to the right team member instantly — nothing sits in a shared inbox unowned." },
    { icon: <Send size={22} color="#fff" />, title: "Automate", desc: "An automated first message goes out in seconds, then reminders keep follow-ups on track." },
    { icon: <Target size={22} color="#fff" />, title: "Convert", desc: "Move the lead through your pipeline, fulfill the order, and track it straight through to delivery." },
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
          <Reveal delay={0.1} style={{ position: "relative", zIndex: 2 }}>
            <div className="float-mockup">
              <DashboardMockup />
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── SMART INBOX ─────────────────────────────────── */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "96px 48px 40px" }}>
        <SectionHeading subtitle="Meta Lead Forms, missed calls, WhatsApp messages, and Google Ads leads all land in the same place — your team stops jumping between apps and starts working one queue.">
          Every Lead. One <span style={{ color: teal }}>Smart Inbox.</span>
        </SectionHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 4 }}>
          {inboxChannels.map((c, i) => (
            <Reveal
              key={c.label}
              delay={i * 0.08}
              style={{
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: "26px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "pre-line", lineHeight: 1.4 }}>{c.label}</div>
            </Reveal>
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
          .float-mockup {
            animation: floatMockup 5s ease-in-out infinite;
          }
          @keyframes floatMockup {
            0%, 100% { transform: rotate(-1deg) translateY(0); }
            50% { transform: rotate(-1deg) translateY(-10px); }
          }
        `}</style>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 44 }}>
          <div
            className="crm-pulse"
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
          {capabilityCards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08} style={{ border: `1px solid ${border}`, borderRadius: 12, padding: "20px 18px" }}>
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
            </Reveal>
          ))}
        </div>
      </div>

      <style>{`
        .crm-pulse {
          animation: crmPulse 2.6s ease-in-out infinite;
        }
        @keyframes crmPulse {
          0%, 100% { box-shadow: 0 16px 34px rgba(0,134,138,0.3); }
          50% { box-shadow: 0 16px 44px rgba(0,134,138,0.5); }
        }
      `}</style>

      {/* ── FIRST ENQUIRY TO CONVERSION ─────────────────── */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "80px 48px" }}>
        <SectionHeading subtitle="Four steps, start to finish — every lead follows the same reliable path from the moment it lands to the moment it's a paying customer.">
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
            <Reveal key={s.title} delay={i * 0.12} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
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
            </Reveal>
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
          <Reveal>
            <h3 style={{ fontSize: 27, fontWeight: 700, lineHeight: 1.3, marginBottom: 14 }}>
              Turn Every Enquiry Into an <span style={{ color: teal }}>Opportunity</span>
            </h3>
            <p style={{ fontSize: 14.5, color: sub, lineHeight: 1.6, marginBottom: 26, maxWidth: 380 }}>
              A lead that doesn't hear back in the first few minutes is a lead you're about to lose. Zalgo CRM
              replies the instant a lead lands, on whichever channel they actually check — WhatsApp, SMS, or
              email — so your team walks in to a warm conversation instead of a cold one.
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
          </Reveal>

          <Reveal
            delay={0.15}
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
          </Reveal>
        </div>
      </div>

      {/* ── BENEFITS ─────────────────────────────────────── */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
          {benefits.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.08} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
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
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── BOTTOM CTA ───────────────────────────────────── */}
      <Reveal as="div" style={{ padding: "0 48px 48px" }}>
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
      </Reveal>

      <MarketingFooter />
    </div>
  );
}
