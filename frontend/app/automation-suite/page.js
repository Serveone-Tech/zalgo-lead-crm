"use client";
import {
  MessagesSquare,
  Mail,
  ArrowRight,
  Zap,
  Check,
  UserPlus,
  Truck,
  BellRing,
  Wallet,
  AlertTriangle,
  Megaphone,
  Users2,
  Calendar,
  Package,
  Settings,
  Send,
  Clock,
  ShieldCheck,
  Sparkles,
  Award,
} from "lucide-react";
import { ink, sub, muted, border } from "../../lib/marketing-theme";
import { poppins } from "../../lib/marketing-font";
import { WhatsAppGlyph } from "../../components/BrandIcons";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";
import MarketingStyles from "../../components/MarketingStyles";
import Reveal from "../../components/Reveal";
import AnimatedDots from "../../components/AnimatedDots";

const REGISTER_URL = "/register";

/* ─────────── LeadLo tokens ─────────── */
const blue = "#1a5cff";
const blueDeep = "#0f47d6";
const orange = "#f59a23";
const mint = "#eef4ff";
const mintDeep = "#dfe9ff";
const orangeSoft = "#fff1dd";
const green = "#1f8a5c";
const wa = "#25D366";

const cta = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  background: `linear-gradient(180deg, ${blue} 0%, ${blueDeep} 100%)`,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "16px 28px",
  fontSize: 16,
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(26,92,255,0.28)",
  whiteSpace: "nowrap",
  fontFamily: "inherit",
};
const ctaGhost = {
  ...cta,
  background: "#fff",
  color: ink,
  border: `1px solid ${border}`,
  boxShadow: "none",
};
const card = {
  background: "#fff",
  border: `1px solid ${border}`,
  borderRadius: 16,
};
const dotStroke = {
  fill: "none",
  stroke: blue,
  strokeWidth: 2.4,
  strokeDasharray: "1 7",
  strokeLinecap: "round",
};

function Blob({
  size,
  top,
  left,
  right,
  bottom,
  color = "rgba(26,92,255,0.14)",
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
function Spark({ style }) {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden style={style}>
      <path
        d="M4 24 L12 12"
        stroke={orange}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M18 6 L21 2"
        stroke={orange}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M17 20 L27 17"
        stroke={orange}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
function Pill({ children, icon: Icon, tone = "blue" }) {
  const t =
    tone === "orange"
      ? { bg: orangeSoft, fg: orange, bd: orange }
      : { bg: mintDeep, fg: blue, bd: "#c9d8ff" };
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: t.bg,
        color: t.fg,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.1em",
        borderRadius: 24,
        padding: "10px 20px",
        border: `1px solid ${t.bd}`,
      }}
    >
      {Icon && <Icon size={16} />} {children}
    </div>
  );
}
function Tile({
  children,
  size = 64,
  bg = mintDeep,
  color = blue,
  radius = 14,
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}
function CheckBadge({ size = 28, onDark = false }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: onDark ? "rgba(255,255,255,0.18)" : blue,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Check size={size * 0.5} strokeWidth={3} />
    </span>
  );
}
function Toggle({ on = true }) {
  return (
    <span
      style={{
        width: 46,
        height: 26,
        borderRadius: 13,
        background: on ? blue : "#dfe6f3",
        position: "relative",
        display: "inline-block",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 23 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        }}
      />
    </span>
  );
}
function Heading({ eyebrow, title, subtitle, icon }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 40 }}>
      <Pill icon={icon}>{eyebrow}</Pill>
      <h2
        className="mk-h2"
        style={{
          fontSize: 58,
          fontWeight: 800,
          lineHeight: 1.06,
          letterSpacing: "-0.025em",
          margin: "18px 0 12px",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <div
          style={{
            fontSize: 20,
            color: sub,
            lineHeight: 1.5,
            maxWidth: 780,
            margin: "0 auto",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

/* ─────────── content (copy kept from the original page) ─────────── */
const CHANNELS = [
  {
    icon: <WhatsAppGlyph size={64} />,
    title: "WhatsApp Automation",
    desc: "Auto-reply to new leads, send order confirmations, and follow up on payments — all via WhatsApp Cloud API, from your own business number, without lifting a finger.",
    tag: "Meta Cloud API",
  },
  {
    icon: (
      <Tile size={64} radius={32}>
        <MessagesSquare size={30} />
      </Tile>
    ),
    title: "SMS Automation",
    desc: "Reach customers who don't have WhatsApp with automated SMS updates for the exact same triggers — nobody gets left out.",
    tag: "Twilio",
  },
  {
    icon: (
      <Tile size={64} radius={32} bg={orangeSoft} color={orange}>
        <Mail size={30} />
      </Tile>
    ),
    title: "Email Automation",
    desc: "Send branded email notifications automatically for new leads, conversions, and payment reminders — consistent, on time, every time.",
    tag: "Gmail",
  },
];

const TRIGGERS = [
  {
    icon: UserPlus,
    title: "New Lead Added",
    desc: "The moment a lead is created — from any channel.",
    sample:
      "Hi {name}, thank you for your interest! Our team will get back to you shortly.",
  },
  {
    icon: Award,
    title: "Lead Converted",
    desc: "When a lead is marked as Converted.",
    sample: "Welcome {name}! Thank you for choosing us.",
    accent: true,
  },
  {
    icon: Truck,
    title: "Order Shipped",
    desc: "When a courier shipment is created and a tracking ID is generated.",
    sample:
      "Your order has been shipped via {provider}. Tracking ID: {tracking_id}",
  },
  {
    icon: BellRing,
    title: "Follow-up Due Today",
    desc: "For leads with a follow-up scheduled today.",
    sample: "Reminder: follow up with {name} ({phone}) today.",
    accent: true,
  },
  {
    icon: Wallet,
    title: "Payment Due",
    desc: "When a customer's COD balance due date arrives.",
    sample: "Dear {name}, your payment of {amount} is due on {due_date}.",
  },
  {
    icon: AlertTriangle,
    title: "Payment Overdue",
    desc: "When a payment is past its due date.",
    sample: "Your payment of {amount} is overdue since {due_date}.",
    accent: true,
  },
];

const VARS = [
  "{name}",
  "{phone}",
  "{email}",
  "{amount}",
  "{due_date}",
  "{tracking_id}",
  "{provider}",
  "{business_name}",
];

export default function AutomationSuitePage() {
  return (
    <div
      className={`${poppins.className} mk-page`}
      style={{ background: "#fff", color: ink }}
    >
      <MarketingNav />

      {/* ═══════════ 1. HERO ═══════════ */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#f4f8ff",
        }}
      >
        <Blob size={760} top={-300} right={-240} />
        <Blob
          size={520}
          bottom={-260}
          left={-220}
          color="rgba(26,92,255,0.10)"
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
          <Reveal>
            <Pill icon={Zap} tone="orange">
              PRO MAX FEATURE
            </Pill>
            <h1
              className="mk-h1"
              style={{
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.06,
                letterSpacing: "-0.03em",
                margin: "22px 0 22px",
              }}
            >
              Automate every
              <br />
              <span style={{ color: blue }}>follow-up.</span>
              <br />
              Every channel.
            </h1>
            <p
              style={{
                fontSize: 20,
                color: sub,
                lineHeight: 1.55,
                margin: "0 0 32px",
                maxWidth: 520,
              }}
            >
              Set it up once — WhatsApp, SMS and Email messages go out
              automatically the moment something happens, so a lead never waits
              on a human to be free.
            </p>
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 28,
              }}
            >
              <a href={REGISTER_URL} style={cta}>
                Start Your 15-Day Free Trial <ArrowRight size={18} />
              </a>
              <a href="#triggers" style={ctaGhost}>
                See the triggers
              </a>
            </div>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              {["From your own number", "No code, no extra tool"].map((t) => (
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
                  <CheckBadge size={26} /> {t}
                </div>
              ))}
            </div>
          </Reveal>

          {/* trigger → channels mockup */}
          <Reveal
            delay={0.12}
            className="mk-hero-visual"
            style={{ position: "relative" }}
          >
            <AnimatedDots
              width={110}
              height={260}
              style={{ position: "absolute", left: -56, top: "8%", zIndex: 0 }}
            />
            <Spark
              style={{ position: "absolute", top: -22, right: 30, zIndex: 3 }}
            />
            <div
              className="float-mockup"
              style={{
                ...card,
                borderRadius: 22,
                padding: 26,
                boxShadow: "0 40px 90px rgba(11,31,74,0.18)",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Tile size={44} radius={12} bg={blue} color="#fff">
                    <Zap size={22} />
                  </Tile>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>
                      Trigger: New Lead Added
                    </div>
                    <div style={{ fontSize: 12.5, color: muted }}>
                      Runs automatically · 3 channels
                    </div>
                  </div>
                </div>
                <Toggle />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 64px 1fr",
                  alignItems: "center",
                }}
              >
                <div style={{ ...card, background: "#f8faff", padding: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: mintDeep,
                        color: blue,
                        fontSize: 13,
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      PS
                    </span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>
                        Priya Sharma
                      </div>
                      <div style={{ fontSize: 12, color: muted }}>
                        Meta lead form
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: green,
                      background: "#e4f5ec",
                      borderRadius: 999,
                      padding: "4px 10px",
                    }}
                  >
                    New lead · 10:30 AM
                  </span>
                </div>
                <svg viewBox="0 0 64 220" width="64" height="220" aria-hidden>
                  <defs>
                    <marker
                      id="asArrow"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                    >
                      <path d="M0 0 L10 5 L0 10 z" fill={blue} />
                    </marker>
                  </defs>
                  <path
                    className="flow-dots"
                    d="M0 110 H 22 Q 32 110 32 100 V 40 H 60 M0 110 H 60 M32 110 Q 32 120 32 130 V 180 H 60"
                    {...dotStroke}
                    markerEnd="url(#asArrow)"
                  />
                </svg>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      ...card,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <WhatsAppGlyph size={34} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>
                        WhatsApp
                      </div>
                      <div
                        style={{ fontSize: 11, color: green, fontWeight: 600 }}
                      >
                        ✓✓ Delivered
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      ...card,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Tile size={34} radius={17}>
                      <MessagesSquare size={16} />
                    </Tile>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>SMS</div>
                      <div
                        style={{ fontSize: 11, color: green, fontWeight: 600 }}
                      >
                        ✓ Sent
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      ...card,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Tile size={34} radius={17} bg={orangeSoft} color={orange}>
                      <Mail size={16} />
                    </Tile>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Email</div>
                      <div
                        style={{ fontSize: 11, color: green, fontWeight: 600 }}
                      >
                        ✓ Sent
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <WhatsAppGlyph size={32} />
                <div
                  style={{
                    background: "#eef3ff",
                    borderRadius: "4px 14px 14px 14px",
                    padding: "12px 16px",
                    maxWidth: 380,
                  }}
                >
                  <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                    Hi <b>Priya</b>, thank you for your interest! Our team will
                    connect with you shortly. — <b>LeadLo</b>
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: muted,
                      marginTop: 6,
                      textAlign: "right",
                    }}
                  >
                    10:30 AM <span style={{ color: blue }}>✓✓</span>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="float-card float-card-c"
              style={{ bottom: -26, right: -24 }}
            >
              <Tile size={40} radius={20} bg="#e4f5ec" color={green}>
                <Clock size={20} />
              </Tile>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  Sent in 2 seconds
                </div>
                <div style={{ fontSize: 11, color: muted }}>
                  No one had to remember
                </div>
              </div>
            </div>
          </Reveal>
        </div>
        <div style={{ borderTop: `1px solid ${border}`, background: "#fff" }}>
          <div
            className="mk-wrap"
            style={{
              padding: "26px 48px",
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "wrap",
            }}
          >
            {[
              { icon: <WhatsAppGlyph size={26} />, l: "WhatsApp Cloud API" },
              { icon: <MessagesSquare size={26} color={blue} />, l: "SMS" },
              { icon: <Mail size={26} color={blue} />, l: "Email" },
              {
                icon: <Megaphone size={26} color={blue} />,
                l: "Bulk broadcasts",
              },
            ].map((f, i) => (
              <div
                key={f.l}
                className="mk-strip-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  fontSize: 17,
                  fontWeight: 500,
                  padding: "6px 36px",
                  borderLeft: i ? `1px solid ${border}` : "none",
                }}
              >
                {f.icon} {f.l}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 2. THREE CHANNELS ═══════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <Blob size={600} top={-200} left={-260} color="rgba(26,92,255,0.10)" />
        <div
          className="mk-wrap"
          style={{ padding: "80px 48px 64px", position: "relative" }}
        >
          <Heading
            eyebrow="THREE CHANNELS, ONE SETUP"
            title={
              <>
                Reach every lead{" "}
                <span style={{ color: blue }}>the way they prefer.</span>
              </>
            }
            subtitle="Connect them once and every automated trigger can reach a lead however they actually prefer to be contacted."
          />
          <div
            className="mk-3col"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 24,
            }}
          >
            {CHANNELS.map((c, i) => (
              <Reveal
                key={c.title}
                delay={i * 0.08}
                className="hover-lift"
                style={{
                  ...card,
                  padding: "34px 28px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {c.icon}
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    margin: "20px 0 10px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {c.title}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: sub,
                    lineHeight: 1.55,
                    flex: 1,
                  }}
                >
                  {c.desc}
                </div>
                <div
                  style={{
                    marginTop: 20,
                    fontSize: 13,
                    fontWeight: 700,
                    color: blue,
                    background: mintDeep,
                    borderRadius: 999,
                    padding: "7px 14px",
                  }}
                >
                  Via {c.tag}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 3. TRIGGERS ═══════════ */}
      <section
        id="triggers"
        style={{ background: mint, position: "relative", overflow: "hidden" }}
      >
        <Blob size={640} top={-220} right={-260} color="rgba(26,92,255,0.16)" />
        <div
          className="mk-wrap"
          style={{ padding: "80px 48px", position: "relative" }}
        >
          <Heading
            eyebrow="AUTOMATED TRIGGERS"
            title={
              <>
                Pick a trigger, write a message,{" "}
                <span style={{ color: blue }}>done.</span>
              </>
            }
            subtitle="No code, no separate automation tool to learn. Every trigger can send through WhatsApp, SMS or Email — mix and match per trigger, and edit the message text anytime."
          />
          <div
            className="mk-3col"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 24,
              marginBottom: 28,
            }}
          >
            {TRIGGERS.map((t, i) => {
              const Icon = t.icon;
              return (
                <Reveal
                  key={t.title}
                  delay={(i % 3) * 0.08}
                  className="hover-lift"
                  style={{
                    ...card,
                    padding: "24px 24px 20px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 14 }}
                    >
                      <Tile
                        size={52}
                        radius={13}
                        bg={t.accent ? orangeSoft : mintDeep}
                        color={t.accent ? orange : blue}
                      >
                        <Icon size={24} />
                      </Tile>
                      <div
                        style={{
                          fontSize: 19,
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}
                      >
                        {t.title}
                      </div>
                    </div>
                    <Toggle />
                  </div>
                  <div
                    style={{
                      fontSize: 14.5,
                      color: sub,
                      lineHeight: 1.5,
                      marginBottom: 14,
                    }}
                  >
                    {t.desc}
                  </div>
                  <div
                    style={{
                      background: "#f8faff",
                      border: `1px solid ${border}`,
                      borderRadius: 12,
                      padding: "12px 14px",
                      fontSize: 13.5,
                      color: ink,
                      lineHeight: 1.5,
                      marginTop: "auto",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: muted,
                        letterSpacing: "0.08em",
                        marginBottom: 6,
                      }}
                    >
                      MESSAGE
                    </div>
                    {t.sample}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                    <WhatsAppGlyph size={26} />
                    <Tile size={26} radius={13}>
                      <MessagesSquare size={13} />
                    </Tile>
                    <Tile size={26} radius={13} bg={orangeSoft} color={orange}>
                      <Mail size={13} />
                    </Tile>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <div
            style={{
              ...card,
              padding: "18px 26px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: ink }}>
              Template variables:
            </span>
            {VARS.map((v) => (
              <code
                key={v}
                style={{
                  background: mintDeep,
                  color: blue,
                  borderRadius: 8,
                  padding: "5px 10px",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {v}
              </code>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 4. BULK BROADCAST ═══════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <Blob
          size={560}
          bottom={-260}
          left={-240}
          color="rgba(26,92,255,0.10)"
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
                fontSize: 14,
                fontWeight: 700,
                color: blue,
                letterSpacing: "0.12em",
                marginBottom: 18,
              }}
            >
              BULK WHATSAPP MESSAGING
            </div>
            <h3
              className="mk-h2"
              style={{
                fontSize: 50,
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                margin: "0 0 18px",
              }}
            >
              One campaign.
              <br />
              <span style={{ color: blue }}>Multiple customers.</span>
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
              A festival offer, a discount for customers who haven't ordered in
              a while, an announcement — pick who gets it, preview the reach,
              then send in one go.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                marginBottom: 32,
              }}
            >
              {[
                "Audiences: all, new, or inactive customers",
                "Approved WhatsApp templates for contacts outside the 24-hour window",
                "Delivered / failed count for every campaign",
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
                  <CheckBadge size={30} /> {t}
                </div>
              ))}
            </div>
            <a href={REGISTER_URL} style={cta}>
              Send your first campaign <ArrowRight size={18} />
            </a>
          </Reveal>
          <Reveal
            delay={0.12}
            style={{
              ...card,
              borderRadius: 24,
              padding: "26px 30px",
              background: "#f8faff",
            }}
          >
            <div
              style={{
                ...card,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 18,
              }}
            >
              <Tile size={48} radius={24}>
                <Megaphone size={22} />
              </Tile>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  Festival offer — 20% off
                </div>
                <div style={{ fontSize: 13, color: muted }}>
                  Audience: Haven't ordered in 30 days · 128 customers
                </div>
              </div>
              <Toggle />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 1fr",
                alignItems: "center",
              }}
            >
              <div style={{ ...card, padding: 16 }}>
                <WhatsAppGlyph size={34} />
                <div
                  style={{
                    marginTop: 10,
                    background: "#eef3ff",
                    borderRadius: "4px 12px 12px 12px",
                    padding: "10px 12px",
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  Hi {"{name}"}, we're running a festival offer just for you…
                </div>
              </div>
              <svg viewBox="0 0 80 150" width="80" height="150" aria-hidden>
                {[20, 75, 130].map((y, i) => (
                  <path
                    key={y}
                    className="flow-dots"
                    style={{ animationDelay: `${i * 0.1}s` }}
                    d={`M0 75 H 30 Q 40 75 40 ${y > 75 ? y - 12 : y < 75 ? y + 12 : y} V ${y} H 76`}
                    {...dotStroke}
                    strokeWidth={2}
                    markerEnd="url(#asArrow)"
                  />
                ))}
              </svg>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[
                  ["RK", "#2a6fb0", "Delivered"],
                  ["AS", "#c8508c", "Read"],
                  ["PV", green, "Delivered"],
                ].map(([i, c, s]) => (
                  <div
                    key={i}
                    style={{
                      ...card,
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: c,
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {i}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        background: "#e4ebf7",
                      }}
                    />
                    <span
                      style={{ fontSize: 11, fontWeight: 700, color: green }}
                    >
                      ✓✓ {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
              {[
                ["128", "recipients"],
                ["126", "delivered"],
                ["2", "failed"],
              ].map(([v, l]) => (
                <div
                  key={l}
                  style={{
                    ...card,
                    flex: 1,
                    padding: "12px 14px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: l === "failed" ? orange : blue,
                    }}
                  >
                    {v}
                  </div>
                  <div style={{ fontSize: 12, color: muted }}>{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ 5. HOW IT WORKS ═══════════ */}
      <section
        style={{
          background: "#f8faff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Blob size={560} top={-200} right={-240} color="rgba(26,92,255,0.12)" />
        <div
          className="mk-wrap"
          style={{ padding: "80px 48px", position: "relative" }}
        >
          <Heading
            eyebrow="SET UP IN MINUTES"
            title={
              <>
                Three steps.{" "}
                <span style={{ color: blue }}>Then it runs itself.</span>
              </>
            }
          />
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
              {[0, 1].map((i) => (
                <path
                  key={i}
                  className="flow-dots"
                  d={`M${167 + i * 333 + 34} 35 H ${167 + (i + 1) * 333 - 40}`}
                  {...dotStroke}
                  markerEnd="url(#asArrow)"
                />
              ))}
            </svg>
            <div
              className="mk-3col"
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                alignItems: "center",
              }}
            >
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <div
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: "50%",
                      background: blue,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 22,
                      boxShadow: "0 10px 22px rgba(26,92,255,0.32)",
                    }}
                  >
                    0{n}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="mk-3col"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 24,
            }}
          >
            {[
              {
                i: Settings,
                t: "Connect a channel",
                d: "Add your WhatsApp Business number (Meta Cloud API), Twilio for SMS, or a Gmail app password — once.",
                tags: "Channel Setup",
              },
              {
                i: Zap,
                t: "Turn on a trigger",
                d: "Pick the event, choose the channels, edit the message text with variables like {name} and {amount}.",
                tags: "Triggers",
              },
              {
                i: Send,
                t: "Let it run",
                d: "From then on every matching lead or customer gets the message automatically — you see delivered / failed counts.",
                tags: "Automatic",
              },
            ].map((s, i) => {
              const Icon = s.i;
              return (
                <Reveal
                  key={s.t}
                  delay={i * 0.1}
                  className="hover-lift"
                  style={{
                    ...card,
                    padding: "30px 24px 28px",
                    textAlign: "center",
                  }}
                >
                  <Tile size={100} radius={18}>
                    <Icon size={40} strokeWidth={1.8} />
                  </Tile>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      margin: "22px 0 10px",
                    }}
                  >
                    {s.t}
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
                    {s.d}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: blue,
                      fontWeight: 600,
                      background: mintDeep,
                      borderRadius: 10,
                      padding: "10px 14px",
                    }}
                  >
                    {s.tags}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ 6. CTA (dark) ═══════════ */}
      <section
        style={{
          background: "linear-gradient(135deg, #0d3277 0%, #071f52 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Blob size={620} top={-260} left={-220} color="rgba(60,120,255,0.24)" />
        <Blob
          size={560}
          bottom={-280}
          right={-200}
          color="rgba(60,120,255,0.18)"
        />
        <div
          className="mk-wrap"
          style={{
            padding: "64px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 28,
            flexWrap: "wrap",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Tile
              size={80}
              radius={40}
              bg="rgba(255,255,255,0.12)"
              color={orange}
            >
              <Sparkles size={38} />
            </Tile>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: orange,
                  letterSpacing: "0.12em",
                  marginBottom: 8,
                }}
              >
                PRO MAX FEATURE
              </div>
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  marginBottom: 8,
                }}
              >
                Automation is included in Pro Max.
              </div>
              <div style={{ fontSize: 19, color: "rgba(255,255,255,0.75)" }}>
                See full pricing and what's included in each plan.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a
              href="/pricing"
              style={{
                ...cta,
                background: "#fff",
                color: blue,
                boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
                padding: "18px 30px",
                fontSize: 18,
              }}
            >
              View Pricing <ArrowRight size={19} />
            </a>
            <a
              href={REGISTER_URL}
              style={{
                ...cta,
                background: "transparent",
                border: "1.5px solid rgba(255,255,255,0.5)",
                boxShadow: "none",
                padding: "18px 30px",
                fontSize: 18,
              }}
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
      <MarketingStyles />
      <style>{`
        .flow-dots { animation: flowDots .9s linear infinite; }
        @keyframes flowDots { to { stroke-dashoffset: -16; } }
        .float-mockup { animation: floatMockup 5s ease-in-out infinite; }
        @keyframes floatMockup { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .float-card { position: absolute; z-index: 3; background: #fff; border-radius: 16px; box-shadow: 0 20px 44px rgba(11,31,74,0.16); padding: 14px 18px; display: flex; align-items: center; gap: 12px; }
        .float-card-c { animation: floatC 4.8s ease-in-out infinite; }
        @keyframes floatC { 0%,100% { transform: translateY(0); } 50% { transform: translateY(7px); } }
        .hover-lift:hover { border-color: ${blue} !important; box-shadow: 0 22px 44px rgba(26,92,255,0.12); }
        .mk-page a[href="${REGISTER_URL}"], .mk-page a[href="/pricing"] { transition: transform .2s ease, box-shadow .2s ease, filter .2s ease; }
        .mk-page a[href="${REGISTER_URL}"]:hover, .mk-page a[href="/pricing"]:hover { transform: translateY(-2px); filter: brightness(1.04); }
        html { scroll-behavior: smooth; }
        @media (max-width: 1100px) { .mk-h1 { font-size: 50px !important; } .mk-h2 { font-size: 40px !important; } .mk-steps-line { display: none !important; } .mk-strip-item { border-left: none !important; padding: 8px 18px !important; } }
        @media (max-width: 860px) {
          .mk-wrap { padding-left: 24px !important; padding-right: 24px !important; }
          .mk-2col { grid-template-columns: 1fr !important; gap: 32px !important; }
          .mk-3col { grid-template-columns: 1fr !important; }
          .mk-hero-visual { display: none; }
          .mk-h1 { font-size: 40px !important; } .mk-h2 { font-size: 34px !important; }
        }
        @media (prefers-reduced-motion: reduce) { .flow-dots, .float-mockup, .float-card-c { animation: none !important; } }
      `}</style>
    </div>
  );
}
