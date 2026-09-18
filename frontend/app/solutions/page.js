"use client";
import {
  Phone,
  TrendingUp,
  GraduationCap,
  ShoppingBag,
  Download,
  UserPlus,
  Send,
  Target,
  ArrowRight,
  Check,
  Users2,
  Calendar,
  Package,
  Truck,
  Boxes,
  Zap,
  Mail,
  MessageCircle,
  FlaskConical,
  Headphones,
  Building2,
  Store,
  BellRing,
  Lock,
} from "lucide-react";
import { ink, sub, muted, border } from "../../lib/marketing-theme";
import { poppins } from "../../lib/marketing-font";
import {
  WhatsAppGlyph,
  MetaGlyph,
  PhoneCallGlyph,
} from "../../components/BrandIcons";
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
function CheckBadge({ size = 28 }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: blue,
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
function Avatar({ initials, bg, size = 40 }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: "#fff",
        fontSize: size * 0.34,
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid #fff",
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}
function Heading({ eyebrow, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 40 }}>
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
const AUDIENCES = [
  {
    icon: Phone,
    accent: false,
    title: "Telecalling Teams",
    desc: "Every incoming call, every missed call, every callback — logged and assigned automatically so no lead falls through the cracks, even on your busiest day.",
    points: [
      "Auto-log calls & missed calls",
      "Instant assignment to a rep",
      "Follow-up reminders that actually fire",
    ],
    visual: (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <PhoneCallGlyph size={44} />
        <svg width="36" height="6" viewBox="0 0 36 6">
          <path
            className="flow-dots"
            d="M1 3 H 35"
            {...dotStroke}
            strokeWidth={2}
          />
        </svg>
        <div style={{ display: "flex" }}>
          {[
            ["RK", "#2a6fb0"],
            ["AS", "#c8508c"],
            ["PV", green],
          ].map(([i, c], idx) => (
            <span key={i} style={{ marginLeft: idx ? -8 : 0 }}>
              <Avatar initials={i} bg={c} />
            </span>
          ))}
        </div>
        <Tile size={36} radius={18} bg={orangeSoft} color={orange}>
          <BellRing size={17} />
        </Tile>
      </div>
    ),
  },
  {
    icon: TrendingUp,
    accent: true,
    title: "Sales Teams",
    desc: "See your entire pipeline at a glance, track who's closing what, and automate the follow-ups your reps keep forgetting to send.",
    points: [
      "Custom pipeline stages",
      "Per-rep performance visibility",
      "Automated nudges on stale leads",
    ],
    visual: (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[
          ["New", mintDeep, blue],
          ["Follow-up", orangeSoft, "#b86a00"],
          ["Converted", "#e4f5ec", green],
        ].map(([l, bg, fg], i) => (
          <span
            key={l}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: fg,
                background: bg,
                borderRadius: 999,
                padding: "6px 12px",
              }}
            >
              {l}
            </span>
            {i < 2 && (
              <svg width="18" height="6" viewBox="0 0 18 6">
                <path
                  className="flow-dots"
                  d="M1 3 H 17"
                  {...dotStroke}
                  strokeWidth={2}
                />
              </svg>
            )}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: GraduationCap,
    accent: false,
    title: "Coaching & Education Institutes",
    desc: "Capture enquiries from every channel, nurture them with automated WhatsApp/email sequences, and convert more admissions without hiring more counsellors.",
    points: [
      "Multi-channel enquiry capture",
      "Automated nurture sequences",
      "Track enquiry → admission conversion",
    ],
    visual: (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <MetaGlyph size={36} />
        <svg width="28" height="6" viewBox="0 0 28 6">
          <path
            className="flow-dots"
            d="M1 3 H 27"
            {...dotStroke}
            strokeWidth={2}
          />
        </svg>
        <Tile size={40} radius={20} bg={blue} color="#fff">
          <Zap size={18} />
        </Tile>
        <svg width="28" height="6" viewBox="0 0 28 6">
          <path
            className="flow-dots"
            d="M1 3 H 27"
            {...dotStroke}
            strokeWidth={2}
          />
        </svg>
        <WhatsAppGlyph size={36} />
        <Tile size={36} radius={18}>
          <Mail size={16} />
        </Tile>
      </div>
    ),
  },
  {
    icon: ShoppingBag,
    accent: true,
    title: "D2C & E-commerce Brands",
    desc: "Manage orders, track inventory, auto-create courier shipments, and follow up on COD collections — all without leaving the CRM.",
    points: [
      "Inventory synced to orders",
      "One-click courier shipment",
      "COD balance-due tracking",
    ],
    visual: (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Tile size={42} radius={12} bg={orangeSoft} color={orange}>
          <Boxes size={22} />
        </Tile>
        <svg width="24" height="6" viewBox="0 0 24 6">
          <path
            className="flow-dots"
            d="M1 3 H 23"
            {...dotStroke}
            strokeWidth={2}
          />
        </svg>
        <Tile size={42} radius={12}>
          <Package size={22} />
        </Tile>
        <svg width="24" height="6" viewBox="0 0 24 6">
          <path
            className="flow-dots"
            d="M1 3 H 23"
            {...dotStroke}
            strokeWidth={2}
          />
        </svg>
        <Tile size={42} radius={12} bg={blue} color="#fff">
          <Truck size={22} />
        </Tile>
      </div>
    ),
  },
];

const STEPS = [
  {
    icon: Download,
    title: "Capture",
    desc: "Leads from every connected channel land automatically, tagged with their source.",
    tags: "Meta · Calls · WhatsApp",
  },
  {
    icon: UserPlus,
    title: "Assign",
    desc: "Routed to the right rep instantly — nothing sits in a shared inbox unowned.",
    tags: "Clear ownership",
  },
  {
    icon: Send,
    title: "Automate",
    desc: "An automated first message goes out in seconds, then reminders keep it moving.",
    tags: "WhatsApp · Email · SMS",
  },
  {
    icon: Target,
    title: "Convert",
    desc: "Fulfil the order and track it straight through to a happy, repeat customer.",
    tags: "Orders · Delivery",
  },
];

const INDUSTRIES = [
  {
    icon: FlaskConical,
    title: "Ayurvedic & Wellness",
    flow: "Enquiry → Order → Delivery",
  },
  {
    icon: Headphones,
    title: "Telesales Teams",
    flow: "Assign → Follow up → Convert",
  },
  {
    icon: Building2,
    title: "Real Estate",
    flow: "Capture → Assign → Follow up",
  },
  {
    icon: ShoppingBag,
    title: "E-commerce & D2C",
    flow: "Confirm → Fulfil → Track",
  },
  {
    icon: GraduationCap,
    title: "Coaching & Education",
    flow: "Enquiry → Counselling → Enrolment",
  },
  {
    icon: Store,
    title: "Clinics & Services",
    flow: "Capture → Respond → Follow up",
  },
];

export default function SolutionsPage() {
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
            gridTemplateColumns: "0.95fr 1.05fr",
            gap: 56,
            alignItems: "center",
            position: "relative",
          }}
        >
          <Reveal>
            <Pill icon={Users2}>SOLUTIONS BY TEAM</Pill>
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
              Built for
              <br />
              <span style={{ color: blue }}>
                telecalling &amp;
                <br />
                sales teams.
              </span>
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
              Whatever your business — calling leads all day, running a D2C
              brand, or filling admission seats — LeadLo adapts to how your team
              actually works, not the other way around.
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
              <a href="#teams" style={ctaGhost}>
                Find your team
              </a>
            </div>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
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
                  <CheckBadge size={26} /> {t}
                </div>
              ))}
            </div>
          </Reveal>

          {/* team inbox mockup */}
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
              style={{ position: "absolute", top: -22, right: 40, zIndex: 3 }}
            />
            <div
              className="float-mockup"
              style={{
                ...card,
                borderRadius: 22,
                overflow: "hidden",
                boxShadow: "0 40px 90px rgba(11,31,74,0.18)",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 22px",
                  borderBottom: `1px solid ${border}`,
                  background: "#f7f9fe",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <WhatsAppGlyph size={34} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>
                      Team inbox
                    </div>
                    <div style={{ fontSize: 12, color: muted }}>
                      One business number · 3 agents online
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex" }}>
                  {[
                    ["RK", "#2a6fb0"],
                    ["AS", "#c8508c"],
                    ["PV", green],
                  ].map(([i, c], idx) => (
                    <span key={i} style={{ marginLeft: idx ? -8 : 0 }}>
                      <Avatar initials={i} bg={c} size={34} />
                    </span>
                  ))}
                </div>
              </div>
              <div
                style={{
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[
                  [
                    "Priya Sharma",
                    "Meta form",
                    "Interested in Wellness Pack",
                    "Anjali",
                    "New",
                    mintDeep,
                    blue,
                  ],
                  [
                    "Amit Verma",
                    "Missed call",
                    "Callback requested",
                    "Rohit",
                    "Follow-up",
                    orangeSoft,
                    "#b86a00",
                  ],
                  [
                    "Neha Gupta",
                    "WhatsApp",
                    "Order #ZG1024 confirmed",
                    "Pooja",
                    "Order confirmed",
                    "#e4f5ec",
                    green,
                  ],
                  [
                    "Vikram Singh",
                    "Google Sheet",
                    "Enquiry for admission",
                    "Anjali",
                    "New",
                    mintDeep,
                    blue,
                  ],
                ].map(([n, src, msg, owner, st, bg, fg]) => (
                  <div
                    key={n}
                    style={{
                      ...card,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <Avatar
                      initials={n
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                      bg={mintDeep}
                      size={42}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 700 }}>
                          {n}
                        </span>
                        <span style={{ fontSize: 11, color: muted }}>
                          · {src}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: sub,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {msg}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: fg,
                          background: bg,
                          borderRadius: 999,
                          padding: "4px 10px",
                        }}
                      >
                        {st}
                      </span>
                      <div
                        style={{
                          fontSize: 11,
                          color: muted,
                          marginTop: 4,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Lock size={10} /> {owner}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="float-card float-card-b"
              style={{ bottom: -26, left: -36 }}
            >
              <Tile size={40} radius={20} bg={orangeSoft} color={orange}>
                <Calendar size={20} />
              </Tile>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  Reminder set
                </div>
                <div style={{ fontSize: 11, color: muted }}>
                  Anjali · Tomorrow 3:30 PM
                </div>
              </div>
            </div>
            <div
              className="float-card float-card-c"
              style={{ top: 90, right: -30 }}
            >
              <Tile size={40} radius={10} bg={blue} color="#fff">
                <Truck size={20} />
              </Tile>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  Shipment created
                </div>
                <div style={{ fontSize: 11, color: muted }}>
                  Courier API connected
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
              { icon: <PhoneCallGlyph size={26} />, l: "Calls & missed calls" },
              { icon: <WhatsAppGlyph size={26} />, l: "Shared WhatsApp" },
              {
                icon: <Zap size={26} color={blue} />,
                l: "Automated follow-ups",
              },
              {
                icon: <Truck size={26} color={blue} />,
                l: "Orders & delivery",
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

      {/* ═══════════ 2. WHO IT'S BUILT FOR ═══════════ */}
      <section id="teams" style={{ position: "relative", overflow: "hidden" }}>
        <Blob size={600} top={-200} left={-260} color="rgba(26,92,255,0.10)" />
        <div
          className="mk-wrap"
          style={{ padding: "80px 48px 64px", position: "relative" }}
        >
          <Heading
            eyebrow="WHO IT'S BUILT FOR"
            title={
              <>
                Four kinds of teams.{" "}
                <span style={{ color: blue }}>One connected CRM.</span>
              </>
            }
            subtitle="Four kinds of teams lean on LeadLo every day — here's exactly what it does for each."
          />
          <div
            className="mk-2col"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
          >
            {AUDIENCES.map((a, i) => {
              const Icon = a.icon;
              return (
                <Reveal
                  key={a.title}
                  delay={(i % 2) * 0.08}
                  className="hover-lift"
                  style={{
                    ...card,
                    padding: "30px 30px 26px",
                    display: "flex",
                    flexDirection: "column",
                    borderTop: `4px solid ${a.accent ? orange : blue}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      marginBottom: 18,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <Tile
                        size={64}
                        radius={16}
                        bg={a.accent ? orangeSoft : mintDeep}
                        color={a.accent ? orange : blue}
                      >
                        <Icon size={30} strokeWidth={1.8} />
                      </Tile>
                      <div
                        style={{
                          fontSize: 26,
                          fontWeight: 800,
                          letterSpacing: "-0.01em",
                          lineHeight: 1.15,
                        }}
                      >
                        {a.title}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 16.5,
                      color: sub,
                      lineHeight: 1.55,
                      marginBottom: 20,
                    }}
                  >
                    {a.desc}
                  </div>
                  <div
                    style={{
                      background: "#f8faff",
                      borderRadius: 14,
                      padding: "16px 18px",
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: 20,
                    }}
                  >
                    {a.visual}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      marginTop: "auto",
                    }}
                  >
                    {a.points.map((p) => (
                      <div
                        key={p}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          fontSize: 16,
                          fontWeight: 500,
                        }}
                      >
                        <CheckBadge size={28} /> {p}
                      </div>
                    ))}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ 3. HOW IT WORKS ═══════════ */}
      <section
        style={{ background: mint, position: "relative", overflow: "hidden" }}
      >
        <Blob size={640} top={-220} right={-260} color="rgba(26,92,255,0.16)" />
        <div
          className="mk-wrap"
          style={{ padding: "80px 48px", position: "relative" }}
        >
          <Heading
            eyebrow="HOW IT WORKS"
            title={
              <>
                From first enquiry to{" "}
                <span style={{ color: blue }}>conversion.</span>
              </>
            }
            subtitle="Four steps, start to finish — every lead follows the same reliable path from the moment it lands to a converted customer."
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
              <defs>
                <marker
                  id="solArrow"
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
              {[0, 1, 2].map((i) => (
                <path
                  key={i}
                  className="flow-dots"
                  d={`M${125 + i * 250 + 34} 35 H ${125 + (i + 1) * 250 - 40}`}
                  {...dotStroke}
                  markerEnd="url(#solArrow)"
                />
              ))}
            </svg>
            <div
              className="mk-4col"
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                alignItems: "center",
              }}
            >
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
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
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal
                  key={s.title}
                  delay={i * 0.1}
                  className="hover-lift"
                  style={{
                    ...card,
                    padding: "30px 24px 28px",
                    textAlign: "center",
                    border:
                      i === 3 ? `2px solid ${blue}` : `1px solid ${border}`,
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
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, color: sub, marginBottom: 18 }}>
              See the complete workflow with your team.
            </div>
            <a href={REGISTER_URL} style={cta}>
              Get Your 15-Day Free Demo <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ 4. INDUSTRIES ═══════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <Blob
          size={560}
          bottom={-260}
          left={-240}
          color="rgba(26,92,255,0.10)"
        />
        <div
          className="mk-wrap"
          style={{ padding: "80px 48px", position: "relative" }}
        >
          <Heading
            eyebrow="ACROSS INDUSTRIES"
            title={
              <>
                Different businesses.{" "}
                <span style={{ color: blue }}>A shared need.</span>
              </>
            }
            subtitle="Anywhere a sale starts with a conversation, LeadLo keeps every enquiry moving."
          />
          <div
            className="mk-3col"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 24,
            }}
          >
            {INDUSTRIES.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <Reveal
                  key={ind.title}
                  delay={(i % 3) * 0.06}
                  className="hover-lift"
                  style={{
                    ...card,
                    padding: "24px 26px",
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                  }}
                >
                  <Tile
                    size={74}
                    radius={37}
                    bg="radial-gradient(circle at 30% 30%, #ffffff 0%, #dfe9ff 100%)"
                    color={i % 2 ? orange : blue}
                  >
                    <Icon size={34} strokeWidth={1.7} />
                  </Tile>
                  <div>
                    <div
                      style={{ fontSize: 21, fontWeight: 700, marginBottom: 4 }}
                    >
                      {ind.title}
                    </div>
                    <div
                      style={{ fontSize: 14.5, fontWeight: 700, color: blue }}
                    >
                      {ind.flow}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ 5. CTA ═══════════ */}
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
              color="#fff"
            >
              <MessageCircle size={38} />
            </Tile>
            <div>
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
                Find the right fit for your team.
              </div>
              <div style={{ fontSize: 19, color: "rgba(255,255,255,0.75)" }}>
                Talk to us about your specific workflow.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a
              href={REGISTER_URL}
              style={{
                ...cta,
                background: "#fff",
                color: blue,
                boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
                padding: "18px 30px",
                fontSize: 18,
              }}
            >
              Start Free Trial <ArrowRight size={19} />
            </a>
            <a
              href="/contact"
              style={{
                ...cta,
                background: "transparent",
                border: "1.5px solid rgba(255,255,255,0.5)",
                boxShadow: "none",
                padding: "18px 30px",
                fontSize: 18,
              }}
            >
              Talk to Us
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
      <MarketingStyles />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .flow-dots { animation: flowDots .9s linear infinite; }
        @keyframes flowDots { to { stroke-dashoffset: -16; } }
        .float-mockup { animation: floatMockup 5s ease-in-out infinite; }
        @keyframes floatMockup { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .float-card { position: absolute; z-index: 3; background: #fff; border-radius: 16px; box-shadow: 0 20px 44px rgba(11,31,74,0.16); padding: 14px 18px; display: flex; align-items: center; gap: 12px; }
        .float-card-b { animation: floatB 5.2s ease-in-out infinite; } .float-card-c { animation: floatC 4.8s ease-in-out infinite; }
        @keyframes floatB { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        @keyframes floatC { 0%,100% { transform: translateY(0); } 50% { transform: translateY(7px); } }
        .hover-lift:hover { border-color: ${blue} !important; box-shadow: 0 22px 44px rgba(26,92,255,0.12); }
        .mk-page a[href="${REGISTER_URL}"], .mk-page a[href="/contact"] { transition: transform .2s ease, box-shadow .2s ease, filter .2s ease; }
        .mk-page a[href="${REGISTER_URL}"]:hover, .mk-page a[href="/contact"]:hover { transform: translateY(-2px); filter: brightness(1.04); }
        html { scroll-behavior: smooth; }
        @media (max-width: 1100px) { .mk-h1 { font-size: 50px !important; } .mk-h2 { font-size: 40px !important; } .mk-4col { grid-template-columns: repeat(2,1fr) !important; } .mk-steps-line { display: none !important; } .mk-strip-item { border-left: none !important; padding: 8px 18px !important; } }
        @media (max-width: 860px) {
          .mk-wrap { padding-left: 24px !important; padding-right: 24px !important; }
          .mk-2col { grid-template-columns: 1fr !important; gap: 32px !important; }
          .mk-3col { grid-template-columns: 1fr !important; }
          .mk-hero-visual { display: none; }
          .mk-h1 { font-size: 40px !important; } .mk-h2 { font-size: 34px !important; }
        }
        @media (max-width: 560px) { .mk-4col { grid-template-columns: 1fr !important; } }
        @media (prefers-reduced-motion: reduce) { .flow-dots, .float-mockup, .float-card-b, .float-card-c { animation: none !important; } }
      `,
        }}
      />
    </div>
  );
}
