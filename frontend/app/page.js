"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Download,
  UserPlus,
  Zap,
  Package,
  Boxes,
  Truck,
  Users2,
  Lock,
  BarChart3,
  Megaphone,
  Bot,
  FlaskConical,
  Headphones,
  Building2,
  ShoppingBag,
  GraduationCap,
  Store,
  Mail,
} from "lucide-react";
import { teal, ink, sub, muted, border } from "../lib/marketing-theme";
import { GoogleAdsGlyph, MetaGlyph, PhoneCallGlyph, WhatsAppGlyph } from "../components/BrandIcons";
import MarketingNav from "../components/MarketingNav";
import MarketingFooter from "../components/MarketingFooter";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import AnimatedDots from "../components/AnimatedDots";
import HeroSalesMockup from "../components/mockups/HeroSalesMockup";
import CustomerJourney from "../components/CustomerJourney";
import FaqAccordion from "../components/FaqAccordion";
import TrialSignupForm from "../components/TrialSignupForm";

const inboxChannels = [
  { icon: <MetaGlyph size={30} />, title: "Meta Lead Forms", desc: "New enquiries, automatically captured" },
  { icon: <PhoneCallGlyph size={28} />, title: "Calls & Missed Calls", desc: "Keep call enquiries in view" },
  { icon: <WhatsAppGlyph size={30} />, title: "WhatsApp Messages", desc: "Conversations become actionable leads" },
  { icon: <GoogleAdsGlyph size={30} />, title: "Google Ads", beta: true, desc: "Integration under testing" },
];

const howSteps = [
  { icon: <Download size={26} color={teal} />, title: "Capture", desc: "Bring enquiries from your connected channels into one CRM.", tags: "Meta forms · Calls · WhatsApp" },
  { icon: <Users2 size={26} color={teal} />, title: "Assign", desc: "Give each lead a clear owner so your team knows who follows up.", tags: "Assigned leads · Clear ownership" },
  { icon: <Zap size={26} color={teal} />, title: "Automate", desc: "Send routine messages and set reminders to keep follow-ups moving.", tags: "WhatsApp · Email · SMS" },
  { icon: <Package size={26} color={teal} />, title: "Convert & Deliver", desc: "Manage confirmed orders, check inventory and track courier deliveries.", tags: "Orders · Inventory · Tracking" },
];

const industries = [
  { icon: <FlaskConical size={26} color={teal} />, title: "Ayurvedic & Wellness", desc: "Connect product enquiries, follow-ups, inventory and delivery.", flow: "Enquiry → Order → Delivery" },
  { icon: <Headphones size={26} color={teal} />, title: "Telesales Teams", desc: "One WhatsApp number. Assigned chats for every agent.", flow: "Assign → Follow up → Convert" },
  { icon: <Building2 size={26} color={teal} />, title: "Real Estate", desc: "Organise buyer enquiries and follow up on property interest.", flow: "Capture → Assign → Follow up" },
  { icon: <ShoppingBag size={26} color={teal} />, title: "E-commerce & D2C", desc: "Manage sales enquiries, order confirmations and shipment tracking.", flow: "Confirm → Fulfil → Track" },
  { icon: <GraduationCap size={26} color={teal} />, title: "Coaching & Education", desc: "Keep course enquiries and admission follow-ups organised.", flow: "Enquiry → Counselling → Enrolment" },
  { icon: <Store size={26} color={teal} />, title: "Clinics & Services", desc: "Assign enquiries and keep customer conversations together.", flow: "Capture → Respond → Follow up" },
];

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

  return (
    <div style={{ background: "#fff", color: ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <MarketingNav />

      {/* ══════════════════ HERO ══════════════════ */}
      <div style={{ position: "relative", overflow: "hidden", background: "#fafbfb" }}>
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -180,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,168,173,0.12) 0%, rgba(0,168,173,0) 70%)",
          }}
        />
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "64px 48px 100px",
            display: "grid",
            gridTemplateColumns: "0.85fr 1.15fr",
            gap: 40,
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(0,134,138,0.08)",
                color: teal,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: "0.08em",
                borderRadius: 20,
                padding: "7px 14px",
                marginBottom: 22,
              }}
            >
              <Users2 size={13} /> BUILT FOR TELECALLING &amp; SALES TEAMS
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.14, letterSpacing: "-0.02em", marginBottom: 20 }}>
              Every Lead.
              <br />
              Every Follow-up.
              <br />
              <span style={{ color: teal }}>Every Delivery.</span>
            </h1>
            <p style={{ fontSize: 15, color: sub, lineHeight: 1.65, marginBottom: 30, maxWidth: 400 }}>
              Capture Meta leads, connect your team on one WhatsApp number, and automate the journey from enquiry to
              delivery.
            </p>
            <div style={{ display: "flex", gap: 12, marginBottom: 26, flexWrap: "wrap" }}>
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
                  padding: "13px 24px",
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 10px 24px rgba(0,134,138,0.28)",
                }}
              >
                Get Your 15-Day Free Demo <ArrowRight size={16} />
              </button>
              <a
                href="/features"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#fff",
                  color: ink,
                  border: `1px solid ${border}`,
                  borderRadius: 9,
                  padding: "13px 24px",
                  fontSize: 14.5,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Explore Features
              </a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["One WhatsApp. Multiple agents.", "Orders, inventory & tracking."].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: sub }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(0,134,138,0.12)", color: teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Mockup + floating cards + dotted field */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <AnimatedDots
              width={110}
              height={260}
              style={{ position: "absolute", left: -50, top: "10%", zIndex: 0 }}
            />
            <Reveal delay={0.1} style={{ position: "relative" }}>
              <div className="float-mockup">
                <HeroSalesMockup />
              </div>

              {/* Meta leads captured */}
              <div
                className="float-card-a"
                style={{
                  position: "absolute",
                  top: -30,
                  right: -30,
                  background: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 16px 34px rgba(20,30,35,0.16)",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  zIndex: 3,
                }}
              >
                <MetaGlyph size={22} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ink }}>Meta leads captured</div>
                  <div style={{ fontSize: 9.5, color: muted }}>Forms · Messages · Calls · Missed calls</div>
                </div>
              </div>

              {/* One WhatsApp Your whole team */}
              <div
                className="float-card-b"
                style={{
                  position: "absolute",
                  bottom: 46,
                  left: -36,
                  background: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 16px 34px rgba(20,30,35,0.16)",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  zIndex: 3,
                  maxWidth: 200,
                }}
              >
                <WhatsAppGlyph size={24} />
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: ink, lineHeight: 1.3 }}>
                    One WhatsApp.
                    <br />
                    Your whole team.
                  </div>
                  <div style={{ display: "flex", gap: -4, marginTop: 6 }}>
                    {["RK", "PS", "AM"].map((initials, i) => (
                      <div
                        key={initials}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: ["#2a6fb0", "#c8508c", "#1f8a5c"][i],
                          color: "#fff",
                          fontSize: 7,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: i === 0 ? 0 : -6,
                          border: "1.5px solid #fff",
                        }}
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order shipped */}
              <div
                className="float-card-c"
                style={{
                  position: "absolute",
                  bottom: -26,
                  right: -20,
                  background: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 16px 34px rgba(20,30,35,0.16)",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  zIndex: 3,
                }}
              >
                <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(0,134,138,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Package size={14} color={teal} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ink }}>Order shipped</div>
                  <div style={{ fontSize: 9.5, color: muted }}>Delivery tracking connected</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Bottom feature icon strip */}
        <div style={{ borderTop: `1px solid ${border}`, background: "#fff" }}>
          <div
            style={{
              maxWidth: 1140,
              margin: "0 auto",
              padding: "26px 48px",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            {[
              { icon: <MetaGlyph size={17} />, label: "Meta lead capture" },
              { icon: <WhatsAppGlyph size={18} />, label: "Bulk WhatsApp automation" },
              { icon: <Boxes size={16} color={teal} />, label: "Inventory management" },
              { icon: <Truck size={16} color={teal} />, label: "Delivery API & tracking" },
            ].map((f) => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: ink }}>
                {f.icon} {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .float-mockup { animation: floatMockup 5s ease-in-out infinite; }
        @keyframes floatMockup {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .float-card-a { animation: floatCardA 4.4s ease-in-out infinite; }
        .float-card-b { animation: floatCardB 5.2s ease-in-out infinite; }
        .float-card-c { animation: floatCardC 4.8s ease-in-out infinite; }
        @keyframes floatCardA { 0%,100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        @keyframes floatCardB { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        @keyframes floatCardC { 0%,100% { transform: translateY(0); } 50% { transform: translateY(7px); } }
      `}</style>

      {/* ══════════════════ EVERY LEAD ONE SMART INBOX ══════════════════ */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "96px 48px 40px" }}>
        <SectionHeading
          eyebrow="Automated Lead Capture"
          subtitle="Capture Meta forms, calls and WhatsApp enquiries in one place. Give your team a clear next step for every lead."
        >
          Every Lead. One <span style={{ color: teal }}>Smart Inbox.</span>
        </SectionHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 4 }}>
          {inboxChannels.map((c, i) => (
            <Reveal
              key={c.title}
              delay={i * 0.08}
              style={{ border: `1px solid ${border}`, borderRadius: 12, padding: "26px 16px", textAlign: "center" }}
            >
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: 14 }}>
                {c.icon}
                {c.beta && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#8a5a00", background: "#fce8b8", borderRadius: 6, padding: "2px 6px" }}>
                    BETA
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: muted, lineHeight: 1.4 }}>{c.desc}</div>
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
              strokeDasharray={i === 3 ? "6 6" : "0"}
              markerEnd={i === 3 ? "url(#flowArrow)" : undefined}
              className={i === 3 ? "flow-path" : ""}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </svg>
        <style>{`
          .flow-path { animation: flowDash 0.9s linear infinite; }
          @keyframes flowDash { to { stroke-dashoffset: -24; } }
          .crm-pulse { animation: crmPulse 2.6s ease-in-out infinite; }
          @keyframes crmPulse {
            0%, 100% { box-shadow: 0 16px 34px rgba(0,134,138,0.3); }
            50% { box-shadow: 0 16px 44px rgba(0,134,138,0.5); }
          }
        `}</style>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
          <div
            className="crm-pulse"
            style={{
              background: teal,
              color: "#fff",
              borderRadius: 14,
              padding: "20px 56px",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 16px 34px rgba(0,134,138,0.3)",
            }}
          >
            <Bot size={26} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.01em" }}>Zalgo CRM</div>
              <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 2 }}>One inbox. Clear ownership. Timely follow-ups.</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {["Assign to the right agent", "Set follow-up reminders", "Track every conversation"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${border}`, borderRadius: 10, padding: "12px 16px" }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,134,138,0.1)", color: teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Check size={13} strokeWidth={3} />
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════ HOW ZALGO CRM WORKS ══════════════════ */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "80px 48px" }}>
        <SectionHeading
          eyebrow="How Zalgo CRM Works"
          subtitle="A clear next step for every lead — from capture to follow-up, order and delivery."
        >
          From First Enquiry to <span style={{ color: teal }}>Conversion</span>
        </SectionHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, position: "relative", marginBottom: 30 }}>
          <div style={{ position: "absolute", top: 22, left: "12.5%", right: "12.5%", height: 0, zIndex: 0 }}>
            <svg width="100%" height="4" style={{ overflow: "visible" }}>
              <line x1="0" y1="2" x2="100%" y2="2" stroke={teal} strokeWidth="2" />
            </svg>
          </div>
          {howSteps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1} style={{ textAlign: "center", position: "relative", zIndex: 1, padding: "0 8px" }}>
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
                  margin: "0 auto 20px",
                  fontWeight: 800,
                  fontSize: 15,
                  boxShadow: "0 8px 18px rgba(0,134,138,0.32)",
                }}
              >
                0{i + 1}
              </div>
              <div
                style={{
                  border: `1px solid ${i === 3 ? teal : border}`,
                  borderRadius: 12,
                  padding: "22px 16px",
                  height: "100%",
                }}
              >
                <div style={{ width: 46, height: 46, borderRadius: 10, background: "rgba(0,134,138,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: sub, lineHeight: 1.5, marginBottom: 12 }}>{s.desc}</div>
                <div style={{ fontSize: 10.5, color: teal, fontWeight: 600, background: "rgba(0,134,138,0.08)", borderRadius: 6, padding: "5px 8px", display: "inline-block" }}>
                  {s.tags}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: sub, marginBottom: 14 }}>See the complete workflow with your team.</div>
          <a
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: teal,
              color: "#fff",
              borderRadius: 9,
              padding: "13px 24px",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 10px 24px rgba(0,134,138,0.28)",
            }}
          >
            Get Your 15-Day Free Demo <ArrowRight size={15} />
          </a>
        </div>
      </div>

      {/* ══════════════════ ONE WHATSAPP NUMBER, YOUR ENTIRE TEAM ══════════════════ */}
      <div style={{ background: "#eef8f7", padding: "80px 48px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 48, alignItems: "center", marginBottom: 48 }}>
            <Reveal>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: teal, letterSpacing: "0.12em", marginBottom: 14 }}>
                SHARED WHATSAPP FOR YOUR TEAM
              </div>
              <h3 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
                One WhatsApp Number.
                <br />
                <span style={{ color: teal }}>Your Entire Team.</span>
              </h3>
              <p style={{ fontSize: 14, color: sub, lineHeight: 1.65, marginBottom: 22, maxWidth: 360 }}>
                Let every agent work from the same business number — with only their assigned contacts and chats.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
                {["One number for multiple agents", "Assigned chats stay with the right agent", "Managers can review team activity"].map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 600 }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(0,134,138,0.12)", color: teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {t}
                  </div>
                ))}
              </div>
              <a
                href="/register"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: teal, color: "#fff", borderRadius: 9, padding: "13px 22px", fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}
              >
                Get Your 15-Day Free Demo <ArrowRight size={15} />
              </a>
            </Reveal>

            <Reveal delay={0.12}>
              <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 14, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f6f9f9", borderRadius: 10, padding: "10px 18px" }}>
                    <WhatsAppGlyph size={26} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700 }}>One Business Number</div>
                      <div style={{ fontSize: 10.5, color: muted }}>Your company WhatsApp</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {[
                    { name: "Anjali", initials: "AS", color: "#2a6fb0", chatName: "Priya", chatMsg: "Product enquiry" },
                    { name: "Rohit", initials: "RK", color: "#c8508c", chatName: "Amit", chatMsg: "Order update" },
                    { name: "Pooja", initials: "PV", color: "#1f8a5c", chatName: "Neha", chatMsg: "Follow-up" },
                  ].map((a) => (
                    <div key={a.name} style={{ border: `1px solid ${border}`, borderRadius: 10, padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: a.color, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {a.initials}
                        </div>
                        <div>
                          <div style={{ fontSize: 11.5, fontWeight: 700 }}>{a.name}</div>
                          <div style={{ fontSize: 9, color: muted }}>Telecaller</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 9, color: teal, fontWeight: 600, display: "flex", alignItems: "center", gap: 3, marginBottom: 6 }}>
                        <Lock size={9} /> Assigned chats only
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 600 }}>{a.chatName}</div>
                      <div style={{ fontSize: 9, color: muted }}>{a.chatMsg}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, background: "#f6f9f9", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <BarChart3 size={16} color={teal} />
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700 }}>Manager view: team activity in one place</div>
                      <div style={{ fontSize: 9.5, color: muted }}>See what your team is working on and track follow-ups.</div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Bulk WhatsApp Messaging banner */}
          <Reveal delay={0.15}>
            <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 14, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <WhatsAppGlyph size={30} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Bulk WhatsApp Messaging</div>
                  <div style={{ fontSize: 12, color: muted }}>Send one campaign to your opted-in contacts.</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: "#f6f9f9", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Megaphone size={14} color={teal} />
                  <span style={{ fontSize: 11.5, fontWeight: 600 }}>New product update</span>
                </div>
                <svg width="30" height="14" viewBox="0 0 30 14">
                  <line x1="0" y1="7" x2="30" y2="7" stroke={teal} strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>
                <div style={{ display: "flex", gap: -6 }}>
                  {["#2a6fb0", "#c8508c", "#1f8a5c"].map((c, i) => (
                    <div key={c} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: "2px solid #fff", marginLeft: i === 0 ? 0 : -8 }} />
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: sub }}>One campaign. Multiple customers.</div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ══════════════════ COMPLETE CUSTOMER JOURNEY (interactive tabs) ══════════════════ */}
      <div style={{ padding: "96px 0 0" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 48px" }}>
          <SectionHeading eyebrow="The Complete Customer Journey" subtitle="Capture enquiries, follow up, confirm orders and track delivery.">
            One lead. <span style={{ color: teal }}>A clear journey.</span>
          </SectionHeading>
        </div>
        <CustomerJourney />
      </div>

      {/* ══════════════════ CLOSE THE SALE (dark) ══════════════════ */}
      <div style={{ background: "linear-gradient(120deg, #0b3a3c 0%, #06282a 100%)", padding: "90px 48px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 48, alignItems: "center" }}>
          <Reveal>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#7fd6d0", letterSpacing: "0.12em", marginBottom: 14 }}>
              ORDERS, INVENTORY &amp; DELIVERY
            </div>
            <h3 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, color: "#fff", marginBottom: 16 }}>
              Close the sale.
              <br />
              Connect every <span style={{ color: "#7fd6d0" }}>next step.</span>
            </h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, marginBottom: 22, maxWidth: 360 }}>
              Bring your sales and fulfilment teams together, from confirmed order to tracked delivery.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
              {["Manage inventory with your orders", "Send automatic order confirmations", "Connect your courier through delivery APIs", "See shipment updates in one place"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 600, color: "#fff" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.15)", color: "#7fd6d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {t}
                </div>
              ))}
            </div>
            <a
              href="/register"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#06282a", borderRadius: 9, padding: "13px 22px", fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}
            >
              Get Your 15-Day Free Demo <ArrowRight size={15} />
            </a>
          </Reveal>

          <Reveal delay={0.12} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 12, padding: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(0,134,138,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package size={18} color={teal} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Inventory</div>
                <div style={{ fontSize: 11.5, color: muted, marginBottom: 4 }}>Wellness Pack</div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#1f8a5c", background: "rgba(31,138,92,0.1)", borderRadius: 20, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Check size={10} strokeWidth={3} /> Stock available
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 12, padding: 16 }}>
              <WhatsAppGlyph size={34} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Order confirmation</div>
                <div style={{ fontSize: 11.5, color: sub, marginBottom: 4 }}>Hi Priya, your order #ZG1024 is confirmed.</div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#1f8a5c", background: "rgba(31,138,92,0.1)", borderRadius: 20, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Check size={10} strokeWidth={3} /> Message sent
                </span>
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: muted, fontWeight: 700 }}>ORDER #ZG1024</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Priya Sharma</div>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: teal, background: "rgba(0,134,138,0.1)", borderRadius: 20, padding: "3px 10px" }}>In transit</span>
              </div>
              {[
                { l: "Order confirmed", s: "Customer confirmation sent", done: true },
                { l: "Shipment created", s: "Courier details linked", done: true },
                { l: "In transit", s: "On the way to the customer", active: true },
                { l: "Delivered", s: "Pending", done: false },
              ].map((s) => (
                <div key={s.l} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: s.done ? "#1f8a5c" : s.active ? teal : "#eceff0", color: s.done || s.active ? "#fff" : muted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {s.done ? <Check size={10} strokeWidth={3} /> : s.active ? <Truck size={10} /> : <Package size={9} />}
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{s.l}</div>
                    <div style={{ fontSize: 10.5, color: muted }}>{s.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
        <div style={{ textAlign: "center", marginTop: 56, fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600, paddingTop: 30, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          One order. One connected view.
        </div>
      </div>

      {/* ══════════════════ SALE CONFIRMED (darker) ══════════════════ */}
      <div style={{ background: "#04181a", padding: "90px 48px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 48, alignItems: "center", position: "relative" }}>
          <AnimatedDots width={90} height={180} color="rgba(0,168,173,0.3)" style={{ position: "absolute", left: -50, bottom: 0 }} />
          <Reveal>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#7fd6d0", letterSpacing: "0.1em", marginBottom: 14 }}>
              ORDERS · INVENTORY · DELIVERY
            </div>
            <h3 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, color: "#fff", marginBottom: 16 }}>
              Sale confirmed.
              <br />
              <span style={{ color: "#7fd6d0" }}>Delivery connected.</span>
            </h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, marginBottom: 22, maxWidth: 340 }}>
              Manage stock, confirm orders and track shipments from one CRM.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
              {["Inventory management", "Automatic WhatsApp confirmations", "Courier integration & tracking"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 600, color: "#fff" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.15)", color: "#7fd6d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {t}
                </div>
              ))}
            </div>
            <a
              href="/register"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#06282a", borderRadius: 9, padding: "13px 22px", fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}
            >
              Get Your 15-Day Free Demo <ArrowRight size={15} />
            </a>
          </Reveal>

          <Reveal delay={0.12}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Order #ZG1024</div>
                  <div style={{ fontSize: 12, color: muted }}>Priya Sharma</div>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: teal, background: "rgba(0,134,138,0.1)", borderRadius: 20, padding: "3px 10px" }}>In transit</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                <div style={{ background: "#f6f9f9", borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <Package size={18} color={teal} />
                  <div>
                    <div style={{ fontSize: 10, color: muted }}>Inventory</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Stock available</div>
                  </div>
                </div>
                <div style={{ background: "#f6f9f9", borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <WhatsAppGlyph size={20} />
                  <div>
                    <div style={{ fontSize: 10, color: muted }}>WhatsApp</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Confirmation sent</div>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Track the delivery</div>
                <div style={{ fontSize: 11.5, color: muted, marginBottom: 14 }}>Courier connected through delivery API.</div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {["Confirmed", "Shipped", "In transit", "Delivered"].map((l, i) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : 0 }}>
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: i < 2 ? "#0f7a63" : i === 2 ? teal : "#eceff0",
                            color: i < 3 ? "#fff" : muted,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 6px",
                          }}
                        >
                          {i < 2 ? <Check size={14} strokeWidth={3} /> : i === 2 ? <Package size={13} /> : <Package size={13} />}
                        </div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: ink }}>{l}</div>
                        {i === 3 && <div style={{ fontSize: 9, color: muted }}>Pending</div>}
                      </div>
                      {i < 3 && <div style={{ flex: 1, height: 2, background: i < 2 ? "#0f7a63" : border, marginBottom: 20 }} />}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, background: "rgba(0,134,138,0.08)", borderRadius: 8, padding: "9px 12px", fontSize: 11.5, fontWeight: 600, color: teal }}>
                  Order and tracking details. Together.
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ══════════════════ BUILT FOR YOUR SALES WORKFLOW ══════════════════ */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "96px 48px" }}>
        <SectionHeading eyebrow="Built for Your Sales Workflow" subtitle="For teams that turn enquiries into customers.">
          Different businesses. <span style={{ color: teal }}>One connected CRM.</span>
        </SectionHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 40 }}>
          {industries.map((ind, i) => (
            <Reveal key={ind.title} delay={(i % 3) * 0.08} style={{ border: `1px solid ${border}`, borderRadius: 14, padding: 22, borderTop: `3px solid ${teal}` }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(0,134,138,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                {ind.icon}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{ind.title}</div>
              <div style={{ fontSize: 12.5, color: sub, lineHeight: 1.55, marginBottom: 12 }}>{ind.desc}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: teal }}>{ind.flow}</div>
            </Reveal>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: sub, marginBottom: 14 }}>See how Zalgo fits your team.</div>
          <a
            href="/register"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: teal, color: "#fff", borderRadius: 9, padding: "13px 24px", fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: "0 10px 24px rgba(0,134,138,0.28)" }}
          >
            Get Your 15-Day Free Demo <ArrowRight size={15} />
          </a>
        </div>
      </div>

      {/* ══════════════════ 15-DAY FREE TRIAL FORM ══════════════════ */}
      <div style={{ background: "#eef8f7", padding: "90px 48px", position: "relative", overflow: "hidden" }}>
        <AnimatedDots width={70} height={280} style={{ position: "absolute", left: 0, bottom: 0 }} />
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 56, alignItems: "center", position: "relative" }}>
          <Reveal>
            <div style={{ display: "inline-block", background: "rgba(0,134,138,0.1)", color: teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", borderRadius: 20, padding: "6px 14px", marginBottom: 20 }}>
              15 DAYS. FREE TO TRY.
            </div>
            <h3 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
              Your leads deserve
              <br />a <span style={{ color: teal }}>better follow-up.</span>
            </h3>
            <p style={{ fontSize: 14, color: sub, lineHeight: 1.65, marginBottom: 26, maxWidth: 380 }}>
              Bring your leads, WhatsApp conversations and order tracking into one CRM.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
              {[
                { icon: <Users2 size={18} color={teal} />, title: "Every enquiry in one place", desc: "Capture leads from your connected channels." },
                { icon: <WhatsAppGlyph size={20} />, title: "One WhatsApp. Your whole team.", desc: "Keep chats assigned and follow-ups organised." },
                { icon: <Package size={18} color={teal} />, title: "From order to delivery", desc: "Manage inventory and track shipments." },
              ].map((f) => (
                <div key={f.title} style={{ display: "flex", gap: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: muted }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {["Leads", "Follow-ups", "Orders"].map((l, i) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ background: "#fff", borderRadius: 9, padding: "10px 14px", fontSize: 11.5, fontWeight: 700, textAlign: "center" }}>{l}</div>
                  {i < 2 && (
                    <svg width="20" height="2" viewBox="0 0 20 2">
                      <line x1="0" y1="1" x2="20" y2="1" stroke={teal} strokeWidth="1.5" strokeDasharray="3 3" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.12} style={{ background: "#fff", borderRadius: 16, padding: 36, boxShadow: "0 24px 60px rgba(20,30,35,0.1)" }}>
            <div style={{ display: "inline-block", background: "rgba(0,134,138,0.1)", color: teal, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", borderRadius: 20, padding: "5px 12px", marginBottom: 14 }}>
              15-DAY FREE TRIAL
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Try Zalgo with your team.</div>
            <div style={{ fontSize: 12.5, color: muted, marginBottom: 22 }}>Share your details to request trial access.</div>
            <TrialSignupForm />
          </Reveal>
        </div>
      </div>

      {/* ══════════════════ FAQ ══════════════════ */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "96px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "0.75fr 1.25fr", gap: 56 }}>
          <Reveal>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: teal, letterSpacing: "0.12em", marginBottom: 14 }}>
              BEFORE YOU GET STARTED
            </div>
            <h3 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.25, marginBottom: 16 }}>
              Real questions.
              <br />
              <span style={{ color: teal }}>Clear answers.</span>
            </h3>
            <p style={{ fontSize: 13.5, color: sub, lineHeight: 1.6, marginBottom: 28, maxWidth: 300 }}>
              Everything you want to know before bringing your team on board.
            </p>
            <div style={{ background: "#eef8f7", borderRadius: 14, padding: 22 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(0,134,138,0.14)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Mail size={16} color={teal} />
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>Still have a question?</div>
              <div style={{ fontSize: 12.5, color: sub, marginBottom: 16 }}>Talk to us about your workflow.</div>
              <a
                href="/contact"
                style={{ display: "inline-flex", alignItems: "center", gap: 7, background: teal, color: "#fff", borderRadius: 8, padding: "10px 16px", fontSize: 12.5, fontWeight: 700, textDecoration: "none", marginBottom: 14 }}
              >
                Ask our team <ArrowRight size={13} />
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: sub }}>
                <Mail size={13} /> sales@zalgoinfotech.com
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <FaqAccordion />
          </Reveal>
        </div>
      </div>

      {/* ══════════════════ FINAL CTA ══════════════════ */}
      <Reveal as="div" style={{ background: "#eef8f7", padding: "48px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Ready to organise your next lead?</div>
            <div style={{ fontSize: 14, color: sub }}>Bring your team, conversations and orders together.</div>
          </div>
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
              padding: "14px 26px",
              fontSize: 14.5,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Start Your 15-Day Free Trial <ArrowRight size={16} />
          </button>
        </div>
      </Reveal>

      <MarketingFooter />
    </div>
  );
}
