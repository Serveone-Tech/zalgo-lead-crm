"use client";
import {
  Download,
  BellRing,
  MessagesSquare,
  TrendingUp,
  Users,
  Users2,
  Package,
  Truck,
  BarChart3,
  ArrowRight,
  Check,
  Boxes,
  Mail,
  MessageCircle,
  Calendar,
  Zap,
  Lock,
  Inbox,
  FileText,
  ClipboardList,
} from "lucide-react";
import { ink, sub, muted, border } from "../../lib/marketing-theme";
import { poppins } from "../../lib/marketing-font";
import {
  WhatsAppGlyph,
  MetaGlyph,
  GoogleAdsGlyph,
  PhoneCallGlyph,
} from "../../components/BrandIcons";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";
import MarketingStyles from "../../components/MarketingStyles";
import Reveal from "../../components/Reveal";
import AnimatedDots from "../../components/AnimatedDots";
import HeroSalesMockup from "../../components/mockups/HeroSalesMockup";

const REGISTER_URL = "/register";

/* ─────────── LeadLo tokens ─────────── */
const blue = "#1a5cff";
const blueDeep = "#0f47d6";
const orange = "#f59a23";
const mint = "#eef4ff";
const mintDeep = "#dfe9ff";
const orangeSoft = "#fff1dd";
const green = "#1f8a5c";

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
function Pill({ children, icon: Icon }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: mintDeep,
        color: blue,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.1em",
        borderRadius: 24,
        padding: "10px 20px",
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
function CheckBadge({ size = 30, onDark = false }) {
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
function Heading({ eyebrow, title, subtitle, align = "center" }) {
  return (
    <div style={{ textAlign: align, marginBottom: 40 }}>
      <Pill>{eyebrow}</Pill>
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
            maxWidth: 760,
            margin: align === "center" ? "0 auto" : 0,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

const FEATURES = [
  {
    icon: Download,
    title: "Automatic Lead Capture",
    desc: "Every lead from Meta Ads, Google Ads, Google Sheets, WhatsApp, and missed calls lands in one inbox automatically — nobody has to copy-paste anything between tools ever again.",
  },
  {
    icon: BellRing,
    title: "Smart Follow-up Reminders",
    desc: "Set a follow-up once and the system nudges your team at the right time, every time. No lead sits forgotten in a spreadsheet or a sticky note.",
    accent: true,
  },
  {
    icon: MessagesSquare,
    title: "WhatsApp, SMS & Email Automation",
    desc: "Trigger a personalized WhatsApp, SMS, or email the moment a lead comes in, converts, or has a payment due — sent from your own numbers, fully automated.",
  },
  {
    icon: TrendingUp,
    title: "Lead Status & Sales Pipeline",
    desc: "Track every lead through your own custom pipeline stages, see exactly where deals are stuck, and act on it before it goes cold.",
  },
  {
    icon: Users,
    title: "Team & Role Management",
    desc: "Assign leads to specific reps, control exactly what each teammate can see and do with granular Read/Write/Delete permissions, and keep every conversation accountable.",
  },
  {
    icon: Package,
    title: "Inventory Management",
    desc: "Track stock levels as orders are fulfilled, get low-stock alerts before you run out, and never overcommit to a customer again.",
    accent: true,
  },
  {
    icon: Truck,
    title: "Order & Delivery Tracking",
    desc: "Fulfil orders, auto-create the shipment with your courier of choice, and track delivery status right inside the CRM — no switching tabs to a courier portal.",
  },
  {
    icon: BarChart3,
    title: "Sales Reports & Insights",
    desc: "Download a ready-made sales report — delivered orders, revenue, and who closed what — filtered to any date range, whenever you need it.",
  },
];

const STATS = [
  { v: "8+", l: "Core modules" },
  { v: "4", l: "Lead channels" },
  { v: "3", l: "Automation channels" },
  { v: "15 days", l: "Free trial" },
];

export default function FeaturesPage() {
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
            padding: "64px 48px 64px",
            display: "grid",
            gridTemplateColumns: "0.9fr 1.1fr",
            gap: 56,
            alignItems: "center",
            position: "relative",
          }}
        >
          <Reveal>
            <Pill icon={Zap}>EVERY FEATURE, ONE CRM</Pill>
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
              Everything you need
              <br />
              to <span style={{ color: blue }}>never miss a lead.</span>
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
              One CRM that captures, organises and automates every step of your
              sales process — from the first enquiry on WhatsApp to a delivered
              order in the customer's hands. No spreadsheets, no juggling five
              different apps.
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
              <a href="#modules" style={ctaGhost}>
                See all modules
              </a>
            </div>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              {["No card required", "Set up in minutes"].map((t) => (
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
            <div style={{ position: "relative" }}>
              <div className="float-mockup">
                <HeroSalesMockup />
              </div>
              <div
                className="float-card float-card-a"
                style={{ top: -30, right: -30 }}
              >
                <MetaGlyph size={40} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    Lead captured
                  </div>
                  <div style={{ fontSize: 11, color: muted }}>
                    Meta form · 2 seconds ago
                  </div>
                </div>
              </div>
              <div
                className="float-card float-card-b"
                style={{ bottom: 36, left: -40 }}
              >
                <Tile size={40} radius={20} bg={orangeSoft} color={orange}>
                  <BellRing size={20} />
                </Tile>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    Follow-up reminder
                  </div>
                  <div style={{ fontSize: 11, color: muted }}>
                    Anjali · Today 3:30 PM
                  </div>
                </div>
              </div>
              <div
                className="float-card float-card-c"
                style={{ bottom: -28, right: -20 }}
              >
                <Tile size={40} radius={10} bg={blue} color="#fff">
                  <Truck size={20} />
                </Tile>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    Order shipped
                  </div>
                  <div style={{ fontSize: 11, color: muted }}>
                    Tracking linked to order
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
        {/* stats strip */}
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
            {STATS.map((s, i) => (
              <div
                key={s.l}
                className="mk-strip-item"
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                  padding: "6px 36px",
                  borderLeft: i ? `1px solid ${border}` : "none",
                }}
              >
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: blue,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.v}
                </span>
                <span style={{ fontSize: 16, fontWeight: 600, color: ink }}>
                  {s.l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 2. ALL MODULES ═══════════ */}
      <section
        id="modules"
        style={{ position: "relative", overflow: "hidden" }}
      >
        <Blob size={600} top={-200} left={-260} color="rgba(26,92,255,0.10)" />
        <div
          className="mk-wrap"
          style={{ padding: "80px 48px 64px", position: "relative" }}
        >
          <Heading
            eyebrow="ALL MODULES"
            title={
              <>
                Built for the{" "}
                <span style={{ color: blue }}>whole sales process.</span>
              </>
            }
            subtitle="Eight modules that cover the whole journey — capturing a lead, working it, fulfilling the order, and reporting on how the business is doing."
          />
          <div
            className="mk-4col"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 24,
            }}
          >
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal
                  key={f.title}
                  delay={(i % 4) * 0.08}
                  className="hover-lift"
                  style={{
                    ...card,
                    padding: "28px 24px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Tile
                    size={68}
                    radius={16}
                    bg={f.accent ? orangeSoft : mintDeep}
                    color={f.accent ? orange : blue}
                  >
                    <Icon size={32} strokeWidth={1.8} />
                  </Tile>
                  <div
                    style={{
                      fontSize: 21,
                      fontWeight: 700,
                      margin: "20px 0 10px",
                      lineHeight: 1.2,
                    }}
                  >
                    {f.title}
                  </div>
                  <div
                    style={{
                      fontSize: 15.5,
                      color: sub,
                      lineHeight: 1.55,
                      flex: 1,
                    }}
                  >
                    {f.desc}
                  </div>
                  <div
                    style={{
                      marginTop: 18,
                      fontSize: 12,
                      fontWeight: 700,
                      color: muted,
                      letterSpacing: "0.08em",
                    }}
                  >
                    MODULE 0{i + 1}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ 3. SPOTLIGHT — CAPTURE ═══════════ */}
      <section
        style={{ background: mint, position: "relative", overflow: "hidden" }}
      >
        <Blob size={640} top={-220} right={-260} color="rgba(26,92,255,0.16)" />
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
              AUTOMATIC LEAD CAPTURE
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
              Every channel.
              <br />
              <span style={{ color: blue }}>One smart inbox.</span>
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
              Connect Meta Lead Ads, Google Ads, Google Sheets, WhatsApp and
              your call logs once. From then on every enquiry lands in the
              pipeline with its source, owner and next action already set.
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
                "Lead source stays visible on every record",
                "Unverified numbers are held separately until confirmed",
                "Bulk CSV import for the leads you already have",
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
              Try it with your leads <ArrowRight size={18} />
            </a>
          </Reveal>
          <Reveal
            delay={0.12}
            style={{
              ...card,
              borderRadius: 24,
              padding: "28px 30px",
              boxShadow: "0 30px 70px rgba(11,31,74,0.10)",
            }}
          >
            <div
              className="mk-4col"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 14,
              }}
            >
              {[
                { i: <MetaGlyph size={46} />, l: "Meta forms" },
                { i: <GoogleAdsGlyph size={46} />, l: "Google Ads" },
                { i: <WhatsAppGlyph size={46} />, l: "WhatsApp" },
                { i: <PhoneCallGlyph size={44} />, l: "Missed calls" },
              ].map((c) => (
                <div
                  key={c.l}
                  style={{
                    ...card,
                    background: "#f8faff",
                    padding: "18px 10px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      height: 50,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 8,
                    }}
                  >
                    {c.i}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.l}</div>
                </div>
              ))}
            </div>
            <svg
              viewBox="0 0 1000 80"
              width="100%"
              style={{ display: "block", height: "auto" }}
              aria-hidden
            >
              <defs>
                <marker
                  id="ftArrow"
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
              {[125, 375, 625, 875].map((x, i) => (
                <path
                  key={x}
                  className="flow-dots"
                  style={{ animationDelay: `${i * 0.12}s` }}
                  d={`M${x} 0 V 24 Q ${x} 40 ${x < 500 ? x + 16 : x - 16} 40 H ${x < 500 ? 484 : 516} Q 500 40 500 56 V 58`}
                  {...dotStroke}
                />
              ))}
              <path
                className="flow-dots"
                d="M500 40 V 70"
                {...dotStroke}
                markerEnd="url(#ftArrow)"
              />
            </svg>
            <div
              style={{
                background: blue,
                color: "#fff",
                borderRadius: 16,
                padding: "18px 26px",
                display: "flex",
                alignItems: "center",
                gap: 18,
                boxShadow: "0 18px 40px rgba(26,92,255,0.3)",
              }}
            >
              <Inbox size={36} strokeWidth={1.8} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>
                  LeadLo inbox
                </div>
                <div style={{ fontSize: 14, opacity: 0.9 }}>
                  Source · Owner · Next action — set automatically
                </div>
              </div>
            </div>
            <div
              style={{
                ...card,
                marginTop: 16,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: mintDeep,
                  color: blue,
                  fontSize: 14,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                PS
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  Priya Sharma
                </div>
                <div style={{ fontSize: 13, color: muted }}>
                  Meta lead form · Assigned to Anjali
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: green,
                  background: "#e4f5ec",
                  borderRadius: 999,
                  padding: "6px 12px",
                }}
              >
                New lead
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ 4. SPOTLIGHT — FOLLOW-UP & AUTOMATION ═══════════ */}
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
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 56,
            alignItems: "center",
            position: "relative",
          }}
        >
          <Reveal
            className="mk-order-2"
            style={{
              ...card,
              borderRadius: 24,
              padding: "28px 30px",
              background: "#f8faff",
              position: "relative",
            }}
          >
            <Spark style={{ position: "absolute", top: -14, right: 30 }} />
            <div
              className="mk-2col"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 60px 1fr",
                alignItems: "center",
                gap: 0,
              }}
            >
              <div style={{ ...card, padding: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      background: mintDeep,
                      color: blue,
                      fontSize: 14,
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    PS
                  </span>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>
                      Priya Sharma
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#b86a00",
                        background: orangeSoft,
                        borderRadius: 999,
                        padding: "3px 10px",
                      }}
                    >
                      Hot lead
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: sub, marginBottom: 10 }}>
                  Interested. Call tomorrow.
                </div>
                <div
                  style={{
                    borderTop: `1px solid ${border}`,
                    paddingTop: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: muted }}>Assigned to</span>
                  <span style={{ fontWeight: 700 }}>Anjali Singh</span>
                </div>
              </div>
              <svg viewBox="0 0 60 200" width="60" height="200" aria-hidden>
                <path
                  className="flow-dots"
                  d="M0 100 H 20 Q 30 100 30 90 V 40 H 58 M30 100 Q 30 110 30 120 V 160 H 58"
                  {...dotStroke}
                  markerEnd="url(#ftArrow)"
                />
              </svg>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div
                  style={{
                    ...card,
                    padding: 16,
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <Tile size={40} radius={20} bg={orangeSoft} color={orange}>
                    <Calendar size={20} />
                  </Tile>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: blue,
                        letterSpacing: "0.08em",
                      }}
                    >
                      AGENT REMINDER
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>
                      Tomorrow · 3:30 PM
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: green,
                        background: "#e4f5ec",
                        borderRadius: 999,
                        padding: "3px 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 6,
                      }}
                    >
                      <Check size={11} strokeWidth={3} /> Reminder set
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    ...card,
                    padding: 16,
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <WhatsAppGlyph size={40} />
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: blue,
                        letterSpacing: "0.08em",
                      }}
                    >
                      CUSTOMER FOLLOW-UP
                    </div>
                    <div style={{ fontSize: 14, color: ink, lineHeight: 1.4 }}>
                      Hi Priya, would you like more details about the product?
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: blue,
                        background: mintDeep,
                        borderRadius: 999,
                        padding: "3px 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 6,
                      }}
                    >
                      <Zap size={11} /> Automated message
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                marginTop: 20,
              }}
            >
              {[
                { i: <WhatsAppGlyph size={26} />, l: "WhatsApp" },
                {
                  i: (
                    <Tile size={26} radius={13}>
                      <Mail size={13} />
                    </Tile>
                  ),
                  l: "Email",
                },
                {
                  i: (
                    <Tile size={26} radius={13} bg={orangeSoft} color={orange}>
                      <MessageCircle size={13} />
                    </Tile>
                  ),
                  l: "SMS",
                },
              ].map((c) => (
                <span
                  key={c.l}
                  style={{
                    ...card,
                    borderRadius: 999,
                    padding: "6px 14px 6px 6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {c.i}
                  {c.l}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: blue,
                letterSpacing: "0.12em",
                marginBottom: 18,
              }}
            >
              FOLLOW-UPS & AUTOMATION
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
              The right follow-up.
              <br />
              <span style={{ color: blue }}>At the right time.</span>
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
              Set a follow-up once and LeadLo reminds the agent. Set a trigger
              once and the customer gets a WhatsApp, email or SMS the moment a
              lead comes in, converts, or has a payment due — from your own
              number.
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
                "Overdue and today's follow-ups on the dashboard",
                "Triggers on new lead, stage change and payment due",
                "Bulk WhatsApp campaigns with delivered / failed counts",
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
            <a href="/automation-suite" style={cta}>
              Explore automation <ArrowRight size={18} />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ 5. SPOTLIGHT — TEAM (WhatsApp shared) ═══════════ */}
      <section
        style={{ background: mint, position: "relative", overflow: "hidden" }}
      >
        <Blob size={600} top={-200} left={-260} color="rgba(26,92,255,0.14)" />
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
              TEAM & PERMISSIONS
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
              One WhatsApp number.
              <br />
              <span style={{ color: blue }}>Every agent accountable.</span>
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
              Your whole team works from one connected business number. Each
              agent sees only their assigned leads and chats; managers see
              everything. Permissions are enforced on every page, report and
              bulk action.
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
                "Read / Write / Delete per module",
                '"View all leads" toggle for managers',
                "Assign, reassign and change stage in bulk",
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
              Bring your team <ArrowRight size={18} />
            </a>
          </Reveal>
          <Reveal delay={0.12}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  ...card,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "18px 32px",
                  boxShadow: "0 16px 40px rgba(11,31,74,0.08)",
                }}
              >
                <WhatsAppGlyph size={54} />
                <div>
                  <div style={{ fontSize: 19, fontWeight: 800 }}>
                    ONE BUSINESS NUMBER
                  </div>
                  <div style={{ fontSize: 14, color: sub }}>
                    Your company WhatsApp
                  </div>
                </div>
              </div>
            </div>
            <svg
              viewBox="0 0 900 56"
              width="100%"
              style={{ display: "block", height: "auto" }}
              aria-hidden
            >
              <path
                className="flow-dots"
                d="M450 0 V 28 M150 28 H 750 M150 28 V 56 M450 28 V 56 M750 28 V 56"
                {...dotStroke}
              />
              {[150, 450, 750].map((x) => (
                <circle key={x} cx={x} cy={28} r={5} fill={blue} />
              ))}
            </svg>
            <div
              className="mk-3col"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 14,
              }}
            >
              {[
                ["Anjali", "AS", "#2a6fb0", "Priya", "Product enquiry"],
                ["Rohit", "RK", "#c8508c", "Amit", "Order update"],
                ["Pooja", "PV", green, "Neha", "Follow-up"],
              ].map(([n, ini, c, cn, cm]) => (
                <div key={n} style={{ ...card, padding: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        background: c,
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {ini}
                    </span>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700 }}>{n}</div>
                      <div style={{ fontSize: 12.5, color: muted }}>
                        Telecaller
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#f8faff",
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      <Lock size={12} color={blue} /> Assigned chats only
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{cn}</div>
                    <div style={{ fontSize: 12, color: muted }}>{cm}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ 6. SPOTLIGHT — ORDERS (dark) ═══════════ */}
      <section
        style={{
          background: "linear-gradient(135deg, #0d3277 0%, #071f52 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Blob size={620} top={-240} left={-240} color="rgba(60,120,255,0.22)" />
        <Blob
          size={620}
          bottom={-300}
          right={-200}
          color="rgba(60,120,255,0.18)"
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
                color: orange,
                letterSpacing: "0.12em",
                marginBottom: 18,
              }}
            >
              ORDERS, INVENTORY & DELIVERY
            </div>
            <h3
              className="mk-h2"
              style={{
                fontSize: 50,
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                color: "#fff",
                margin: "0 0 18px",
              }}
            >
              Close the sale.
              <br />
              Connect every <span style={{ color: orange }}>next step.</span>
            </h3>
            <p
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.78)",
                lineHeight: 1.6,
                margin: "0 0 28px",
                maxWidth: 500,
              }}
            >
              Fulfil the order from the customer record, let the stage deduct
              stock and create the courier shipment automatically, and watch
              tracking updates land next to the order.
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
                "Prepaid or COD with balance tracked",
                "Order stages that deduct / restore stock",
                "Low-stock alerts before you run out",
                "Sales report export for any date range",
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
                  <CheckBadge size={30} onDark /> {t}
                </div>
              ))}
            </div>
            <a
              href={REGISTER_URL}
              style={{
                ...cta,
                background: "#fff",
                color: blue,
                boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
              }}
            >
              See it with your orders <ArrowRight size={18} />
            </a>
          </Reveal>
          <Reveal
            delay={0.12}
            style={{ background: "#fff", borderRadius: 22, padding: 26 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Tile size={52} radius={12}>
                  <FileText size={26} />
                </Tile>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    Order #ZG1024
                  </div>
                  <div style={{ fontSize: 14, color: sub }}>
                    Priya Sharma · COD
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: blue,
                  background: mintDeep,
                  borderRadius: 20,
                  padding: "7px 14px",
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
                gap: 14,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  background: "#f3f7ff",
                  borderRadius: 14,
                  padding: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <Tile size={54} radius={12} bg={orangeSoft} color={orange}>
                  <Boxes size={28} />
                </Tile>
                <div>
                  <div style={{ fontSize: 13, color: sub }}>Inventory</div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>
                    Stock deducted
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: "#f3f7ff",
                  borderRadius: 14,
                  padding: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <WhatsAppGlyph size={54} />
                <div>
                  <div style={{ fontSize: 13, color: sub }}>WhatsApp</div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>
                    Confirmation sent
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                border: `1px solid ${border}`,
                borderRadius: 14,
                padding: 20,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                Track the delivery
              </div>
              <div style={{ fontSize: 14, color: sub, marginBottom: 20 }}>
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
                      <div style={{ textAlign: "center", width: 84 }}>
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: "50%",
                            background:
                              i < 2 ? green : i === 2 ? blue : "#e4ebf7",
                            color: i < 3 ? "#fff" : muted,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 8px",
                          }}
                        >
                          {i < 2 ? (
                            <Check size={22} strokeWidth={3} />
                          ) : i === 2 ? (
                            <Truck size={22} />
                          ) : (
                            <Package size={20} />
                          )}
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                          {l}
                        </div>
                      </div>
                      {i < 3 && (
                        <svg
                          height="52"
                          width="100%"
                          style={{ flex: 1 }}
                          preserveAspectRatio="none"
                          viewBox="0 0 100 52"
                          aria-hidden
                        >
                          <path
                            className="flow-dots"
                            d="M0 26 H 100"
                            {...dotStroke}
                            stroke={i < 2 ? green : blue}
                            strokeWidth={3}
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ 7. REPORTS + CTA ═══════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <Blob size={520} top={-200} right={-220} color="rgba(26,92,255,0.10)" />
        <div
          className="mk-wrap"
          style={{ padding: "80px 48px 40px", position: "relative" }}
        >
          <Heading
            eyebrow="REPORTS & INSIGHTS"
            title={
              <>
                See how your team is{" "}
                <span style={{ color: blue }}>actually performing.</span>
              </>
            }
            subtitle="Total sales, delivered orders and revenue for any date range — broken down by employee, and always filtered to what each person is allowed to see."
          />
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
                i: <BarChart3 size={30} />,
                t: "Date-range sales report",
                s: "Delivered orders, revenue collected, orders by stage — exported to Excel in one click.",
              },
              {
                i: <Users2 size={30} />,
                t: "By-employee breakdown",
                s: "Lead conversions and order volume per team member, ready for reviews and incentives.",
                accent: true,
              },
              {
                i: <ClipboardList size={30} />,
                t: "Same rules everywhere",
                s: "Dashboard counts, reports and bulk actions all respect each employee's permissions.",
              },
            ].map((c) => (
              <Reveal
                key={c.t}
                className="hover-lift"
                style={{
                  ...card,
                  padding: "28px 26px",
                  display: "flex",
                  gap: 20,
                  alignItems: "flex-start",
                }}
              >
                <Tile
                  size={64}
                  radius={16}
                  bg={c.accent ? orangeSoft : mintDeep}
                  color={c.accent ? orange : blue}
                >
                  {c.i}
                </Tile>
                <div>
                  <div
                    style={{
                      fontSize: 21,
                      fontWeight: 700,
                      marginBottom: 8,
                      lineHeight: 1.2,
                    }}
                  >
                    {c.t}
                  </div>
                  <div style={{ fontSize: 15.5, color: sub, lineHeight: 1.55 }}>
                    {c.s}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="mk-wrap" style={{ padding: "24px 48px 72px" }}>
          <Reveal
            style={{
              background: mint,
              borderRadius: 28,
              padding: "40px 48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 28,
              flexWrap: "wrap",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Blob
              size={420}
              top={-200}
              right={-120}
              color="rgba(26,92,255,0.18)"
            />
            <Spark style={{ position: "absolute", top: 18, left: 26 }} />
            <div style={{ position: "relative" }}>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  marginBottom: 8,
                }}
              >
                See it all in action.
              </div>
              <div style={{ fontSize: 20, color: sub }}>
                Start your 15-day free trial, or book a demo and we'll walk you
                through it.
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                position: "relative",
              }}
            >
              <a
                href={REGISTER_URL}
                style={{ ...cta, padding: "20px 34px", fontSize: 19 }}
              >
                Start Free Trial <ArrowRight size={20} />
              </a>
              <a
                href="/contact"
                style={{ ...ctaGhost, padding: "20px 34px", fontSize: 19 }}
              >
                Book a Free Demo
              </a>
            </div>
          </Reveal>
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
        .float-card-a { animation: floatA 4.4s ease-in-out infinite; } .float-card-b { animation: floatB 5.2s ease-in-out infinite; } .float-card-c { animation: floatC 4.8s ease-in-out infinite; }
        @keyframes floatA { 0%,100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        @keyframes floatB { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        @keyframes floatC { 0%,100% { transform: translateY(0); } 50% { transform: translateY(7px); } }
        .hover-lift:hover { border-color: ${blue} !important; box-shadow: 0 22px 44px rgba(26,92,255,0.12); }
        .mk-page a[href="${REGISTER_URL}"], .mk-page a[href="/contact"], .mk-page a[href="/automation-suite"] { transition: transform .2s ease, box-shadow .2s ease, filter .2s ease; }
        .mk-page a[href="${REGISTER_URL}"]:hover, .mk-page a[href="/automation-suite"]:hover { transform: translateY(-2px); filter: brightness(1.04); }
        html { scroll-behavior: smooth; }
        @media (max-width: 1100px) { .mk-h1 { font-size: 50px !important; } .mk-h2 { font-size: 40px !important; } .mk-4col { grid-template-columns: repeat(2,1fr) !important; } .mk-strip-item { border-left: none !important; padding: 8px 18px !important; } }
        @media (max-width: 860px) {
          .mk-wrap { padding-left: 24px !important; padding-right: 24px !important; }
          .mk-2col { grid-template-columns: 1fr !important; gap: 32px !important; }
          .mk-3col { grid-template-columns: 1fr !important; }
          .mk-hero-visual { display: none; }
          .mk-order-2 { order: 2; }
          .mk-h1 { font-size: 40px !important; } .mk-h2 { font-size: 34px !important; }
        }
        @media (max-width: 560px) { .mk-4col, .mk-2col-keep { grid-template-columns: 1fr !important; } }
        @media (prefers-reduced-motion: reduce) { .flow-dots, .float-mockup, .float-card-a, .float-card-b, .float-card-c { animation: none !important; } }
      `}</style>
    </div>
  );
}
