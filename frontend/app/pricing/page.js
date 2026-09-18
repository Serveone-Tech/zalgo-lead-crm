"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Users2,
  Sprout,
  BarChart3,
  Building2,
  MessageCircle,
  Mail,
  Truck,
  Receipt,
  ListChecks,
  Rocket,
  Plus,
  Minus,
  Package,
  UserPlus,
  Home,
  Boxes,
  Settings,
  Bell,
  Leaf,
} from "lucide-react";
import { ink, sub, muted, border } from "../../lib/marketing-theme";
import { poppins } from "../../lib/marketing-font";
import { FEATURE_LABELS } from "../../lib/plan-features";
import { WhatsAppGlyph } from "../../components/BrandIcons";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";
import MarketingStyles from "../../components/MarketingStyles";
import Reveal from "../../components/Reveal";
import AnimatedDots from "../../components/AnimatedDots";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const LOGO = "/logo_light.png"; // same logo used in the nav

/* ─────────────── LeadLo tokens ─────────────── */
const blue = "#1a5cff";
const blueDeep = "#0f47d6";
const orange = "#f59a23";
const mint = "#eef4ff";
const mintDeep = "#dfe9ff";
const green = "#1f8a5c";
const blueSoft = "rgba(26,92,255,0.10)";

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
};
const ctaGhost = {
  ...cta,
  background: "#fff",
  color: ink,
  border: `1px solid ${border}`,
  boxShadow: "none",
};
const ctaOutline = {
  ...cta,
  background: "#fff",
  color: blue,
  border: `1.5px solid ${blue}`,
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
function CheckBadge({ size = 30 }) {
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

function fmtPrice(n) {
  return `₹${Math.round(parseFloat(n) || 0).toLocaleString("en-IN")}`;
}
function parseFeatures(p) {
  if (Array.isArray(p.features)) return p.features;
  try {
    return JSON.parse(p.features || "[]");
  } catch {
    return [];
  }
}
const planIcons = [Sprout, BarChart3, Building2, Rocket];

/* compare table — rows fixed as in the design; a plan gets ✓ when any of its
   feature keys/labels matches the row's keywords, otherwise — */
const compareGroups = [
  {
    title: "Lead Management",
    icon: Users2,
    rows: [
      {
        label: "Connected lead capture",
        test: /lead capture|capture|meta|google ads|sheets/i,
      },
      {
        label: "Lead assignment & reminders",
        test: /assign|remind|follow|lead management|customer/i,
      },
    ],
  },
  {
    title: "WhatsApp & Automation",
    icon: MessageCircle,
    rows: [
      {
        label: "Shared WhatsApp & assigned chats",
        test: /shared whatsapp|whatsapp inbox|whatsapp/i,
      },
      {
        label: "Bulk campaigns & automated messages",
        test: /bulk|campaign|automation|outbound|sms|email/i,
      },
    ],
  },
  {
    title: "Orders & Delivery",
    icon: Package,
    rows: [
      {
        label: "Inventory & order management",
        test: /inventory|order|stock|payment/i,
      },
      {
        label: "Courier APIs & shipment tracking",
        test: /courier|shipment|delivery|tracking/i,
      },
    ],
  },
  {
    title: "Team Access",
    icon: Users2,
    rows: [
      {
        label: "Included users & usage limits",
        test: /team|employee|user|agent|seat|limit/i,
      },
    ],
  },
];
function planHas(plan, test) {
  return plan.features.some((k) =>
    test.test(`${k} ${FEATURE_LABELS[k] || ""}`),
  );
}

const faqs = [
  {
    q: "Can I try LeadLo before choosing a plan?",
    a: "Yes. Explore LeadLo with a 15-day free trial and see how it fits your team's workflow.",
  },
  {
    q: "Can my team use one WhatsApp number?",
    a: "Yes. Your team works through one connected business number. Each agent sees only their assigned contacts and chats, while managers can review team activity.",
  },
  {
    q: "Will agents see only their assigned leads?",
    a: "Yes. Leads and chats are assigned to a specific owner, and agents only see what is assigned to them.",
  },
  {
    q: "Are messaging and courier charges included?",
    a: "WhatsApp, SMS, email and courier charges depend on your connected providers and usage. We'll confirm applicable charges with you before you start.",
  },
  {
    q: "Can I connect my delivery partner?",
    a: "Yes. Connect your courier through delivery APIs to keep shipment updates alongside each order.",
  },
  {
    q: "How do upgrades and cancellation work?",
    a: "Upgrade the moment you need more. You can change or cancel your plan any time — our team will help you through it.",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    axios
      .get(`${BASE}/plans`)
      .then((r) => setPlans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = plans.map((p) => ({ ...p, features: parseFeatures(p) }));
  const popularIdx = Math.max(
    0,
    cards.findIndex((p) => /pro$|growth/i.test(p.name)) >= 0
      ? cards.findIndex((p) => /pro$|growth/i.test(p.name))
      : Math.floor((cards.length - 1) / 2),
  );

  const go = () => router.push("https://lead-management.zalgostore.com/register");

  return (
    <div
      className={`${poppins.className} mk-page`}
      style={{ background: "#fff", color: ink }}
    >
      <MarketingNav ctaLabel="Start Free Trial" />

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
            padding: "64px 48px 40px",
            display: "grid",
            gridTemplateColumns: "0.9fr 1.1fr",
            gap: 56,
            alignItems: "center",
            position: "relative",
          }}
        >
          <Reveal>
            <div style={{ marginBottom: 26 }}>
              <Pill icon={Users2}>PLANS FOR YOUR SALES TEAM</Pill>
            </div>
            <h1
              className="mk-h1"
              style={{
                fontSize: 66,
                fontWeight: 800,
                lineHeight: 1.06,
                letterSpacing: "-0.025em",
                margin: "0 0 12px",
              }}
            >
              The right plan.
              <br />
              For your team.
              <br />
              <span
                style={{
                  color: blue,
                  position: "relative",
                  display: "inline-block",
                }}
              >
                For your next step.
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: -8,
                    width: 96,
                    height: 5,
                    borderRadius: 3,
                    background: orange,
                  }}
                />
              </span>
            </h1>
            <p
              style={{
                fontSize: 20,
                color: sub,
                lineHeight: 1.55,
                margin: "24px 0 34px",
                maxWidth: 500,
              }}
            >
              Choose how your team manages leads, WhatsApp conversations and
              orders.
            </p>
            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 26,
                flexWrap: "wrap",
              }}
            >
              <button onClick={go} style={cta}>
                Start Your 15-Day Free Trial <ArrowRight size={18} />
              </button>
              <a href="#plans" style={ctaGhost}>
                Compare Plans
              </a>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 15,
                color: sub,
              }}
            >
              <CheckBadge size={26} /> Explore LeadLo with your team.
            </div>
          </Reveal>

          {/* product overview mockup */}
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
            <Spark style={{ position: "absolute", top: -26, right: -6 }} />
            <div
              style={{
                position: "absolute",
                top: -14,
                right: 10,
                zIndex: 3,
                background: `linear-gradient(180deg, ${orange}, #e8891a)`,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.1em",
                borderRadius: 12,
                padding: "12px 20px",
                boxShadow: "0 14px 30px rgba(245,154,35,0.35)",
              }}
            >
              15-DAY FREE TRIAL
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "150px 1fr",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 40px 90px rgba(11,31,74,0.2)",
                background: "#f7f9fe",
                transform: "perspective(1600px) rotateY(-4deg)",
                position: "relative",
              }}
            >
              <aside
                style={{
                  background: "linear-gradient(180deg,#0b1f4a,#07163a)",
                  padding: "22px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    padding: "6px 10px",
                    display: "inline-flex",
                    width: "fit-content",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={LOGO}
                    alt="LeadLo"
                    style={{ height: 22, width: "auto", display: "block" }}
                  />
                </div>
                <div
                  style={{
                    height: 5,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.18)",
                    width: "80%",
                  }}
                />
                {[Home, Users2, MessageCircle, Boxes, BarChart3, Settings].map(
                  (Icon, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 10px",
                        borderRadius: 9,
                        background: i === 0 ? blue : "transparent",
                        color: i === 0 ? "#fff" : "rgba(255,255,255,0.7)",
                      }}
                    >
                      <Icon size={15} />
                      <span
                        style={{
                          height: 5,
                          borderRadius: 3,
                          background:
                            i === 0
                              ? "rgba(255,255,255,0.7)"
                              : "rgba(255,255,255,0.25)",
                          width: "60%",
                        }}
                      />
                    </div>
                  ),
                )}
              </aside>
              <main style={{ padding: "22px 22px 20px" }}>
                <div style={{ fontSize: 12, color: sub, marginBottom: 4 }}>
                  Product overview
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                    marginBottom: 18,
                  }}
                >
                  One CRM. A connected workflow.
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  {[
                    {
                      t: "Marketing Automation",
                      s: "WhatsApp • Email • SMS",
                      v: (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <WhatsAppGlyph size={44} />
                          <svg width="20" height="6" viewBox="0 0 20 6">
                            <path
                              className="flow-dots"
                              d="M1 3 H 19"
                              {...dotStroke}
                              strokeWidth={2}
                            />
                          </svg>
                          <Tile size={34} radius={9} bg={blue} color="#fff">
                            <Mail size={16} />
                          </Tile>
                          <Tile size={34} radius={9} bg={orange} color="#fff">
                            <MessageCircle size={16} />
                          </Tile>
                        </div>
                      ),
                    },
                    {
                      t: "Lead Management",
                      s: "Assign, track and follow up",
                      v: (
                        <div
                          style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Tile size={44} radius={12} bg={mintDeep}>
                            <Users2 size={22} />
                          </Tile>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 5,
                            }}
                          >
                            {[70, 50, 60].map((w) => (
                              <span
                                key={w}
                                style={{
                                  width: w,
                                  height: 6,
                                  borderRadius: 3,
                                  background: "#c9d8ff",
                                }}
                              />
                            ))}
                          </div>
                          <Tile size={26} radius={13} bg={orange} color="#fff">
                            <Bell size={13} />
                          </Tile>
                        </div>
                      ),
                    },
                    {
                      t: "Shared WhatsApp",
                      s: "One number. Assigned chats.",
                      v: (
                        <div style={{ textAlign: "center" }}>
                          <WhatsAppGlyph size={32} />
                          <svg
                            width="140"
                            height="22"
                            viewBox="0 0 140 22"
                            aria-hidden
                            style={{ display: "block", margin: "0 auto" }}
                          >
                            <path
                              className="flow-dots"
                              d="M70 0 V 8 M20 8 H 120 M20 8 V 22 M70 8 V 22 M120 8 V 22"
                              {...dotStroke}
                              strokeWidth={2}
                            />
                          </svg>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              gap: 18,
                            }}
                          >
                            {[0, 1, 2].map((i) => (
                              <Tile key={i} size={30} radius={15}>
                                <Users2 size={14} />
                              </Tile>
                            ))}
                          </div>
                        </div>
                      ),
                    },
                    {
                      t: "Orders & Delivery",
                      s: "Inventory & courier tracking",
                      v: (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <Tile
                            size={44}
                            radius={12}
                            bg="#fff1dd"
                            color={orange}
                          >
                            <Package size={24} />
                          </Tile>
                          <svg width="26" height="6" viewBox="0 0 26 6">
                            <path
                              className="flow-dots"
                              d="M1 3 H 25"
                              {...dotStroke}
                              strokeWidth={2}
                            />
                          </svg>
                          <Tile size={44} radius={12} bg={blue} color="#fff">
                            <Truck size={24} />
                          </Tile>
                        </div>
                      ),
                    },
                  ].map((c) => (
                    <div
                      key={c.t}
                      style={{
                        ...card,
                        padding: "16px 14px",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          height: 56,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {c.v}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>
                          {c.t}
                        </div>
                        <div style={{ fontSize: 11, color: sub }}>{c.s}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </main>
            </div>
          </Reveal>
        </div>
        <div
          className="mk-wrap"
          style={{
            padding: "0 48px 34px",
            textAlign: "center",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ flex: 1, height: 1, background: border }} />
            <span style={{ fontSize: 15, color: sub }}>
              Find the plan that fits your workflow
            </span>
            <span style={{ flex: 1, height: 1, background: border }} />
          </div>
          <a
            href="#plans"
            aria-label="Scroll to plans"
            style={{ color: blue, display: "inline-block", marginTop: 8 }}
            className="mk-bounce"
          >
            <ChevronDown size={26} />
          </a>
        </div>
      </section>

      {/* ═══════════ 2. PLANS ═══════════ */}
      <section
        id="plans"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#f8faff",
        }}
      >
        <div
          className="mk-wrap"
          style={{ padding: "72px 48px 56px", position: "relative" }}
        >
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Pill icon={Users2}>CHOOSE YOUR PLAN</Pill>
            <h2
              className="mk-h2"
              style={{
                fontSize: 58,
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                margin: "18px 0 8px",
              }}
            >
              A plan for every <span style={{ color: blue }}>stage.</span>
            </h2>
            <div style={{ fontSize: 20, color: sub }}>
              Start with a 15-day free trial.
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: muted, padding: 60 }}>
              Loading plans…
            </div>
          ) : (
            <div
              className="mk-3col"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(cards.length, 4) || 3},1fr)`,
                gap: 24,
                alignItems: "stretch",
              }}
            >
              {cards.map((p, i) => {
                const hot = i === popularIdx;
                const Icon = planIcons[i % planIcons.length];
                return (
                  <Reveal
                    key={p.id}
                    delay={i * 0.08}
                    className="hover-lift"
                    style={{
                      ...card,
                      padding: "30px 28px",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      border: hot ? `2px solid ${blue}` : `1px solid ${border}`,
                      background: hot ? "#f2f6ff" : "#fff",
                      boxShadow: hot
                        ? "0 24px 60px rgba(26,92,255,0.16)"
                        : "none",
                    }}
                  >
                    {hot && (
                      <div
                        style={{
                          position: "absolute",
                          top: -18,
                          right: 24,
                          background: `linear-gradient(180deg, ${orange}, #e8891a)`,
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          padding: "9px 18px",
                          borderRadius: 20,
                          boxShadow: "0 10px 24px rgba(245,154,35,0.35)",
                          textTransform: "uppercase",
                        }}
                      >
                        {p.name} plan
                        <Spark
                          style={{ position: "absolute", top: -26, right: -34 }}
                        />
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        marginBottom: 22,
                      }}
                    >
                      <Tile size={68}>
                        <Icon size={32} />
                      </Tile>
                      <div>
                        <div
                          style={{
                            fontSize: 30,
                            fontWeight: 800,
                            lineHeight: 1.1,
                          }}
                        >
                          {p.name}
                        </div>
                        <div style={{ fontSize: 15, color: sub }}>
                          {p.description}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 10,
                        paddingBottom: 22,
                        borderBottom: `1px solid ${border}`,
                        marginBottom: 22,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 50,
                          fontWeight: 800,
                          letterSpacing: "-0.03em",
                          lineHeight: 1,
                        }}
                      >
                        {fmtPrice(p.price_monthly)}
                      </span>
                      <span style={{ fontSize: 18, color: sub }}>/ month</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                        marginBottom: 28,
                        flex: 1,
                      }}
                    >
                      {p.trial_days > 0 && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <Tile size={40} radius={20}>
                            <Leaf size={18} />
                          </Tile>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 700 }}>
                              Free trial
                            </div>
                            <div style={{ fontSize: 14, color: sub }}>
                              {p.trial_days} days, no card required
                            </div>
                          </div>
                        </div>
                      )}
                      {p.features.map((f) => (
                        <div
                          key={f}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <Tile size={40} radius={20}>
                            <Check size={18} strokeWidth={3} />
                          </Tile>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: ink,
                            }}
                          >
                            {FEATURE_LABELS[f] || f}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={go} style={hot ? cta : ctaOutline}>
                      Start 15-Day Free Trial <ArrowRight size={18} />
                    </button>
                  </Reveal>
                );
              })}
            </div>
          )}

          <div
            style={{
              ...card,
              background: mint,
              border: "none",
              marginTop: 28,
              padding: "18px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <Tile size={38} radius={19} bg={blue} color="#fff">
              <MessageCircle size={18} />
            </Tile>
            <span style={{ fontSize: 17, color: ink }}>
              Not sure which plan fits your team?
            </span>
            <span style={{ width: 1, height: 22, background: border }} />
            <a
              href="/contact"
              style={{
                color: blue,
                fontWeight: 700,
                fontSize: 17,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Talk to us <ArrowRight size={16} />
            </a>
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: 13,
              color: muted,
              marginTop: 12,
            }}
          >
            Plan details and applicable charges will be confirmed before launch.
          </div>
        </div>
      </section>

      {/* ═══════════ 3. COMPARE ═══════════ */}
      {!loading && cards.length > 0 && (
        <section style={{ position: "relative", overflow: "hidden" }}>
          <Blob
            size={600}
            top={-200}
            left={-260}
            color="rgba(26,92,255,0.10)"
          />
          <div
            className="mk-wrap"
            style={{ padding: "72px 48px", position: "relative" }}
          >
            <div style={{ textAlign: "center", marginBottom: 30 }}>
              <Pill icon={BarChart3}>COMPARE FEATURES</Pill>
              <h2
                className="mk-h2"
                style={{
                  fontSize: 58,
                  fontWeight: 800,
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                  margin: "18px 0 8px",
                }}
              >
                See what <span style={{ color: blue }}>fits your team.</span>
              </h2>
              <div style={{ fontSize: 20, color: sub }}>
                Compare the tools that support your daily sales workflow.
              </div>
            </div>
            <div
              style={{
                textAlign: "right",
                fontSize: 13,
                color: muted,
                marginBottom: 10,
              }}
            >
              Plan allocation preview
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: 860,
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  tableLayout: "fixed",
                  ...card,
                  overflow: "hidden",
                }}
              >
                <colgroup>
                  <col style={{ width: "40%" }} />
                  {cards.map((p) => (
                    <col key={p.id} />
                  ))}
                </colgroup>
                <thead>
                  <tr style={{ background: mint }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "24px 30px",
                        fontSize: 24,
                        fontWeight: 700,
                      }}
                    >
                      Features
                    </th>
                    {cards.map((p, i) => {
                      const Icon = planIcons[i % planIcons.length];
                      const hot = i === popularIdx;
                      return (
                        <th
                          key={p.id}
                          style={{
                            padding: "24px 16px",
                            fontSize: 24,
                            fontWeight: 700,
                            textAlign: "center",
                            background: hot ? "#dfe9ff" : "transparent",
                            boxShadow: hot
                              ? `inset 2px 2px 0 ${blue}, inset -2px 0 0 ${blue}`
                              : "none",
                            borderTopLeftRadius: hot ? 12 : 0,
                            borderTopRightRadius: hot ? 12 : 0,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 12,
                              color: ink,
                            }}
                          >
                            <Icon size={28} color={blue} /> {p.name}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {compareGroups.map((g) => (
                    <GroupRows
                      key={g.title}
                      g={g}
                      cards={cards}
                      popularIdx={popularIdx}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                textAlign: "center",
                fontSize: 13,
                color: muted,
                marginTop: 12,
              }}
            >
              — = not included in this plan
            </div>
            <div
              style={{
                ...card,
                background: mint,
                border: "none",
                marginTop: 24,
                padding: "18px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
                flexWrap: "wrap",
              }}
            >
              <Tile size={38} radius={19} bg={blue} color="#fff">
                <MessageCircle size={18} />
              </Tile>
              <span style={{ fontSize: 17 }}>
                Need help matching a plan to your workflow?
              </span>
              <span style={{ width: 1, height: 22, background: border }} />
              <a
                href="/contact"
                style={{
                  color: blue,
                  fontWeight: 700,
                  fontSize: 17,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Talk to our team <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ 4. USAGE & COST ═══════════ */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#f8faff",
        }}
      >
        <Blob size={560} top={-200} left={-240} color="rgba(26,92,255,0.12)" />
        <Blob
          size={560}
          top={-120}
          right={-240}
          color="rgba(245,154,35,0.18)"
        />
        <AnimatedDots
          width={80}
          height={90}
          style={{ position: "absolute", left: 60, top: 100 }}
        />
        <AnimatedDots
          width={80}
          height={90}
          color="rgba(245,154,35,0.6)"
          style={{ position: "absolute", right: 60, top: 160 }}
        />
        <div
          className="mk-wrap"
          style={{ padding: "72px 48px", position: "relative" }}
        >
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <Pill>UNDERSTAND YOUR TOTAL COST</Pill>
            <h2
              className="mk-h2"
              style={{
                fontSize: 58,
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                margin: "18px 0 8px",
              }}
            >
              Your plan. Your usage.{" "}
              <span style={{ color: blue }}>A clear view.</span>
            </h2>
            <div style={{ fontSize: 20, color: sub }}>
              Review messaging, delivery and applicable charges before you
              choose.
            </div>
          </div>
          <div
            className="mk-2col"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginBottom: 24,
            }}
          >
            {[
              {
                icon: <WhatsAppGlyph size={60} />,
                bg: "#e4f5ec",
                t: "WhatsApp messaging",
                d: "Check message usage, provider charges and any included allowance.",
              },
              {
                icon: <Mail size={48} color={blue} />,
                bg: mintDeep,
                t: "SMS & email",
                d: "Confirm sending limits and any charges from connected providers.",
              },
              {
                icon: <Truck size={48} color={orange} />,
                bg: "#fff1dd",
                t: "Courier & delivery",
                d: "Shipping costs depend on your courier, parcel and destination.",
              },
              {
                icon: <Receipt size={48} color={blue} />,
                bg: mintDeep,
                t: "Taxes & setup",
                d: "Confirm applicable taxes and any setup or integration fees.",
              },
            ].map((c, i) => (
              <Reveal
                key={c.t}
                delay={i * 0.06}
                className="hover-lift"
                style={{
                  ...card,
                  padding: 28,
                  display: "flex",
                  alignItems: "center",
                  gap: 26,
                }}
              >
                <Tile size={110} radius={22} bg={c.bg}>
                  {c.icon}
                </Tile>
                <div>
                  <div
                    style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}
                  >
                    {c.t}
                  </div>
                  <div style={{ fontSize: 17, color: sub, lineHeight: 1.5 }}>
                    {c.d}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <div
            style={{
              ...card,
              background: mint,
              border: "none",
              padding: "26px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <Tile size={72} radius={16} bg="#fff">
                <ListChecks size={34} />
              </Tile>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  Know what is included before you start.
                </div>
                <div style={{ fontSize: 17, color: sub }}>
                  Ask our team for a breakdown based on your workflow.
                </div>
              </div>
            </div>
            <a href="/contact" style={cta}>
              Talk to Our Team <ArrowRight size={18} />
            </a>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginTop: 22,
            }}
          >
            <span style={{ flex: 1, height: 1, background: border }} />
            <span style={{ fontSize: 13, color: muted }}>
              Final charges depend on your selected plan, usage and connected
              services.
            </span>
            <span style={{ flex: 1, height: 1, background: border }} />
          </div>
        </div>
      </section>

      {/* ═══════════ 5. FAQ ═══════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <Blob size={520} top={-160} left={-240} color="rgba(26,92,255,0.10)" />
        <Blob size={520} top={40} right={-260} color="rgba(245,154,35,0.16)" />
        <div
          className="mk-wrap mk-2col"
          style={{
            padding: "72px 48px 56px",
            display: "grid",
            gridTemplateColumns: "0.75fr 1.25fr",
            gap: 56,
            position: "relative",
            alignItems: "start",
          }}
        >
          <Reveal>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: blue,
                letterSpacing: "0.14em",
                marginBottom: 18,
              }}
            >
              PRICING FAQs
            </div>
            <h2
              className="mk-h2"
              style={{
                fontSize: 50,
                fontWeight: 800,
                lineHeight: 1.1,
                margin: "0 0 18px",
              }}
            >
              Good questions.
              <br />
              <span style={{ color: blue }}>Clear answers.</span>
            </h2>
            <p
              style={{
                fontSize: 18,
                color: sub,
                lineHeight: 1.55,
                margin: "0 0 36px",
                maxWidth: 360,
              }}
            >
              Everything to ask before choosing your CRM plan.
            </p>
            <div
              style={{
                background: mint,
                borderRadius: 18,
                padding: 26,
                display: "flex",
                gap: 20,
                alignItems: "center",
              }}
            >
              <Tile size={72} radius={16} bg={blue} color="#fff">
                <MessageCircle size={32} />
              </Tile>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  Still have a question?
                </div>
                <div style={{ fontSize: 15, color: sub, marginBottom: 6 }}>
                  Let's talk about your team's workflow.
                </div>
                <a
                  href="mailto:sales@zalgoinfotech.com"
                  style={{
                    color: blue,
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: "none",
                  }}
                >
                  sales@zalgoinfotech.com
                </a>
              </div>
            </div>
          </Reveal>
          <Reveal
            delay={0.1}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={f.q}
                  style={{
                    ...card,
                    background: isOpen ? "#f2f6ff" : "#fff",
                    border: `1px solid ${isOpen ? "#bcd0ff" : border}`,
                  }}
                >
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 20,
                      padding: "22px 26px",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ fontSize: 20, fontWeight: 700, color: ink }}>
                      {f.q}
                    </span>
                    <Tile size={36} radius={18} bg={blue} color="#fff">
                      {isOpen ? (
                        <Minus size={18} strokeWidth={3} />
                      ) : (
                        <Plus size={18} strokeWidth={3} />
                      )}
                    </Tile>
                  </button>
                  <div
                    style={{
                      maxHeight: isOpen ? 300 : 0,
                      overflow: "hidden",
                      transition: "max-height .35s ease",
                    }}
                  >
                    <div
                      style={{
                        padding: "0 26px 22px",
                        fontSize: 16,
                        color: sub,
                        lineHeight: 1.6,
                      }}
                    >
                      {f.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </Reveal>
        </div>
        <div className="mk-wrap" style={{ padding: "0 48px 64px" }}>
          <div
            style={{
              ...card,
              background: mint,
              border: "none",
              padding: "26px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <Tile size={72} radius={16} bg="#fff" color={blue}>
                <Rocket size={34} />
              </Tile>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  Ready to explore LeadLo with your team?
                </div>
                <div style={{ fontSize: 17, color: sub }}>
                  Try your sales workflow for 15 days.
                </div>
              </div>
            </div>
            <button onClick={go} style={cta}>
              Start Your 15-Day Free Trial <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ 6. TRIAL CTA + WORKFLOW MOCKUP ═══════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div className="mk-wrap" style={{ padding: "0 48px 48px" }}>
          <div
            style={{
              background: "#f0f5ff",
              borderRadius: 28,
              padding: "56px 56px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Blob size={520} top={-200} left={-200} />
            <Blob
              size={460}
              bottom={-220}
              right={-160}
              color="rgba(245,154,35,0.18)"
            />
            <AnimatedDots
              width={70}
              height={90}
              style={{ position: "absolute", left: 24, top: 40 }}
            />
            <div
              className="mk-2col"
              style={{
                display: "grid",
                gridTemplateColumns: "0.9fr 1.1fr",
                gap: 48,
                alignItems: "center",
                position: "relative",
              }}
            >
              <Reveal>
                <div
                  style={{
                    display: "inline-block",
                    border: `1.5px solid ${orange}`,
                    color: orange,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    borderRadius: 24,
                    padding: "8px 18px",
                    marginBottom: 22,
                  }}
                >
                  15-DAY FREE TRIAL
                </div>
                <h2
                  className="mk-h2"
                  style={{
                    fontSize: 56,
                    fontWeight: 800,
                    lineHeight: 1.06,
                    letterSpacing: "-0.02em",
                    margin: "0 0 16px",
                  }}
                >
                  Your next sale
                  <br />
                  deserves a<br />
                  <span style={{ color: blue }}>better workflow.</span>
                </h2>
                <p
                  style={{
                    fontSize: 19,
                    color: sub,
                    lineHeight: 1.55,
                    margin: "0 0 28px",
                    maxWidth: 480,
                  }}
                >
                  Bring your leads, team conversations and orders together. Try
                  LeadLo with your team for 15 days.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    marginBottom: 26,
                    flexWrap: "wrap",
                  }}
                >
                  <button onClick={go} style={cta}>
                    Start My Free Trial <ArrowRight size={18} />
                  </button>
                  <a href="/contact" style={ctaOutline}>
                    Help Me Choose a Plan
                  </a>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {[
                    "One WhatsApp number. Your whole team.",
                    "Lead follow-ups, orders and delivery tracking.",
                  ].map((t) => (
                    <div
                      key={t}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontSize: 16,
                        color: sub,
                      }}
                    >
                      <CheckBadge size={28} /> {t}
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={0.12} style={{ position: "relative" }}>
                <Spark style={{ position: "absolute", top: -30, right: 0 }} />
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    right: 12,
                    zIndex: 3,
                    background: "#fff",
                    borderRadius: 999,
                    padding: "8px 16px 8px 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "0 16px 34px rgba(11,31,74,0.14)",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  <WhatsAppGlyph size={30} /> Shared team inbox
                </div>
                <div
                  style={{
                    ...card,
                    borderRadius: 20,
                    padding: 0,
                    overflow: "hidden",
                    boxShadow: "0 36px 80px rgba(11,31,74,0.16)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      padding: "14px 22px",
                      borderBottom: `1px solid ${border}`,
                      background: "#f7f9fe",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={LOGO}
                      alt="LeadLo"
                      style={{ height: 24, width: "auto" }}
                    />
                    {[50, 60, 44].map((w) => (
                      <span
                        key={w}
                        style={{
                          width: w,
                          height: 6,
                          borderRadius: 3,
                          background: "#d8e2f5",
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ padding: "22px 22px 18px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 18,
                      }}
                    >
                      <div style={{ fontSize: 24, fontWeight: 800 }}>
                        Your sales workflow
                      </div>
                      <div style={{ fontSize: 12, color: muted }}>
                        Illustrative preview
                      </div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4,1fr)",
                        position: "relative",
                        marginBottom: 20,
                      }}
                    >
                      <svg
                        viewBox="0 0 800 70"
                        width="100%"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          height: "auto",
                        }}
                        aria-hidden
                      >
                        {[0, 1, 2].map((i) => (
                          <path
                            key={i}
                            className="flow-dots"
                            d={`M${100 + i * 200 + 44} 35 H ${100 + (i + 1) * 200 - 44}`}
                            {...dotStroke}
                            strokeWidth={2}
                          />
                        ))}
                      </svg>
                      {[
                        {
                          i: <UserPlus size={26} />,
                          bg: blue,
                          fg: "#fff",
                          done: true,
                          t: "Capture leads",
                          s: "Bring enquiries into one place",
                        },
                        {
                          i: <MessageCircle size={26} />,
                          bg: blue,
                          fg: "#fff",
                          done: true,
                          t: "Follow up",
                          s: "Assign leads and set reminders",
                        },
                        {
                          i: <Package size={26} />,
                          bg: "#fff1dd",
                          fg: orange,
                          t: "Confirm orders",
                          s: "Keep order and stock details together",
                        },
                        {
                          i: <Truck size={26} />,
                          bg: mintDeep,
                          fg: blue,
                          t: "Track delivery",
                          s: "Follow shipment updates",
                        },
                      ].map((s) => (
                        <div
                          key={s.t}
                          style={{
                            textAlign: "center",
                            position: "relative",
                            padding: "0 6px",
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              display: "inline-block",
                              marginBottom: 10,
                            }}
                          >
                            <Tile size={70} radius={35} bg={s.bg} color={s.fg}>
                              {s.i}
                            </Tile>
                            {s.done && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: -2,
                                  right: -2,
                                  width: 22,
                                  height: 22,
                                  borderRadius: 11,
                                  background: blue,
                                  border: "2px solid #fff",
                                  color: "#fff",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Check size={12} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>
                            {s.t}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: sub,
                              lineHeight: 1.35,
                            }}
                          >
                            {s.s}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "120px 1fr",
                        gap: 12,
                        background: "#f7f9fe",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          paddingTop: 4,
                        }}
                      >
                        {[0, 1, 2, 3, 4].map((i) => (
                          <span
                            key={i}
                            style={{
                              height: 8,
                              borderRadius: 4,
                              background: i === 1 ? "#c9d8ff" : "#dfe6f3",
                              width: i === 1 ? "100%" : "70%",
                              boxShadow:
                                i === 1 ? `inset 3px 0 0 ${blue}` : "none",
                            }}
                          />
                        ))}
                      </div>
                      <div
                        style={{
                          background: "#fff",
                          borderRadius: 10,
                          padding: 12,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {[
                          ["#7fd6b0", "#dff3e8"],
                          ["#8fb4ff", mintDeep],
                          ["#ffc07a", "#fff1dd"],
                          ["#c9a8ff", "#efe6ff"],
                        ].map(([dot, pill], i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 7,
                                background: dot,
                              }}
                            />
                            <span
                              style={{
                                flex: 1,
                                height: 7,
                                borderRadius: 4,
                                background: "#e6ecf7",
                              }}
                            />
                            <span
                              style={{
                                width: 60,
                                height: 7,
                                borderRadius: 4,
                                background: "#e6ecf7",
                              }}
                            />
                            <span
                              style={{
                                width: 44,
                                height: 12,
                                borderRadius: 6,
                                background: pill,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* not sure which plan fits */}
          <div
            style={{
              ...card,
              marginTop: 24,
              padding: "22px 32px",
              display: "flex",
              alignItems: "center",
              gap: 28,
              flexWrap: "wrap",
            }}
          >
            <Tile size={60} radius={30}>
              <Mail size={26} />
            </Tile>
            <span style={{ width: 1, height: 40, background: border }} />
            <span style={{ fontSize: 22, fontWeight: 700 }}>
              Not sure which plan fits?
            </span>
            <span style={{ fontSize: 17, color: sub, flex: 1 }}>
              Tell us about your team. We'll help you choose.
            </span>
            <a
              href="mailto:sales@zalgoinfotech.com"
              style={{
                color: blue,
                fontWeight: 700,
                fontSize: 18,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              sales@zalgoinfotech.com <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ 7. FIND THE RIGHT FIT ═══════════ */}
      <section style={{ background: "#f8faff", padding: "40px 48px" }}>
        <div
          className="mk-wrap"
          style={{
            background: mint,
            borderRadius: 24,
            padding: "30px 40px",
            display: "flex",
            alignItems: "center",
            gap: 28,
            flexWrap: "wrap",
            position: "relative",
          }}
        >
          <Spark style={{ position: "absolute", top: 8, left: 46 }} />
          <Tile size={90} radius={45} bg={mintDeep}>
            <Mail size={38} />
          </Tile>
          <span style={{ width: 1, height: 70, background: "#c9d8ff" }} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: "-0.01em",
              }}
            >
              Let's find the right fit for your team.
            </div>
            <div style={{ fontSize: 19, color: sub }}>
              Have a question about LeadLo? We're here to help.
            </div>
          </div>
          <a
            href="/contact"
            style={{ ...cta, padding: "20px 34px", fontSize: 19 }}
          >
            Talk to Our Team <ArrowRight size={20} />
          </a>
        </div>
      </section>

      <MarketingFooter />
      <MarketingStyles />
      <style
        // dangerouslySetInnerHTML instead of a JSX text child — a plain
        // <style>{`...`}</style> with literal quotes in it (the
        // a[href="/register"] attribute selectors below) hydration-
        // mismatches: the server and client escape those quotes
        // differently when serializing the text node, so the raw-HTML
        // path (identical bytes both passes) sidesteps that entirely.
        dangerouslySetInnerHTML={{
          __html: `
        .flow-dots { animation: flowDots .9s linear infinite; }
        @keyframes flowDots { to { stroke-dashoffset: -16; } }
        .mk-bounce { animation: mkBounce 1.6s ease-in-out infinite; }
        @keyframes mkBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        .mk-page a[href="/register"], .mk-page a[href="/contact"], .mk-page button { transition: transform .2s ease, box-shadow .2s ease, filter .2s ease; }
        .mk-page a[href="/contact"]:hover, .mk-page button:hover { transform: translateY(-2px); filter: brightness(1.04); }
        .hover-lift:hover { border-color: ${blue} !important; box-shadow: 0 22px 44px rgba(26,92,255,0.12); }
        html { scroll-behavior: smooth; }
        @media (max-width: 1100px) { .mk-h1 { font-size: 52px !important; } .mk-h2 { font-size: 40px !important; } }
        @media (max-width: 860px) {
          .mk-2col { grid-template-columns: 1fr !important; }
          .mk-3col { grid-template-columns: 1fr !important; }
          .mk-hero-visual { display: none; }
          .mk-h1 { font-size: 42px !important; } .mk-h2 { font-size: 34px !important; }
        }
      `,
        }}
      />
    </div>
  );
}

/* compare-table group: heading row + one row per feature line */
function GroupRows({ g, cards, popularIdx }) {
  const Icon = g.icon;
  const cell = (hot, last) => ({
    padding: "12px 16px",
    textAlign: "center",
    borderTop: `1px solid ${border}`,
    background: hot ? "#f2f6ff" : "transparent",
    boxShadow: hot
      ? `inset 2px 0 0 ${blue}, inset -2px ${last ? -2 : 0}px 0 ${blue}`
      : "none",
  });
  return (
    <>
      <tr style={{ background: "#f8faff" }}>
        <td
          style={{
            padding: "18px 30px 10px",
            borderTop: `1px solid ${border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Tile size={50} radius={25}>
              <Icon size={24} />
            </Tile>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{g.title}</span>
          </div>
        </td>
        {cards.map((p, i) => (
          <td key={p.id} style={cell(i === popularIdx, false)} />
        ))}
      </tr>
      {g.rows.map((row, r) => (
        <tr key={row.label}>
          <td
            style={{
              padding: "13px 30px 13px 96px",
              fontSize: 17,
              color: sub,
              borderTop: `1px solid ${border}`,
            }}
          >
            {row.label}
          </td>
          {cards.map((p, i) => (
            <td
              key={p.id}
              style={cell(
                i === popularIdx,
                r === g.rows.length - 1 && g.title === "Team Access",
              )}
            >
              {planHas(p, row.test) ? (
                <Tile size={32} radius={16} bg={blue} color="#fff">
                  <Check size={16} strokeWidth={3} />
                </Tile>
              ) : (
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 13,
                    fontWeight: 700,
                    color: muted,
                    background: "#eef2f9",
                    borderRadius: 999,
                    padding: "5px 16px",
                    lineHeight: 1.4,
                  }}
                >
                  —
                </span>
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
