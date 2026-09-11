"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { poppins } from "../lib/marketing-font";
import MarketingStyles from "../components/MarketingStyles";
import {
  ArrowRight,
  Check,
  Download,
  Zap,
  Package,
  Boxes,
  Truck,
  Users2,
  Lock,
  BarChart3,
  Megaphone,
  Inbox,
  FlaskConical,
  Headphones,
  Building2,
  ShoppingBag,
  GraduationCap,
  Store,
  Mail,
  MessageCircle,
  Target,
  FileText,
  MapPin,
} from "lucide-react";
import { teal, ink, sub, muted, border } from "../lib/marketing-theme";
import {
  GoogleAdsGlyph,
  MetaGlyph,
  PhoneCallGlyph,
  WhatsAppGlyph,
} from "../components/BrandIcons";
import MarketingNav from "../components/MarketingNav";
import MarketingFooter from "../components/MarketingFooter";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import AnimatedDots from "../components/AnimatedDots";
import HeroSalesMockup from "../components/mockups/HeroSalesMockup";
import CustomerJourney from "../components/CustomerJourney";
import FaqAccordion from "../components/FaqAccordion";
import TrialSignupForm from "../components/TrialSignupForm";

/* ─────────────────────────── design tokens ─────────────────────────── */
const mint = "#eef8f7"; // light-teal section background (reference pages 4, 12, 14)
const mintDeep = "#e3f2f0"; // darker mint used for icon tiles
const tealSoft = "rgba(0,134,138,0.10)";
const green = "#1f8a5c";
const tealLight = "#7fd6d0"; // accent on dark sections
const darkA = "linear-gradient(135deg, #0f4c4c 0%, #0a3a3b 100%)"; // "Close the sale"
const darkB = "linear-gradient(135deg, #063a3a 0%, #032a2b 100%)"; // "Sale confirmed"

const ctaStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  background: teal,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "16px 28px",
  fontSize: 16,
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(0,134,138,0.28)",
  whiteSpace: "nowrap",
};

const cardStyle = {
  background: "#fff",
  border: `1px solid ${border}`,
  borderRadius: 16,
};

/* Animated dotted stroke — used for EVERY connector line on the page. */
const dotStroke = {
  fill: "none",
  stroke: teal,
  strokeWidth: 2.4,
  strokeDasharray: "1 7",
  strokeLinecap: "round",
};

/* Soft radial blob for section backgrounds. */
function Blob({
  size,
  top,
  left,
  right,
  bottom,
  color = "rgba(0,168,173,0.14)",
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top,
        left,
        right,
        bottom,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`,
        pointerEvents: "none",
      }}
    />
  );
}

function CheckBadge({ size = 24, onDark = false }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: onDark ? "rgba(255,255,255,0.16)" : tealSoft,
        color: onDark ? tealLight : teal,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Check size={size * 0.55} strokeWidth={3} />
    </span>
  );
}

/* ─────────────────────────── content ─────────────────────────── */
const inboxChannels = [
  {
    icon: <MetaGlyph size={64} />,
    title: "Meta Lead Forms",
    desc: "New enquiries, automatically captured",
  },
  {
    icon: <PhoneCallGlyph size={60} />,
    title: "Calls & Missed Calls",
    desc: "Keep call enquiries in view",
  },
  {
    icon: <WhatsAppGlyph size={64} />,
    title: "WhatsApp Messages",
    desc: "Conversations become actionable leads",
  },
  {
    icon: <GoogleAdsGlyph size={64} />,
    title: "Google Ads",
    beta: true,
    desc: "Integration under testing",
  },
];

const howSteps = [
  {
    icon: <Download size={40} color={teal} strokeWidth={1.8} />,
    title: "Capture",
    desc: "Bring enquiries from your connected channels into one CRM.",
    tags: "Meta forms · Calls · WhatsApp",
  },
  {
    icon: <Users2 size={40} color={teal} strokeWidth={1.8} />,
    title: "Assign",
    desc: "Give each lead a clear owner so your team knows who follows up.",
    tags: "Assigned leads · Clear ownership",
  },
  {
    icon: <Zap size={40} color={teal} strokeWidth={1.8} />,
    title: "Automate",
    desc: "Send routine messages and set reminders to keep follow-ups moving.",
    tags: "WhatsApp · Email · SMS",
  },
  {
    icon: <Package size={40} color={teal} strokeWidth={1.8} />,
    title: "Convert & Deliver",
    desc: "Manage confirmed orders, check inventory and track courier deliveries.",
    tags: "Orders · Inventory · Tracking",
  },
];

const industries = [
  {
    icon: <FlaskConical size={38} color={teal} strokeWidth={1.8} />,
    title: "Ayurvedic & Wellness",
    desc: "Connect product enquiries, follow-ups, inventory and delivery.",
    flow: "Enquiry → Order → Delivery",
  },
  {
    icon: <Headphones size={38} color={teal} strokeWidth={1.8} />,
    title: "Telesales Teams",
    desc: "One WhatsApp number. Assigned chats for every agent.",
    flow: "Assign → Follow up → Convert",
  },
  {
    icon: <Building2 size={38} color={teal} strokeWidth={1.8} />,
    title: "Real Estate",
    desc: "Organise buyer enquiries and follow up on property interest.",
    flow: "Capture → Assign → Follow up",
  },
  {
    icon: <ShoppingBag size={38} color={teal} strokeWidth={1.8} />,
    title: "E-commerce & D2C",
    desc: "Manage sales enquiries, order confirmations and shipment tracking.",
    flow: "Confirm → Fulfil → Track",
  },
  {
    icon: <GraduationCap size={38} color={teal} strokeWidth={1.8} />,
    title: "Coaching & Education",
    desc: "Keep course enquiries and admission follow-ups organised.",
    flow: "Enquiry → Counselling → Enrolment",
  },
  {
    icon: <Store size={38} color={teal} strokeWidth={1.8} />,
    title: "Clinics & Services",
    desc: "Assign enquiries and keep customer conversations together.",
    flow: "Capture → Respond → Follow up",
  },
];

const agents = [
  {
    name: "Anjali",
    initials: "AS",
    color: "#2a6fb0",
    chatInitials: "PS",
    chatName: "Priya",
    chatMsg: "Product enquiry",
    time: "10:24 AM",
  },
  {
    name: "Rohit",
    initials: "RK",
    color: "#c8508c",
    chatInitials: "AP",
    chatName: "Amit",
    chatMsg: "Order update",
    time: "11:03 AM",
  },
  {
    name: "Pooja",
    initials: "PV",
    color: green,
    chatInitials: "NV",
    chatName: "Neha",
    chatMsg: "Follow-up",
    time: "12:18 PM",
  },
];

/* ─────────────────────────── page ─────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("crm_token");
    if (token) router.push("/dashboard");
    else setChecked(true);
  }, [router]);

  if (!checked) return null;

  return (
    <div
      className={`${poppins.className} mk-page`}
      style={{ background: "#fff", color: ink }}
    >
      <MarketingNav />

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#f7fbfb",
        }}
      >
        <Blob size={720} top={-260} right={-220} />
        <Blob
          size={520}
          bottom={-260}
          left={-200}
          color="rgba(0,168,173,0.10)"
        />
        <div
          className="mk-wrap mk-2col"
          style={{
            padding: "64px 48px 72px",
            display: "grid",
            gridTemplateColumns: "0.9fr 1.1fr",
            gap: 56,
            alignItems: "center",
            position: "relative",
          }}
        >
          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: mintDeep,
                color: teal,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                borderRadius: 24,
                padding: "10px 20px",
                marginBottom: 28,
              }}
            >
              <Users2 size={16} /> BUILT FOR TELECALLING &amp; SALES TEAMS
            </div>
            <h1
              className="mk-h1"
              style={{
                fontSize: 66,
                fontWeight: 800,
                lineHeight: 1.06,
                letterSpacing: "-0.025em",
                margin: "0 0 24px",
              }}
            >
              Every Lead.
              <br />
              Every Follow-up.
              <br />
              <span style={{ color: teal }}>Every Delivery.</span>
            </h1>
            <p
              style={{
                fontSize: 20,
                color: sub,
                lineHeight: 1.55,
                margin: "0 0 34px",
                maxWidth: 480,
              }}
            >
              Capture Meta leads, connect your team on one WhatsApp number, and
              automate the journey from enquiry to delivery.
            </p>
            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 30,
                flexWrap: "wrap",
              }}
            >
              <button onClick={() => router.push("/register")} style={ctaStyle}>
                Get Your 15-Day Free Demo <ArrowRight size={18} />
              </button>
              <a
                href="/features"
                style={{
                  ...ctaStyle,
                  background: "#fff",
                  color: ink,
                  border: `1px solid ${border}`,
                  boxShadow: "none",
                }}
              >
                Explore Features
              </a>
            </div>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              {[
                "One WhatsApp. Multiple agents.",
                "Orders, inventory & tracking.",
              ].map((t) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 15,
                    color: sub,
                  }}
                >
                  <CheckBadge size={26} />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Mockup + floating cards */}
          <div
            className="mk-hero-visual"
            style={{ position: "relative", zIndex: 2 }}
          >
            <AnimatedDots
              width={120}
              height={300}
              style={{ position: "absolute", left: -60, top: "6%", zIndex: 0 }}
            />
            <div style={{ position: "relative" }}>
              <div className="float-mockup">
                <HeroSalesMockup />
              </div>

              <div
                className="float-card float-card-a"
                style={{ top: -34, right: -34 }}
              >
                <MetaGlyph size={44} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: ink }}>
                    Meta leads captured
                  </div>
                  <div style={{ fontSize: 11, color: muted }}>
                    Forms · Messages · Calls · Missed calls
                  </div>
                </div>
              </div>

              <div
                className="float-card float-card-b"
                style={{ bottom: 40, left: -44, maxWidth: 240 }}
              >
                <WhatsAppGlyph size={40} />
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: ink,
                      lineHeight: 1.25,
                    }}
                  >
                    One WhatsApp.
                    <br />
                    Your whole team.
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    {[
                      ["RK", "#dbe9f7", "#2a6fb0"],
                      ["PS", "#fbe3ee", "#c8508c"],
                      ["AM", "#dff3e8", green],
                    ].map(([i, bg, fg], idx) => (
                      <span
                        key={i}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: bg,
                          color: fg,
                          fontSize: 10,
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: idx === 0 ? 0 : 6,
                        }}
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="float-card float-card-c"
                style={{ bottom: -30, right: -24 }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: teal,
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Truck size={20} />
                </span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: ink }}>
                    Order shipped
                  </div>
                  <div style={{ fontSize: 11, color: muted }}>
                    Delivery tracking connected
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature strip */}
        <div
          style={{
            borderTop: `1px solid ${border}`,
            background: "#fff",
            position: "relative",
          }}
        >
          <div
            className="mk-wrap mk-strip"
            style={{
              padding: "30px 48px",
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "wrap",
            }}
          >
            {[
              {
                icon: <Target size={26} color={teal} />,
                label: "Meta lead capture",
              },
              {
                icon: <WhatsAppGlyph size={26} />,
                label: "Bulk WhatsApp automation",
              },
              {
                icon: <Boxes size={26} color={teal} />,
                label: "Inventory management",
              },
              {
                icon: <Truck size={26} color={teal} />,
                label: "Delivery API & tracking",
              },
            ].map((f, i) => (
              <div
                key={f.label}
                className="mk-strip-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  fontSize: 17,
                  fontWeight: 500,
                  color: ink,
                  padding: "6px 36px",
                  borderLeft: i === 0 ? "none" : `1px solid ${border}`,
                }}
              >
                {f.icon} {f.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ SMART INBOX ═══════════════════════ */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#f9fcfc",
        }}
      >
        <Blob size={640} top={-200} left={-260} />
        <Blob size={640} top={40} right={-280} />
        <div
          className="mk-wrap"
          style={{ padding: "80px 48px 72px", position: "relative" }}
        >
          <SectionHeading
            eyebrow="Automated Lead Capture"
            subtitle="Capture Meta forms, calls and WhatsApp enquiries in one place. Give your team a clear next step for every lead."
          >
            Every Lead. One <span style={{ color: teal }}>Smart Inbox.</span>
          </SectionHeading>

          <div
            className="mk-4col"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 24,
            }}
          >
            {inboxChannels.map((c, i) => (
              <Reveal
                key={c.title}
                delay={i * 0.08}
                className="hover-lift"
                style={{
                  ...cardStyle,
                  padding: "38px 22px 32px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 22,
                    height: 66,
                  }}
                >
                  {c.icon}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 22,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    marginBottom: 10,
                  }}
                >
                  {c.title}
                  {c.beta && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#7a4d00",
                        background: "#fddc8c",
                        borderRadius: 8,
                        padding: "4px 10px",
                      }}
                    >
                      BETA
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 15, color: sub, lineHeight: 1.45 }}>
                  {c.desc}
                </div>
              </Reveal>
            ))}
          </div>

          {/* Four dotted animated lines converging into Zalgo CRM */}
          <svg
            className="mk-flow"
            viewBox="0 0 1000 90"
            width="100%"
            style={{ display: "block", height: "auto" }}
            aria-hidden
          >
            <defs>
              <marker
                id="inboxArrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0 0 L10 5 L0 10 z" fill={teal} />
              </marker>
            </defs>
            {[125, 375, 625, 875].map((x, i) => (
              <path
                key={x}
                className="flow-dots"
                style={{ animationDelay: `${i * 0.12}s` }}
                d={`M${x} 0 V 28 Q ${x} 44 ${x < 500 ? x + 16 : x - 16} 44 H ${
                  x < 500 ? 484 : 516
                } Q 500 44 500 60 V 62`}
                {...dotStroke}
              />
            ))}
            <path
              className="flow-dots"
              d="M500 44 V 78"
              {...dotStroke}
              markerEnd="url(#inboxArrow)"
            />
          </svg>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <div
              className="crm-pulse"
              style={{
                background: teal,
                color: "#fff",
                borderRadius: 18,
                padding: "30px 72px",
                display: "flex",
                alignItems: "center",
                gap: 22,
              }}
            >
              <Inbox size={48} strokeWidth={1.8} />
              <div>
                <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1 }}>
                  Zalgo CRM
                </div>
                <div style={{ fontSize: 17, opacity: 0.9, marginTop: 6 }}>
                  One <b>inbox</b>. Clear ownership. Timely follow-ups.
                </div>
              </div>
            </div>
          </div>

          <div
            className="mk-3col"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 20,
            }}
          >
            {[
              "Assign to the right agent",
              "Set follow-up reminders",
              "Track every conversation",
            ].map((t) => (
              <div
                key={t}
                style={{
                  ...cardStyle,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "18px 26px",
                }}
              >
                <CheckBadge size={34} />
                <span style={{ fontSize: 18, fontWeight: 700 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <Blob size={600} top={-160} left={-240} color="rgba(0,168,173,0.10)" />
        <Blob
          size={600}
          bottom={-260}
          right={-240}
          color="rgba(0,168,173,0.10)"
        />
        <div
          className="mk-wrap"
          style={{ padding: "80px 48px", position: "relative" }}
        >
          <SectionHeading
            eyebrow="How Zalgo CRM Works"
            subtitle="A clear next step for every lead — from capture to follow-up, order and delivery."
          >
            From First Enquiry to{" "}
            <span style={{ color: teal }}>Conversion</span>
          </SectionHeading>

          {/* Step numbers on a dotted animated line with arrows */}
          <div
            className="mk-steps-line"
            style={{ position: "relative", marginBottom: 24 }}
          >
            <svg
              viewBox="0 0 1000 70"
              width="100%"
              style={{ display: "block", height: "auto" }}
              aria-hidden
            >
              <defs>
                <marker
                  id="stepArrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0 0 L10 5 L0 10 z" fill={teal} />
                </marker>
              </defs>
              {[0, 1, 2].map((i) => (
                <path
                  key={i}
                  className="flow-dots"
                  d={`M${125 + i * 250 + 34} 35 H ${125 + (i + 1) * 250 - 40}`}
                  {...dotStroke}
                  markerEnd="url(#stepArrow)"
                />
              ))}
            </svg>
            <div
              className="mk-4col mk-step-nums"
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                alignItems: "center",
              }}
            >
              {howSteps.map((s, i) => (
                <div
                  key={s.title}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <div
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: "50%",
                      background: teal,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 22,
                      boxShadow: "0 10px 22px rgba(0,134,138,0.32)",
                    }}
                  >
                    0{i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mk-4col"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 24,
              marginBottom: 44,
            }}
          >
            {howSteps.map((s, i) => (
              <Reveal
                key={s.title}
                delay={i * 0.1}
                className="hover-lift"
                style={{
                  ...cardStyle,
                  padding: "30px 24px 28px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 104,
                    height: 104,
                    borderRadius: 18,
                    background: mintDeep,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                  }}
                >
                  {s.icon}
                </div>
                <div
                  style={{ fontSize: 26, fontWeight: 700, marginBottom: 10 }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: sub,
                    lineHeight: 1.5,
                    marginBottom: 20,
                    minHeight: 72,
                  }}
                >
                  {s.desc}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: teal,
                    fontWeight: 600,
                    background: mintDeep,
                    borderRadius: 10,
                    padding: "10px 14px",
                    display: "block",
                  }}
                >
                  {s.tags}
                </div>
              </Reveal>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, color: sub, marginBottom: 18 }}>
              See the complete workflow with your team.
            </div>
            <a href="/register" style={ctaStyle}>
              Get Your 15-Day Free Demo <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ ONE WHATSAPP NUMBER ═══════════════════════ */}
      <section
        style={{ background: mint, position: "relative", overflow: "hidden" }}
      >
        <Blob size={700} top={-200} right={-260} color="rgba(0,168,173,0.16)" />
        <div
          className="mk-wrap"
          style={{ padding: "80px 48px", position: "relative" }}
        >
          <div
            className="mk-2col"
            style={{
              display: "grid",
              gridTemplateColumns: "0.85fr 1.15fr",
              gap: 56,
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            <Reveal>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: teal,
                  letterSpacing: "0.12em",
                  marginBottom: 18,
                }}
              >
                SHARED WHATSAPP FOR YOUR TEAM
              </div>
              <h3
                className="mk-h2"
                style={{
                  fontSize: 50,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  margin: "0 0 20px",
                }}
              >
                One WhatsApp Number.
                <br />
                <span style={{ color: teal }}>Your Entire Team.</span>
              </h3>
              <p
                style={{
                  fontSize: 18,
                  color: sub,
                  lineHeight: 1.6,
                  margin: "0 0 28px",
                  maxWidth: 520,
                }}
              >
                Let every agent work from the same business number — with only
                their assigned contacts and chats.
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  marginBottom: 34,
                }}
              >
                {[
                  "One number for multiple agents",
                  "Assigned chats stay with the right agent",
                  "Managers can review team activity",
                ].map((t) => (
                  <div
                    key={t}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      fontSize: 17,
                      fontWeight: 500,
                    }}
                  >
                    <CheckBadge size={30} />
                    {t}
                  </div>
                ))}
              </div>
              <a href="/register" style={ctaStyle}>
                Get Your 15-Day Free Demo <ArrowRight size={18} />
              </a>
            </Reveal>

            <Reveal delay={0.12}>
              {/* One business number */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 0,
                }}
              >
                <div
                  style={{
                    ...cardStyle,
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    padding: "22px 40px",
                    boxShadow: "0 16px 40px rgba(20,30,35,0.08)",
                  }}
                >
                  <WhatsAppGlyph size={64} />
                  <div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        letterSpacing: "0.01em",
                      }}
                    >
                      ONE BUSINESS NUMBER
                    </div>
                    <div style={{ fontSize: 16, color: sub }}>
                      Your company WhatsApp
                    </div>
                  </div>
                </div>
              </div>

              {/* dotted tree connectors */}
              <svg
                viewBox="0 0 900 56"
                width="100%"
                style={{ display: "block", height: "auto" }}
                aria-hidden
              >
                <path className="flow-dots" d="M450 0 V 28" {...dotStroke} />
                <path className="flow-dots" d="M150 28 H 750" {...dotStroke} />
                {[150, 450, 750].map((x) => (
                  <path
                    key={x}
                    className="flow-dots"
                    d={`M${x} 28 V 56`}
                    {...dotStroke}
                  />
                ))}
                {[150, 450, 750].map((x) => (
                  <circle key={`c${x}`} cx={x} cy={28} r={5} fill={teal} />
                ))}
              </svg>

              <div
                className="mk-3col"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 16,
                }}
              >
                {agents.map((a) => (
                  <div key={a.name} style={{ ...cardStyle, padding: 18 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: "50%",
                          background: a.color,
                          color: "#fff",
                          fontSize: 16,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {a.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>
                          {a.name}
                        </div>
                        <div style={{ fontSize: 14, color: sub }}>
                          Telecaller
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#f6f9f9",
                        borderRadius: 10,
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          color: ink,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 10,
                        }}
                      >
                        <Lock size={13} color={teal} /> Assigned chats only
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background: mintDeep,
                            color: teal,
                            fontSize: 12,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {a.chatInitials}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>
                            {a.chatName}
                          </div>
                          <div style={{ fontSize: 12, color: muted }}>
                            {a.chatMsg}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: muted }}>
                          {a.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  ...cardStyle,
                  marginTop: 16,
                  padding: "18px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    Manager view: team activity in one place
                  </div>
                  <div style={{ fontSize: 14, color: sub }}>
                    See what your team is working on and track follow-ups.
                  </div>
                </div>
                <span
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: mintDeep,
                    color: teal,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <BarChart3 size={26} />
                </span>
              </div>
            </Reveal>
          </div>

          {/* Bulk WhatsApp Messaging banner */}
          <Reveal delay={0.15}>
            <div
              className="mk-bulk"
              style={{
                ...cardStyle,
                padding: "26px 36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 28,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <WhatsAppGlyph size={64} />
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    Bulk WhatsApp Messaging
                  </div>
                  <div style={{ fontSize: 16, color: sub }}>
                    Send one campaign to your opted-in contacts.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <div
                  style={{
                    ...cardStyle,
                    borderRadius: 12,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    boxShadow: "0 10px 26px rgba(20,30,35,0.06)",
                  }}
                >
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: mintDeep,
                      color: teal,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Megaphone size={20} />
                  </span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>
                      New product update
                    </div>
                    <div
                      style={{
                        width: 150,
                        height: 6,
                        borderRadius: 3,
                        background: "#e9eeee",
                        marginTop: 8,
                      }}
                    />
                    <div
                      style={{
                        width: 110,
                        height: 6,
                        borderRadius: 3,
                        background: "#e9eeee",
                        marginTop: 6,
                      }}
                    />
                  </div>
                </div>
                {/* fan-out dotted arrows */}
                <svg width="90" height="110" viewBox="0 0 90 110" aria-hidden>
                  <defs>
                    <marker
                      id="fanArrow"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto"
                    >
                      <path d="M0 0 L10 5 L0 10 z" fill={teal} />
                    </marker>
                  </defs>
                  {[18, 55, 92].map((y, i) => (
                    <path
                      key={y}
                      className="flow-dots"
                      style={{ animationDelay: `${i * 0.1}s` }}
                      d={`M0 55 H 30 Q 44 55 44 ${y > 55 ? y - 14 : y < 55 ? y + 14 : y} V ${y} H 80`}
                      {...dotStroke}
                      strokeWidth={2}
                      markerEnd="url(#fanArrow)"
                    />
                  ))}
                </svg>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {["#2a6fb0", "#c8508c", green].map((c) => (
                    <div
                      key={c}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: c,
                          opacity: 0.85,
                        }}
                      />
                      <span
                        style={{
                          width: 120,
                          height: 8,
                          borderRadius: 4,
                          background: "#e9eeee",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: ink,
                  lineHeight: 1.3,
                }}
              >
                One campaign.
                <br />
                Multiple customers.
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════ CUSTOMER JOURNEY ═══════════════════════ */}
      <section style={{ padding: "80px 0 0" }}>
        <div className="mk-wrap" style={{ padding: "0 48px" }}>
          <SectionHeading
            eyebrow="The Complete Customer Journey"
            subtitle="Capture enquiries, follow up, confirm orders and track delivery."
          >
            One lead. <span style={{ color: teal }}>A clear journey.</span>
          </SectionHeading>
        </div>
        <CustomerJourney />
      </section>

      {/* ═══════════════════════ CLOSE THE SALE (dark) ═══════════════════════ */}
      <section
        style={{ background: darkA, position: "relative", overflow: "hidden" }}
      >
        <Blob size={620} top={-240} left={-240} color="rgba(0,180,170,0.22)" />
        <Blob
          size={620}
          bottom={-300}
          right={-200}
          color="rgba(0,180,170,0.18)"
        />
        <div
          className="mk-wrap"
          style={{ padding: "80px 48px 40px", position: "relative" }}
        >
          <div
            className="mk-2col"
            style={{
              display: "grid",
              gridTemplateColumns: "0.9fr 1.1fr",
              gap: 56,
              alignItems: "center",
            }}
          >
            <Reveal>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: tealLight,
                  letterSpacing: "0.1em",
                  marginBottom: 18,
                }}
              >
                ORDERS, INVENTORY &amp; DELIVERY
              </div>
              <h3
                className="mk-h2"
                style={{
                  fontSize: 54,
                  fontWeight: 800,
                  lineHeight: 1.08,
                  color: "#fff",
                  margin: "0 0 20px",
                }}
              >
                Close the sale.
                <br />
                Connect every{" "}
                <span style={{ color: tealLight }}>next step.</span>
              </h3>
              <p
                style={{
                  fontSize: 18,
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.6,
                  margin: "0 0 28px",
                  maxWidth: 480,
                }}
              >
                Bring your sales and fulfilment teams together, from confirmed
                order to tracked delivery.
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  marginBottom: 34,
                }}
              >
                {[
                  "Manage inventory with your orders",
                  "Send automatic order confirmations",
                  "Connect your courier through delivery APIs",
                  "See shipment updates in one place",
                ].map((t) => (
                  <div
                    key={t}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#fff",
                    }}
                  >
                    <CheckBadge size={30} onDark />
                    {t}
                  </div>
                ))}
              </div>
              <a
                href="/register"
                style={{
                  ...ctaStyle,
                  background: "#fff",
                  color: "#06282a",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
                }}
              >
                Get Your 15-Day Free Demo <ArrowRight size={18} />
              </a>
            </Reveal>

            <Reveal delay={0.12}>
              <div
                className="mk-2col"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.3fr",
                  gap: 22,
                  alignItems: "stretch",
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 22 }}
                >
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      padding: 22,
                      display: "flex",
                      gap: 16,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 14,
                        background: mintDeep,
                        color: teal,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Boxes size={32} strokeWidth={1.8} />
                    </span>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>
                        Inventory
                      </div>
                      <div
                        style={{ fontSize: 15, color: sub, marginBottom: 8 }}
                      >
                        Wellness Pack
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: green,
                          background: "rgba(31,138,92,0.12)",
                          borderRadius: 20,
                          padding: "5px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Check size={12} strokeWidth={3} /> Stock available
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      padding: 22,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 14,
                      }}
                    >
                      <WhatsAppGlyph size={52} />
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        Order confirmation
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#f1f4f4",
                        borderRadius: 12,
                        padding: "14px 16px",
                        fontSize: 16,
                        color: ink,
                        lineHeight: 1.45,
                        marginBottom: 12,
                      }}
                    >
                      Hi Priya, your order #ZG1024 is confirmed.
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: green,
                        background: "rgba(31,138,92,0.12)",
                        borderRadius: 20,
                        padding: "6px 14px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Check size={12} strokeWidth={3} /> Message sent
                    </span>
                  </div>
                </div>

                <div
                  style={{ background: "#fff", borderRadius: 16, padding: 26 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: 18,
                      borderBottom: `1px solid ${border}`,
                      marginBottom: 22,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 14 }}
                    >
                      <span
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: 12,
                          background: mintDeep,
                          color: teal,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FileText size={26} />
                      </span>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            color: muted,
                            fontWeight: 600,
                          }}
                        >
                          ORDER #ZG1024
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>
                          Priya Sharma
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: teal,
                        background: mintDeep,
                        borderRadius: 20,
                        padding: "8px 16px",
                      }}
                    >
                      In transit
                    </span>
                  </div>
                  {[
                    {
                      l: "Order confirmed",
                      s: "Customer confirmation sent",
                      state: "done",
                    },
                    {
                      l: "Shipment created",
                      s: "Courier details linked",
                      state: "done",
                    },
                    {
                      l: "In transit",
                      s: "On the way to the customer",
                      state: "active",
                    },
                    { l: "Delivered", s: "Pending", state: "todo" },
                  ].map((s, i, arr) => (
                    <div
                      key={s.l}
                      style={{ display: "flex", gap: 18, position: "relative" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background:
                              s.state === "done"
                                ? green
                                : s.state === "active"
                                  ? teal
                                  : "#fff",
                            border:
                              s.state === "todo"
                                ? `2px solid ${border}`
                                : "none",
                            color: "#fff",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            boxShadow:
                              s.state === "active"
                                ? "0 0 0 6px rgba(0,134,138,0.18)"
                                : "none",
                          }}
                        >
                          {s.state === "done" ? (
                            <Check size={18} strokeWidth={3} />
                          ) : s.state === "active" ? (
                            <Truck size={18} />
                          ) : null}
                        </span>
                        {i < arr.length - 1 && (
                          <svg
                            width="4"
                            height="44"
                            viewBox="0 0 4 44"
                            aria-hidden
                          >
                            <path
                              className="flow-dots"
                              d="M2 0 V 44"
                              {...dotStroke}
                              stroke={s.state === "done" ? green : teal}
                            />
                          </svg>
                        )}
                      </div>
                      <div style={{ paddingTop: 6 }}>
                        <div
                          style={{ fontSize: 18, fontWeight: 700, color: ink }}
                        >
                          {s.l}
                        </div>
                        <div style={{ fontSize: 14, color: sub }}>{s.s}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  marginTop: 14,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Illustrative workflow
              </div>
            </Reveal>
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 48,
              fontSize: 16,
              color: "rgba(255,255,255,0.75)",
              fontWeight: 600,
              letterSpacing: "0.04em",
              padding: "26px 0 8px",
              borderTop: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            One order. One connected view.
          </div>
        </div>
      </section>

      {/* ═══════════════════════ SALE CONFIRMED (darker) ═══════════════════════ */}
      <section
        style={{ background: darkB, position: "relative", overflow: "hidden" }}
      >
        <Blob size={560} top={-200} left={-200} color="rgba(0,180,170,0.20)" />
        <Blob
          size={700}
          bottom={-320}
          right={-280}
          color="rgba(0,180,170,0.16)"
        />
        <AnimatedDots
          width={90}
          height={220}
          color="rgba(0,168,173,0.35)"
          style={{ position: "absolute", left: 0, bottom: 40 }}
        />
        <div
          className="mk-wrap mk-2col"
          style={{
            padding: "80px 48px",
            display: "grid",
            gridTemplateColumns: "0.9fr 1.1fr",
            gap: 56,
            alignItems: "center",
            position: "relative",
          }}
        >
          <Reveal>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: tealLight,
                letterSpacing: "0.14em",
                marginBottom: 18,
              }}
            >
              ORDERS • INVENTORY • DELIVERY
            </div>
            <h3
              className="mk-h2"
              style={{
                fontSize: 54,
                fontWeight: 800,
                lineHeight: 1.08,
                color: "#fff",
                margin: "0 0 20px",
              }}
            >
              Sale confirmed.
              <br />
              <span style={{ color: tealLight }}>Delivery connected.</span>
            </h3>
            <p
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.6,
                margin: "0 0 28px",
                maxWidth: 480,
              }}
            >
              Manage stock, confirm orders and track shipments from one CRM.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                marginBottom: 34,
              }}
            >
              {[
                "Inventory management",
                "Automatic WhatsApp confirmations",
                "Courier integration & tracking",
              ].map((t) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    fontSize: 17,
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
                  <CheckBadge size={30} onDark />
                  {t}
                </div>
              ))}
            </div>
            <a
              href="/register"
              style={{
                ...ctaStyle,
                background: "#fff",
                color: "#06282a",
                boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
              }}
            >
              Get Your 15-Day Free Demo <ArrowRight size={18} />
            </a>
          </Reveal>

          <Reveal delay={0.12}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 28 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 22,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 12,
                      background: mintDeep,
                      color: teal,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={26} />
                  </span>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>
                      Order #ZG1024
                    </div>
                    <div style={{ fontSize: 15, color: sub }}>Priya Sharma</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: teal,
                    background: mintDeep,
                    borderRadius: 20,
                    padding: "8px 16px",
                  }}
                >
                  In transit
                </span>
              </div>

              <div
                className="mk-2col-keep"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    background: "#f4f8f8",
                    borderRadius: 14,
                    padding: "26px 22px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      background: teal,
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Boxes size={32} strokeWidth={1.8} />
                  </span>
                  <div>
                    <div style={{ fontSize: 15, color: sub }}>Inventory</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>
                      Stock available
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    background: "#f4f8f8",
                    borderRadius: 14,
                    padding: "26px 22px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <WhatsAppGlyph size={64} />
                  <div>
                    <div style={{ fontSize: 15, color: sub }}>WhatsApp</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>
                      Confirmation sent
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  border: `1px solid ${border}`,
                  borderRadius: 14,
                  padding: 24,
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 2 }}>
                  Track the delivery
                </div>
                <div style={{ fontSize: 15, color: sub, marginBottom: 26 }}>
                  Courier connected through delivery API.
                </div>

                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  {["Confirmed", "Shipped", "In transit", "Delivered"].map(
                    (l, i) => (
                      <div
                        key={l}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          flex: i < 3 ? 1 : 0,
                        }}
                      >
                        <div style={{ textAlign: "center", width: 90 }}>
                          <div
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: "50%",
                              background:
                                i < 2 ? green : i === 2 ? teal : "#e6ebeb",
                              color: i < 3 ? "#fff" : muted,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              margin: "0 auto 10px",
                            }}
                          >
                            {i < 2 ? (
                              <Check size={26} strokeWidth={3} />
                            ) : i === 2 ? (
                              <Truck size={26} />
                            ) : (
                              <MapPin size={24} />
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: ink,
                            }}
                          >
                            {l}
                          </div>
                          {i === 3 && (
                            <div style={{ fontSize: 13, color: muted }}>
                              Pending
                            </div>
                          )}
                        </div>
                        {i < 3 && (
                          <svg
                            height="60"
                            width="100%"
                            style={{ flex: 1, marginTop: 0 }}
                            preserveAspectRatio="none"
                            viewBox="0 0 100 60"
                            aria-hidden
                          >
                            <path
                              className="flow-dots"
                              d="M0 30 H 100"
                              {...dotStroke}
                              stroke={i < 2 ? green : teal}
                              strokeWidth={3}
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>
                        )}
                      </div>
                    ),
                  )}
                </div>

                <div
                  style={{
                    marginTop: 22,
                    background: mintDeep,
                    borderRadius: 12,
                    padding: "14px 18px",
                    fontSize: 16,
                    fontWeight: 600,
                    color: ink,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <MapPin size={20} color={teal} /> Order and tracking details.
                  Together.
                </div>
              </div>
              <div style={{ marginTop: 14, fontSize: 13, color: muted }}>
                Illustrative workflow
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════ INDUSTRIES ═══════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <Blob size={640} top={-220} left={-260} color="rgba(0,168,173,0.10)" />
        <Blob
          size={640}
          bottom={-260}
          right={-260}
          color="rgba(0,168,173,0.10)"
        />
        <div
          className="mk-wrap"
          style={{ padding: "80px 48px", position: "relative" }}
        >
          <SectionHeading
            eyebrow="Built for Your Sales Workflow"
            subtitle="For teams that turn enquiries into customers."
          >
            Different businesses.{" "}
            <span style={{ color: teal }}>One connected CRM.</span>
          </SectionHeading>

          <div
            className="mk-3col"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 24,
              marginBottom: 48,
            }}
          >
            {industries.map((ind, i) => (
              <Reveal
                key={ind.title}
                delay={(i % 3) * 0.08}
                className="hover-lift"
                style={{
                  ...cardStyle,
                  padding: "28px 26px",
                  borderTop: `4px solid ${teal}`,
                  display: "flex",
                  gap: 22,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 116,
                    height: 116,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle at 30% 30%, #ffffff 0%, #e3f2f0 100%)",
                    boxShadow: "inset 0 0 0 1px rgba(0,134,138,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {ind.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      marginBottom: 8,
                      lineHeight: 1.2,
                    }}
                  >
                    {ind.title}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      color: sub,
                      lineHeight: 1.5,
                      marginBottom: 14,
                    }}
                  >
                    {ind.desc}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: teal }}>
                    {ind.flow}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 22,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 20, color: ink, fontWeight: 500 }}>
              See how Zalgo fits your team.
            </div>
            <a href="/register" style={ctaStyle}>
              Get Your 15-Day Free Demo <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 15-DAY FREE TRIAL FORM ═══════════════════════ */}
      <section
        style={{ background: mint, position: "relative", overflow: "hidden" }}
      >
        <Blob size={700} top={-260} left={-260} color="rgba(0,168,173,0.18)" />
        <Blob
          size={700}
          bottom={-300}
          right={-260}
          color="rgba(0,168,173,0.16)"
        />
        <div
          className="mk-wrap mk-2col"
          style={{
            padding: "80px 48px",
            display: "grid",
            gridTemplateColumns: "0.95fr 1.05fr",
            gap: 64,
            alignItems: "center",
            position: "relative",
          }}
        >
          <Reveal>
            <div
              style={{
                display: "inline-block",
                background: mintDeep,
                color: teal,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                borderRadius: 24,
                padding: "10px 20px",
                marginBottom: 26,
              }}
            >
              15 DAYS. FREE TO TRY.
            </div>
            <h3
              className="mk-h2"
              style={{
                fontSize: 58,
                fontWeight: 800,
                lineHeight: 1.06,
                letterSpacing: "-0.02em",
                margin: "0 0 20px",
              }}
            >
              Your leads deserve
              <br />a <span style={{ color: teal }}>better follow-up.</span>
            </h3>
            <p
              style={{
                fontSize: 20,
                color: sub,
                lineHeight: 1.55,
                margin: "0 0 34px",
                maxWidth: 560,
              }}
            >
              Bring your leads, WhatsApp conversations and order tracking into
              one CRM.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 22,
                marginBottom: 34,
              }}
            >
              {[
                {
                  icon: <Users2 size={28} color={teal} />,
                  title: "Every enquiry in one place",
                  desc: "Capture leads from your connected channels.",
                },
                {
                  icon: <MessageCircle size={28} color={teal} />,
                  title: "One WhatsApp. Your whole team.",
                  desc: "Keep chats assigned and follow-ups organised.",
                },
                {
                  icon: <Package size={28} color={teal} />,
                  title: "From order to delivery",
                  desc: "Manage inventory and track shipments.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  style={{ display: "flex", gap: 20, alignItems: "center" }}
                >
                  <div
                    style={{
                      width: 66,
                      height: 66,
                      borderRadius: 14,
                      background: mintDeep,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>
                      {f.title}
                    </div>
                    <div style={{ fontSize: 16, color: sub }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Leads → Follow-ups → Orders, dotted animated */}
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {[
                { l: "Leads", icon: <Users2 size={26} color={teal} /> },
                { l: "Follow-ups", icon: <WhatsAppGlyph size={30} /> },
                { l: "Orders", icon: <Package size={26} color={teal} /> },
              ].map((s, i) => (
                <div
                  key={s.l}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <div
                    style={{
                      ...cardStyle,
                      borderRadius: 14,
                      padding: "16px 22px",
                      fontSize: 15,
                      fontWeight: 700,
                      textAlign: "center",
                      minWidth: 118,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {s.icon}
                    {s.l}
                  </div>
                  {i < 2 && (
                    <svg width="60" height="6" viewBox="0 0 60 6" aria-hidden>
                      <path
                        className="flow-dots"
                        d="M2 3 H 58"
                        {...dotStroke}
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal
            delay={0.12}
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 40,
              boxShadow: "0 30px 70px rgba(20,30,35,0.10)",
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: mintDeep,
                color: teal,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                borderRadius: 24,
                padding: "8px 16px",
                marginBottom: 18,
              }}
            >
              15-DAY FREE TRIAL
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                marginBottom: 6,
                lineHeight: 1.15,
              }}
            >
              Try Zalgo with your team.
            </div>
            <div style={{ fontSize: 17, color: sub, marginBottom: 26 }}>
              Share your details to request trial access.
            </div>
            <TrialSignupForm />
            <div
              style={{
                borderTop: `1px solid ${border}`,
                marginTop: 26,
                paddingTop: 18,
                textAlign: "center",
                fontSize: 15,
                color: sub,
              }}
            >
              Have questions?{" "}
              <a
                href="mailto:sales@zalgoinfotech.com"
                style={{ color: teal, fontWeight: 600 }}
              >
                sales@zalgoinfotech.com
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════ FAQ ═══════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <Blob
          size={560}
          bottom={-260}
          left={-220}
          color="rgba(0,168,173,0.10)"
        />
        <div
          className="mk-wrap mk-2col"
          style={{
            padding: "80px 48px",
            display: "grid",
            gridTemplateColumns: "0.75fr 1.25fr",
            gap: 64,
            position: "relative",
          }}
        >
          <Reveal>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: teal,
                letterSpacing: "0.12em",
                marginBottom: 18,
              }}
            >
              BEFORE YOU GET STARTED
            </div>
            <h3
              className="mk-h2"
              style={{
                fontSize: 50,
                fontWeight: 800,
                lineHeight: 1.1,
                margin: "0 0 18px",
              }}
            >
              Real questions.
              <br />
              <span style={{ color: teal }}>Clear answers.</span>
            </h3>
            <p
              style={{
                fontSize: 18,
                color: sub,
                lineHeight: 1.55,
                margin: "0 0 32px",
                maxWidth: 380,
              }}
            >
              Everything you want to know before bringing your team on board.
            </p>
            <div
              style={{
                background: mint,
                borderRadius: 18,
                padding: 28,
                display: "flex",
                gap: 22,
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: "50%",
                  background: mintDeep,
                  color: teal,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MessageCircle size={30} />
              </span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                  Still have a question?
                </div>
                <div style={{ fontSize: 16, color: sub, marginBottom: 18 }}>
                  Talk to us about your workflow.
                </div>
                <a
                  href="/contact"
                  style={{
                    ...ctaStyle,
                    padding: "13px 22px",
                    fontSize: 15,
                    boxShadow: "none",
                    marginBottom: 18,
                  }}
                >
                  Ask our team <ArrowRight size={16} />
                </a>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 15,
                    color: sub,
                  }}
                >
                  <Mail size={18} color={teal} /> sales@zalgoinfotech.com
                </div>
              </div>
            </div>
            <a
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginTop: 32,
                color: teal,
                fontWeight: 600,
                fontSize: 16,
                textDecoration: "none",
                borderBottom: `2px solid ${teal}`,
                paddingBottom: 4,
              }}
            >
              Explore the 15-day free trial <ArrowRight size={16} />
            </a>
          </Reveal>

          <Reveal delay={0.1}>
            <FaqAccordion />
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
      <section
        style={{ background: mint, position: "relative", overflow: "hidden" }}
      >
        <Blob size={520} top={-260} left={-200} color="rgba(0,168,173,0.18)" />
        <Blob
          size={520}
          bottom={-300}
          right={-160}
          color="rgba(0,168,173,0.16)"
        />
        <div
          className="mk-wrap"
          style={{
            padding: "52px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
            position: "relative",
          }}
        >
          <div>
            <div
              className="mk-h2"
              style={{
                fontSize: 44,
                fontWeight: 800,
                marginBottom: 8,
                lineHeight: 1.15,
              }}
            >
              Ready to organise your next lead?
            </div>
            <div style={{ fontSize: 20, color: sub }}>
              Bring your team, conversations and orders together.
            </div>
          </div>
          <button
            onClick={() => router.push("/register")}
            style={{ ...ctaStyle, padding: "20px 34px", fontSize: 20 }}
          >
            Start Your 15-Day Free Trial <ArrowRight size={20} />
          </button>
        </div>
      </section>

      <MarketingFooter />
      <MarketingStyles />
    </div>
  );
}
