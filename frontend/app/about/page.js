"use client";
import {
  ArrowRight,
  ArrowDown,
  ArrowUpRight,
  Check,
  Users2,
  Users,
  User,
  ShieldCheck,
  Share2,
  Calendar,
  Package,
  Truck,
  Boxes,
  MessageCircle,
  Mail,
  Zap,
  FileText,
  Lock,
  Laptop,
  Settings,
  Network,
  Headphones,
  FlaskConical,
  Building2,
  ShoppingBag,
  GraduationCap,
  Store,
  Quote,
  Home,
  ClipboardList,
} from "lucide-react";
import { ink, sub, muted, border } from "../../lib/marketing-theme";
import { poppins } from "../../lib/marketing-font";
import { WhatsAppGlyph, MetaGlyph } from "../../components/BrandIcons";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";
import MarketingStyles from "../../components/MarketingStyles";
import Reveal from "../../components/Reveal";

/* ─────────── editable details ─────────── */
const LOGO = "/logo_light.png";
const EMAIL = "leadlozalgo@gmail.com";
const REGISTER_URL = "/register";
const COMPANY_URL = "https://zalgoinfotech.com";
const FOUNDER = {
  name: "Bhupendra Singh Parmar",
  role: "Founder, Zalgo Infotech",
  initials: "BP",
};
/* Optional illustration for the hero (people at a laptop, as in the design).
   Put an image at /public/about/hero-team.png and set HERO_IMAGE = "/about/hero-team.png". */
const HERO_IMAGE = "";

/* ─────────── LeadLo tokens ─────────── */
const blue = "#1a5cff";
const blueDeep = "#0f47d6";
const orange = "#f59a23";
const mint = "#eef4ff";
const mintDeep = "#dfe9ff";
const orangeSoft = "#fff1dd";

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
  solid = false,
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
        background: solid
          ? color
          : `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`,
        pointerEvents: "none",
      }}
    />
  );
}
function Spark({ style, size = 34 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      aria-hidden
      style={style}
    >
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
function Pill({ children, outline = false }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: outline ? orangeSoft : mintDeep,
        color: outline ? orange : blue,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "0.06em",
        borderRadius: 24,
        padding: "10px 22px",
        border: outline ? `1.5px solid ${orange}` : "1px solid #c9d8ff",
      }}
    >
      {children}
    </div>
  );
}
function Tile({
  children,
  size = 64,
  bg = mintDeep,
  color = blue,
  radius = 14,
  style,
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
        ...style,
      }}
    >
      {children}
    </span>
  );
}
/* avatar with initials — stands in for the illustrated people in the design */
function Avatar({ initials, bg = "#2a6fb0", size = 60, ring = "#fff" }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: "#fff",
        fontSize: size * 0.32,
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: `3px solid ${ring}`,
        boxShadow: "0 8px 18px rgba(11,31,74,0.14)",
        flexShrink: 0,
      }}
    >
      {initials}
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
function Bar({ icon, title, sub: s, linkLabel, href, button = false }) {
  return (
    <div
      style={{
        ...card,
        background: mint,
        border: "none",
        padding: "22px 32px",
        display: "flex",
        alignItems: "center",
        gap: 22,
        flexWrap: "wrap",
      }}
    >
      <Tile size={54} radius={27} bg="transparent">
        {icon}
      </Tile>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div
          style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" }}
        >
          {title}
        </div>
        {s && <div style={{ fontSize: 16, color: sub }}>{s}</div>}
      </div>
      {linkLabel &&
        (button ? (
          <a href={href} style={cta}>
            {linkLabel} <ArrowRight size={18} />
          </a>
        ) : (
          <a
            href={href}
            style={{
              color: blue,
              fontWeight: 700,
              fontSize: 18,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {linkLabel} <ArrowRight size={18} />
          </a>
        ))}
    </div>
  );
}

const industries = [
  {
    icon: FlaskConical,
    title: "Ayurvedic & Wellness",
    desc: "Connect enquiries, follow-ups, stock and delivery.",
  },
  {
    icon: Headphones,
    title: "Telesales Teams",
    desc: "One WhatsApp number. Clearly assigned leads and chats.",
    wa: true,
  },
  {
    icon: Building2,
    title: "Real Estate",
    desc: "Organise property enquiries and follow-up reminders.",
  },
  {
    icon: ShoppingBag,
    title: "E-commerce & D2C",
    desc: "Manage sales enquiries, orders and shipment tracking.",
  },
  {
    icon: GraduationCap,
    title: "Coaching & Education",
    desc: "Keep course enquiries and admission follow-ups organised.",
  },
  {
    icon: Store,
    title: "Clinics & Services",
    desc: "Assign enquiries and keep customer conversations together.",
  },
];

export default function AboutPage() {
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
        <Blob size={720} top={-300} right={-240} />
        <Blob size={480} bottom={-240} left={-200} />
        <div
          className="mk-wrap mk-2col"
          style={{
            padding: "64px 48px 56px",
            display: "grid",
            gridTemplateColumns: "0.85fr 1.15fr",
            gap: 56,
            alignItems: "center",
            position: "relative",
          }}
        >
          <Reveal>
            <Pill>ABOUT LEADLO</Pill>
            <h1
              className="mk-h1"
              style={{
                fontSize: 68,
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: "-0.03em",
                margin: "22px 0 22px",
              }}
            >
              Built for the
              <br />
              teams behind
              <br />
              <span style={{ color: blue }}>every sale.</span>
            </h1>
            <p
              style={{
                fontSize: 20,
                color: sub,
                lineHeight: 1.5,
                margin: "0 0 30px",
                maxWidth: 480,
              }}
            >
              We bring leads, WhatsApp conversations, follow-ups and orders into
              one connected workspace—so your team can focus on the next step.
            </p>
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              <a href={REGISTER_URL} style={cta}>
                Start Your 15-Day Free Trial <ArrowRight size={18} />
              </a>
              <a href="#story" style={ctaOutline}>
                Our Story <ArrowDown size={18} />
              </a>
            </div>
            <div style={{ fontSize: 15, color: muted }}>
              A product of Zalgo Infotech Pvt. Ltd.
            </div>
          </Reveal>

          <Reveal
            delay={0.12}
            className="mk-hero-visual"
            style={{ position: "relative" }}
          >
            {HERO_IMAGE ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={HERO_IMAGE}
                alt="LeadLo team at work"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  borderRadius: 24,
                }}
              />
            ) : (
              <>
                <Spark
                  style={{
                    position: "absolute",
                    top: 120,
                    right: 30,
                    zIndex: 3,
                  }}
                />
                <div
                  style={{
                    ...card,
                    borderRadius: 22,
                    overflow: "hidden",
                    boxShadow: "0 36px 80px rgba(11,31,74,0.16)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "14px 22px",
                      borderBottom: `1px solid ${border}`,
                      background: "#f7f9fe",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={LOGO}
                      alt="LeadLo"
                      style={{ height: 26, width: "auto" }}
                    />
                    {[70, 90, 60].map((w) => (
                      <span
                        key={w}
                        style={{
                          width: w,
                          height: 7,
                          borderRadius: 4,
                          background: "#d8e2f5",
                        }}
                      />
                    ))}
                    <span
                      style={{
                        marginLeft: "auto",
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: mintDeep,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "120px 1fr",
                      gap: 18,
                      padding: 22,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {[Home, Users2, MessageCircle, ClipboardList].map(
                        (I, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 10px",
                              borderRadius: 8,
                              background: i === 0 ? mintDeep : "transparent",
                              color: i === 0 ? blue : muted,
                            }}
                          >
                            <I size={15} />
                            <span
                              style={{
                                height: 6,
                                borderRadius: 3,
                                background: i === 0 ? "#b9ccff" : "#e4ebf7",
                                width: "60%",
                              }}
                            />
                          </div>
                        ),
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          marginBottom: 14,
                        }}
                      >
                        One team. A connected workflow.
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4,1fr)",
                          gap: 10,
                        }}
                      >
                        {[
                          { i: <Users2 size={28} color={blue} />, l: "Leads" },
                          {
                            i: <WhatsAppGlyph size={32} />,
                            l: "Conversations",
                          },
                          {
                            i: <Calendar size={28} color={orange} />,
                            l: "Follow-ups",
                          },
                          {
                            i: <Package size={28} color={orange} />,
                            l: "Orders",
                          },
                        ].map((c) => (
                          <div
                            key={c.l}
                            style={{
                              ...card,
                              padding: "16px 8px",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                height: 36,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 8,
                              }}
                            >
                              {c.i}
                            </div>
                            <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                              {c.l}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: -10,
                          marginTop: 22,
                        }}
                      >
                        {[
                          ["RK", "#2a6fb0"],
                          ["AS", "#c8508c"],
                          ["PV", "#e8891a"],
                        ].map(([i, c], idx) => (
                          <Avatar key={i} initials={i} bg={c} size={64} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "44%",
                    right: -20,
                    zIndex: 3,
                    background: "#fff",
                    borderRadius: 16,
                    padding: "14px 18px",
                    boxShadow: "0 18px 40px rgba(11,31,74,0.16)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <WhatsAppGlyph size={40} />
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        lineHeight: 1.25,
                      }}
                    >
                      One number.
                      <br />
                      Your whole team.
                    </div>
                    <div style={{ display: "flex", marginTop: 6 }}>
                      {[["#2a6fb0"], ["#c8508c"], ["#e8891a"]].map(([c], i) => (
                        <span
                          key={i}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: c,
                            border: "2px solid #fff",
                            marginLeft: i ? -6 : 0,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: -14,
                    right: 10,
                    zIndex: 3,
                    background: "#fff",
                    borderRadius: 14,
                    padding: "12px 18px",
                    boxShadow: "0 18px 40px rgba(11,31,74,0.16)",
                    border: `1.5px solid ${orange}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  <Tile size={34} radius={17} bg={orangeSoft} color={orange}>
                    <Package size={17} />
                  </Tile>{" "}
                  Orders & delivery
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: -40,
                    right: 10,
                    fontSize: 12,
                    color: muted,
                  }}
                >
                  Illustrative team workflow
                </div>
              </>
            )}
          </Reveal>
        </div>
        <div
          style={{
            borderTop: `1px solid ${border}`,
            background: "#fff",
            position: "relative",
          }}
        >
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
              {
                icon: <Users size={30} color={blue} />,
                l: "Built around real sales work",
              },
              {
                icon: <ShieldCheck size={30} color={blue} />,
                l: "Clear ownership for every lead",
              },
              {
                icon: <Share2 size={30} color={blue} />,
                l: "Connected from enquiry to delivery",
              },
            ].map((f, i) => (
              <div
                key={f.l}
                className="mk-strip-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  fontSize: 18,
                  fontWeight: 600,
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

      {/* ═══════════ 2. OUR STORY ═══════════ */}
      <section id="story" style={{ position: "relative", overflow: "hidden" }}>
        <Blob
          size={520}
          bottom={-260}
          left={-220}
          color="rgba(26,92,255,0.10)"
        />
        <div
          className="mk-wrap mk-2col"
          style={{
            padding: "72px 48px 40px",
            display: "grid",
            gridTemplateColumns: "0.95fr 1.05fr",
            gap: 56,
            alignItems: "center",
            position: "relative",
          }}
        >
          <Reveal>
            <Pill>OUR STORY</Pill>
            <h2
              className="mk-h2"
              style={{
                fontSize: 62,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                margin: "22px 0 16px",
              }}
            >
              It started with a<br />
              <span style={{ color: blue }}>real sales team.</span>
            </h2>
            <div
              style={{
                fontSize: 19,
                color: ink,
                fontWeight: 500,
                marginBottom: 18,
              }}
            >
              Built around the everyday workflow of an Ayurvedic business.
            </div>
            <p
              style={{
                fontSize: 18,
                color: sub,
                lineHeight: 1.6,
                margin: "0 0 16px",
              }}
            >
              LeadLo began with a practical need: helping an Ayurvedic company
              manage enquiries from Meta ads and follow-ups by its telecalling
              team.
            </p>
            <p
              style={{
                fontSize: 18,
                color: sub,
                lineHeight: 1.6,
                margin: "0 0 28px",
              }}
            >
              The workflow continued beyond the sale—with order confirmations,
              inventory and courier tracking. We built LeadLo to bring those
              steps together.
            </p>
            <div
              style={{
                background: mint,
                borderRadius: 16,
                padding: "22px 28px",
                display: "flex",
                alignItems: "center",
                gap: 22,
              }}
            >
              <Quote size={40} color={orange} fill={orange} />
              <span style={{ width: 1, height: 52, background: "#c9d8ff" }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  From the first enquiry to the final delivery.
                </div>
                <a
                  href="/features"
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
                  Explore how LeadLo works <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </Reveal>
          <Reveal
            delay={0.12}
            style={{
              background: mint,
              borderRadius: 24,
              padding: "26px 28px 22px",
              position: "relative",
            }}
          >
            <div
              style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: 700,
                color: blue,
                letterSpacing: "0.08em",
                marginBottom: 20,
              }}
            >
              THE WORKFLOW THAT SHAPED LEADLO
            </div>
            {[
              {
                v: (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <MetaGlyph size={64} />
                    <div style={{ ...card, width: 110, padding: 8 }}>
                      {[60, 40, 70].map((w) => (
                        <div
                          key={w}
                          style={{
                            height: 6,
                            borderRadius: 3,
                            background: "#c9d8ff",
                            width: `${w}%`,
                            marginBottom: 6,
                          }}
                        />
                      ))}
                      <div
                        style={{
                          height: 14,
                          borderRadius: 4,
                          background: blue,
                          width: "50%",
                        }}
                      />
                    </div>
                  </div>
                ),
                t: "An enquiry comes in",
                s: "Meta ads bring product enquiries",
              },
              {
                v: (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <Avatar initials="AS" bg="#2a6fb0" size={72} />
                    <Tile size={50} radius={25} bg="#fff">
                      <MessageCircle size={24} />
                    </Tile>
                  </div>
                ),
                t: "The team follows up",
                s: "Assigned leads, reminders and conversations",
              },
              {
                v: (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <Tile size={60} radius={14} bg={orangeSoft} color={orange}>
                      <Boxes size={32} />
                    </Tile>
                    <Tile size={60} radius={14} bg={mintDeep}>
                      <Truck size={32} />
                    </Tile>
                  </div>
                ),
                t: "The order moves forward",
                s: "Confirmation, stock and delivery tracking",
              },
            ].map((r, i, arr) => (
              <div key={r.t}>
                <div
                  style={{
                    ...card,
                    padding: "22px 26px",
                    display: "flex",
                    alignItems: "center",
                    gap: 26,
                  }}
                >
                  <div
                    style={{
                      width: 200,
                      display: "flex",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {r.v}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {r.t}
                    </div>
                    <div style={{ fontSize: 17, color: sub }}>{r.s}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "8px 0",
                      color: blue,
                    }}
                  >
                    <ArrowDown size={26} strokeWidth={2.5} />
                  </div>
                )}
              </div>
            ))}
            <div
              style={{
                textAlign: "right",
                fontSize: 12,
                color: muted,
                marginTop: 10,
              }}
            >
              Illustrative workflow
            </div>
          </Reveal>
        </div>
        <div className="mk-wrap" style={{ padding: "0 48px 24px" }}>
          <div
            style={{
              borderTop: `1px solid ${border}`,
              paddingTop: 18,
              textAlign: "center",
              fontSize: 15,
              color: muted,
            }}
          >
            LeadLo • A product of Zalgo Infotech Pvt. Ltd.
          </div>
        </div>
      </section>

      {/* ═══════════ 3. MISSION ═══════════ */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#f8faff",
        }}
      >
        <Blob size={560} top={-200} left={-260} color="rgba(26,92,255,0.10)" />
        <div
          className="mk-wrap"
          style={{ padding: "64px 48px", position: "relative" }}
        >
          <div style={{ textAlign: "center", marginBottom: 34 }}>
            <Pill>OUR MISSION</Pill>
            <h2
              className="mk-h2"
              style={{
                fontSize: 62,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                margin: "18px 0 12px",
              }}
            >
              Make every next step
              <br />
              <span style={{ color: blue }}>clear for your team.</span>
            </h2>
            <div style={{ fontSize: 20, color: sub }}>
              Bring leads, conversations, follow-ups and orders together—so
              everyone knows what needs to happen next.
            </div>
          </div>
          <div
            className="mk-2col"
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: 24,
              marginBottom: 24,
            }}
          >
            {/* connected workspace diagram */}
            <Reveal
              style={{
                background: mint,
                borderRadius: 24,
                padding: "22px 26px",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: blue,
                  letterSpacing: "0.08em",
                  marginBottom: 14,
                }}
              >
                ONE CONNECTED WORKSPACE
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 60px 1.3fr 60px 1fr",
                  alignItems: "center",
                  gap: 0,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}
                >
                  {[
                    {
                      i: <User size={30} color={blue} />,
                      bg: mintDeep,
                      l: "Leads",
                    },
                    {
                      i: <Calendar size={30} color={orange} />,
                      bg: orangeSoft,
                      l: "Follow-ups",
                    },
                  ].map((c) => (
                    <div
                      key={c.l}
                      style={{
                        ...card,
                        padding: "18px 12px",
                        textAlign: "center",
                      }}
                    >
                      <Tile size={56} radius={28} bg={c.bg}>
                        {c.i}
                      </Tile>
                      <div
                        style={{ fontSize: 17, fontWeight: 700, marginTop: 8 }}
                      >
                        {c.l}
                      </div>
                    </div>
                  ))}
                </div>
                <svg viewBox="0 0 60 220" width="60" height="220" aria-hidden>
                  <path
                    className="flow-dots"
                    d="M4 60 H 30 Q 40 60 40 70 V 100 M4 160 H 30 Q 40 160 40 150 V 120 M40 100 V 120 H 58"
                    {...dotStroke}
                  />
                  <circle cx="4" cy="60" r="5" fill={blue} />
                  <circle cx="4" cy="160" r="5" fill={blue} />
                </svg>
                <div
                  style={{ ...card, padding: "26px 16px", textAlign: "center" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={LOGO}
                    alt="LeadLo"
                    style={{
                      height: 46,
                      width: "auto",
                      margin: "0 auto 8px",
                      display: "block",
                    }}
                  />
                  <div style={{ fontSize: 14, color: sub }}>
                    Your team's shared workspace
                  </div>
                </div>
                <svg viewBox="0 0 60 220" width="60" height="220" aria-hidden>
                  <path
                    className="flow-dots"
                    d="M56 60 H 30 Q 20 60 20 70 V 100 M56 160 H 30 Q 20 160 20 150 V 120 M20 100 V 120 H 2"
                    {...dotStroke}
                  />
                  <circle cx="56" cy="60" r="5" fill={blue} />
                  <circle cx="56" cy="160" r="5" fill={blue} />
                </svg>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}
                >
                  {[
                    { i: <WhatsAppGlyph size={56} />, l: "Conversations" },
                    {
                      i: (
                        <Tile size={56} radius={28} bg={mintDeep}>
                          <Package size={30} color={blue} />
                        </Tile>
                      ),
                      l: "Orders & delivery",
                    },
                  ].map((c) => (
                    <div
                      key={c.l}
                      style={{
                        ...card,
                        padding: "18px 12px",
                        textAlign: "center",
                      }}
                    >
                      {c.i}
                      <div
                        style={{ fontSize: 17, fontWeight: 700, marginTop: 8 }}
                      >
                        {c.l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 14,
                    marginBottom: 10,
                  }}
                >
                  {[
                    ["RK", "#2a6fb0"],
                    ["AS", "#e8891a"],
                    ["PV", "#1f8a5c"],
                  ].map(([i, c]) => (
                    <Avatar key={i} initials={i} bg={c} size={70} />
                  ))}
                </div>
                <div style={{ fontSize: 16, color: sub }}>
                  A shared view. Clear responsibilities.
                </div>
              </div>
            </Reveal>
            {/* three numbered points */}
            <Reveal
              delay={0.1}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {[
                {
                  n: 1,
                  bg: blue,
                  i: <FileText size={40} color={blue} />,
                  t: "Clarity for every lead",
                  s: "Know who owns it and what comes next.",
                  spark: true,
                },
                {
                  n: 2,
                  bg: orange,
                  i: <Calendar size={40} color={orange} />,
                  t: "Consistency in follow-ups",
                  s: "Keep reminders and conversations connected.",
                },
                {
                  n: 3,
                  bg: blue,
                  i: <Package size={40} color={blue} />,
                  t: "Continuity after the sale",
                  s: "Keep orders, stock and delivery in view.",
                },
              ].map((p) => (
                <div
                  key={p.n}
                  style={{
                    ...card,
                    padding: "22px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    flex: 1,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 14,
                      left: 14,
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: p.bg,
                      color: "#fff",
                      fontSize: 15,
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {p.n}
                  </span>
                  {p.spark && (
                    <Spark
                      size={26}
                      style={{ position: "absolute", top: 12, left: 96 }}
                    />
                  )}
                  <Tile
                    size={80}
                    radius={18}
                    bg="#f3f7ff"
                    style={{ marginLeft: 30 }}
                  >
                    {p.i}
                  </Tile>
                  <div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {p.t}
                    </div>
                    <div style={{ fontSize: 16, color: sub, lineHeight: 1.45 }}>
                      {p.s}
                    </div>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
          <Bar
            title="Built to support the way your team works."
            linkLabel="Explore LeadLo features"
            href="/features"
            icon={null}
          />
        </div>
      </section>

      {/* ═══════════ 4. WHAT MAKES US DIFFERENT ═══════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <Blob size={520} top={-160} left={-240} color="rgba(26,92,255,0.10)" />
        <div
          className="mk-wrap"
          style={{ padding: "64px 48px", position: "relative" }}
        >
          <div style={{ textAlign: "center", marginBottom: 34 }}>
            <Pill>WHAT MAKES US DIFFERENT</Pill>
            <h2
              className="mk-h2"
              style={{
                fontSize: 62,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                margin: "18px 0 12px",
              }}
            >
              Built for the{" "}
              <span style={{ color: blue }}>whole sales journey.</span>
            </h2>
            <div style={{ fontSize: 20, color: sub }}>
              From the first conversation to the final delivery, your team stays
              connected.
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
                v: (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <WhatsAppGlyph size={78} />
                    <svg
                      width="46"
                      height="150"
                      viewBox="0 0 46 150"
                      aria-hidden
                    >
                      <path
                        className="flow-dots"
                        d="M2 75 H 14 Q 22 75 22 65 V 30 H 44 M2 75 H 44 M22 75 Q 22 85 22 95 V 120 H 44"
                        {...dotStroke}
                      />
                    </svg>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {[
                        ["RK", "#2a6fb0"],
                        ["AS", "#e8891a"],
                        ["PV", "#1f8a5c"],
                      ].map(([i, c]) => (
                        <Avatar key={i} initials={i} bg={c} size={50} />
                      ))}
                    </div>
                  </div>
                ),
                t: (
                  <>
                    One WhatsApp.
                    <br />
                    <span style={{ color: blue }}>Your whole team.</span>
                  </>
                ),
                s: "Multiple agents use one connected business number.",
              },
              {
                v: (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <div
                      style={{
                        ...card,
                        padding: "14px 16px",
                        textAlign: "center",
                        position: "relative",
                      }}
                    >
                      <Tile size={44} radius={22}>
                        <User size={22} />
                      </Tile>
                      <div
                        style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}
                      >
                        Assigned lead
                      </div>
                      <div
                        style={{
                          height: 5,
                          borderRadius: 3,
                          background: "#e4ebf7",
                          marginTop: 6,
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: -12,
                          bottom: -12,
                        }}
                      >
                        <Tile size={32} radius={16} bg={blue} color="#fff">
                          <Lock size={15} />
                        </Tile>
                      </span>
                    </div>
                    <ArrowRight size={30} color={blue} strokeWidth={2.5} />
                    <Avatar initials="AS" bg="#e8891a" size={84} />
                  </div>
                ),
                t: (
                  <>
                    Every lead
                    <br />
                    <span style={{ color: blue }}>has an owner.</span>
                  </>
                ),
                s: "Agents see only their assigned contacts and chats.",
                spark: true,
              },
              {
                v: (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <Tile size={72} radius={16} bg={orangeSoft} color={orange}>
                      <Calendar size={38} />
                    </Tile>
                    <svg width="36" height="6" viewBox="0 0 36 6">
                      <path
                        className="flow-dots"
                        d="M1 3 H 35"
                        {...dotStroke}
                        strokeWidth={2}
                      />
                    </svg>
                    <Tile size={54} radius={27} bg={blue} color="#fff">
                      <Zap size={26} />
                    </Tile>
                    <svg
                      width="40"
                      height="130"
                      viewBox="0 0 40 130"
                      aria-hidden
                    >
                      <path
                        className="flow-dots"
                        d="M2 65 H 12 Q 20 65 20 55 V 22 H 38 M2 65 H 38 M20 65 Q 20 75 20 85 V 108 H 38"
                        {...dotStroke}
                      />
                    </svg>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <WhatsAppGlyph size={40} />
                      <Tile size={40} radius={20}>
                        <Mail size={18} />
                      </Tile>
                      <Tile
                        size={40}
                        radius={20}
                        bg={orangeSoft}
                        color={orange}
                      >
                        <MessageCircle size={18} />
                      </Tile>
                    </div>
                  </div>
                ),
                t: (
                  <>
                    Follow-ups that
                    <br />
                    <span style={{ color: blue }}>stay on track.</span>
                  </>
                ),
                s: "Set reminders and automate WhatsApp, email and SMS messages.",
                spark: true,
              },
              {
                v: (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <Tile size={72} radius={16} bg={orangeSoft} color={orange}>
                      <Boxes size={38} />
                    </Tile>
                    <ArrowRight size={22} color={blue} strokeWidth={2.5} />
                    <Tile size={72} radius={16} bg={mintDeep}>
                      <ClipboardList size={38} />
                    </Tile>
                    <ArrowRight size={22} color={blue} strokeWidth={2.5} />
                    <Tile size={72} radius={16} bg={orangeSoft} color={orange}>
                      <Truck size={38} />
                    </Tile>
                  </div>
                ),
                t: (
                  <>
                    The journey
                    <br />
                    <span style={{ color: blue }}>
                      continues after the sale.
                    </span>
                  </>
                ),
                s: "Manage inventory, order confirmations and courier tracking.",
              },
            ].map((c, i) => (
              <Reveal
                key={i}
                delay={i * 0.06}
                className="hover-lift"
                style={{
                  ...card,
                  background: "#f8faff",
                  padding: "30px 32px",
                  display: "flex",
                  alignItems: "center",
                  gap: 30,
                  position: "relative",
                }}
              >
                {c.spark && (
                  <Spark
                    style={{ position: "absolute", top: 20, right: 190 }}
                  />
                )}
                <div
                  style={{
                    width: 260,
                    display: "flex",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {c.v}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 800,
                      lineHeight: 1.1,
                      letterSpacing: "-0.02em",
                      marginBottom: 10,
                    }}
                  >
                    {c.t}
                  </div>
                  <div style={{ fontSize: 18, color: sub, lineHeight: 1.5 }}>
                    {c.s}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Bar
            icon={<Users2 size={30} color={blue} />}
            title="One platform. Connected responsibilities."
            linkLabel="Explore the features"
            href="/features"
          />
        </div>
      </section>

      {/* ═══════════ 5. WHO WE HELP ═══════════ */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#f8faff",
        }}
      >
        <Blob size={560} top={-200} right={-260} color="rgba(26,92,255,0.10)" />
        <div
          className="mk-wrap"
          style={{ padding: "64px 48px", position: "relative" }}
        >
          <div style={{ textAlign: "center", marginBottom: 34 }}>
            <Pill>WHO WE HELP</Pill>
            <h2
              className="mk-h2"
              style={{
                fontSize: 62,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                margin: "18px 0 12px",
              }}
            >
              For teams that sell
              <br />
              <span style={{ color: blue }}>through conversations.</span>
            </h2>
            <div style={{ fontSize: 20, color: sub }}>
              Different businesses. A shared need to keep every enquiry moving.
            </div>
          </div>
          <div
            className="mk-3col"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 24,
              marginBottom: 24,
            }}
          >
            {industries.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <Reveal
                  key={ind.title}
                  delay={(i % 3) * 0.06}
                  className="hover-lift"
                  style={{
                    ...card,
                    padding: "26px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 22,
                    position: "relative",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Tile
                      size={110}
                      radius={55}
                      bg="radial-gradient(circle at 30% 30%, #ffffff 0%, #dfe9ff 100%)"
                      color={i % 2 ? orange : blue}
                    >
                      <Icon size={48} strokeWidth={1.7} />
                    </Tile>
                    {ind.wa && (
                      <span
                        style={{ position: "absolute", top: -6, right: -6 }}
                      >
                        <WhatsAppGlyph size={34} />
                      </span>
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 23,
                        fontWeight: 800,
                        letterSpacing: "-0.01em",
                        marginBottom: 6,
                      }}
                    >
                      {ind.title}
                    </div>
                    <div style={{ fontSize: 16, color: sub, lineHeight: 1.5 }}>
                      {ind.desc}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Bar
            icon={<Users size={32} color={blue} />}
            title="Does your team work through calls and messages?"
            sub="See how LeadLo fits your workflow."
            linkLabel="Explore LeadLo"
            href="/features"
            button
          />
        </div>
      </section>

      {/* ═══════════ 6. THE COMPANY ═══════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <Blob size={620} top={-200} right={-200} />
        <Blob size={80} top={120} right={60} color="#dfe9ff" solid />
        <div
          className="mk-wrap mk-2col"
          style={{
            padding: "64px 48px 24px",
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: 56,
            alignItems: "center",
            position: "relative",
          }}
        >
          <Reveal>
            <Pill>THE COMPANY BEHIND LEADLO</Pill>
            <h2
              className="mk-h2"
              style={{
                fontSize: 66,
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: "-0.03em",
                margin: "22px 0 8px",
              }}
            >
              Built by
              <br />
              <span style={{ color: blue }}>Zalgo Infotech.</span>
            </h2>
            <div
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: ink,
                marginBottom: 20,
              }}
            >
              Practical software for everyday business.
            </div>
            <p
              style={{
                fontSize: 18,
                color: sub,
                lineHeight: 1.6,
                margin: "0 0 14px",
                maxWidth: 600,
              }}
            >
              LeadLo is a product of Zalgo Infotech Pvt. Ltd., a software
              company building websites, business applications and automation
              systems.
            </p>
            <p
              style={{
                fontSize: 18,
                color: sub,
                lineHeight: 1.6,
                margin: "0 0 26px",
                maxWidth: 600,
              }}
            >
              We created LeadLo to bring sales conversations, follow-ups and
              order operations into one connected workflow.
            </p>
            <div
              style={{
                display: "flex",
                gap: 30,
                flexWrap: "wrap",
                marginBottom: 28,
              }}
            >
              {[
                {
                  i: <Laptop size={28} color={blue} />,
                  l: (
                    <>
                      Business
                      <br />
                      software
                    </>
                  ),
                },
                {
                  i: <Settings size={28} color={orange} />,
                  l: (
                    <>
                      Workflow
                      <br />
                      automation
                    </>
                  ),
                },
                {
                  i: <Network size={28} color={blue} />,
                  l: (
                    <>
                      Connected
                      <br />
                      systems
                    </>
                  ),
                },
              ].map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    fontSize: 16,
                    fontWeight: 700,
                    lineHeight: 1.25,
                  }}
                >
                  <Tile size={62} radius={14} bg={mintDeep}>
                    {f.i}
                  </Tile>
                  {f.l}
                </div>
              ))}
            </div>
            <a
              href={COMPANY_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={cta}
            >
              Explore Zalgo Infotech <ArrowUpRight size={18} />
            </a>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 16,
                color: sub,
              }}
            >
              <Mail size={18} color={blue} /> {EMAIL}
            </div>
          </Reveal>
          <Reveal
            delay={0.12}
            style={{
              ...card,
              borderRadius: 26,
              padding: "36px 32px",
              textAlign: "center",
              boxShadow: "0 30px 70px rgba(11,31,74,0.10)",
            }}
          >
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              Zalgo Infotech Pvt. Ltd.
            </div>
            <div style={{ fontSize: 16, color: sub, marginBottom: 22 }}>
              The team behind LeadLo
            </div>
            <div
              style={{
                position: "relative",
                display: "inline-block",
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  width: 170,
                  height: 170,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${blueDeep} 0%, #0a1f4e 100%)`,
                  color: "#fff",
                  fontSize: 64,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  letterSpacing: "-0.03em",
                }}
              >
                {FOUNDER.initials}
              </span>
              <span
                style={{
                  position: "absolute",
                  right: 6,
                  bottom: 10,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: orange,
                  border: "4px solid #fff",
                }}
              />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{FOUNDER.name}</div>
            <div style={{ fontSize: 16, color: sub }}>{FOUNDER.role}</div>
            <div style={{ height: 1, background: border, margin: "22px 0" }} />
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: blue,
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}
            >
              WHY WE BUILD
            </div>
            <div
              style={{
                fontSize: 18,
                color: sub,
                lineHeight: 1.5,
                marginBottom: 22,
              }}
            >
              To make daily work clearer, connected and easier to manage.
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO}
              alt="LeadLo"
              style={{
                height: 50,
                width: "auto",
                margin: "0 auto 6px",
                display: "block",
              }}
            />
            <div style={{ fontSize: 14, color: muted }}>
              A product of Zalgo Infotech Pvt. Ltd.
            </div>
          </Reveal>
        </div>
        <div className="mk-wrap" style={{ padding: "0 48px 64px" }}>
          <Bar
            icon={<Users size={34} color={blue} />}
            title="Real business needs. Thoughtful software."
            sub="Built around the people who use it every day."
          />
        </div>
      </section>

      {/* ═══════════ 7. TRIAL CTA ═══════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div className="mk-wrap" style={{ padding: "0 48px 40px" }}>
          <div
            style={{
              background: "#f0f5ff",
              borderRadius: 28,
              padding: "52px 56px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Blob size={70} top={40} right="40%" color="#dfe9ff" solid />
            <Blob size={60} bottom={120} left={-20} color="#dfe9ff" solid />
            <Blob size={320} bottom={-160} right="38%" color="#dfe9ff" solid />
            <div
              className="mk-2col"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 0.9fr",
                gap: 48,
                alignItems: "center",
                position: "relative",
              }}
            >
              <Reveal>
                <Pill outline>15-DAY FREE TRIAL</Pill>
                <h2
                  className="mk-h2"
                  style={{
                    fontSize: 62,
                    fontWeight: 800,
                    lineHeight: 1.04,
                    letterSpacing: "-0.03em",
                    margin: "20px 0 14px",
                  }}
                >
                  See how LeadLo
                  <br />
                  <span style={{ color: blue }}>fits your team.</span>
                </h2>
                <p
                  style={{
                    fontSize: 19,
                    color: sub,
                    lineHeight: 1.5,
                    margin: "0 0 26px",
                    maxWidth: 560,
                  }}
                >
                  Bring your leads, conversations, follow-ups and orders into
                  one place. Explore your daily workflow with a 15-day free
                  trial.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    flexWrap: "wrap",
                    marginBottom: 24,
                  }}
                >
                  <a href={REGISTER_URL} style={cta}>
                    Start My Free Trial <ArrowRight size={18} />
                  </a>
                  <a href="/contact" style={ctaOutline}>
                    Talk to Our Team
                  </a>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {[
                    "One WhatsApp number for your team",
                    "Assigned leads and follow-up reminders",
                    "Orders, inventory and delivery tracking",
                  ].map((t) => (
                    <div
                      key={t}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontSize: 17,
                        color: sub,
                      }}
                    >
                      <CheckBadge size={28} /> {t}
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal
                delay={0.12}
                style={{
                  ...card,
                  borderRadius: 22,
                  padding: "26px 26px 18px",
                  position: "relative",
                }}
              >
                <Spark style={{ position: "absolute", top: 70, left: 10 }} />
                <Spark style={{ position: "absolute", top: 70, right: 10 }} />
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    textAlign: "center",
                    marginBottom: 18,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Your team. One connected workspace.
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 18,
                    marginBottom: 20,
                  }}
                >
                  {[
                    ["RK", "#2a6fb0"],
                    ["AS", "#c8508c"],
                    ["PV", "#1f8a5c"],
                  ].map(([i, c]) => (
                    <Avatar
                      key={i}
                      initials={i}
                      bg={c}
                      size={90}
                      ring={mintDeep}
                    />
                  ))}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {[
                    {
                      i: (
                        <Tile size={44} radius={10} bg={blue} color="#fff">
                          <User size={22} />
                        </Tile>
                      ),
                      l: "Capture enquiries",
                    },
                    {
                      i: <WhatsAppGlyph size={44} />,
                      l: "Continue conversations",
                    },
                    {
                      i: (
                        <Tile
                          size={44}
                          radius={10}
                          bg={orangeSoft}
                          color={orange}
                        >
                          <Calendar size={22} />
                        </Tile>
                      ),
                      l: "Plan the next follow-up",
                    },
                    {
                      i: (
                        <Tile size={44} radius={10} bg={mintDeep}>
                          <Truck size={22} />
                        </Tile>
                      ),
                      l: "Manage orders & delivery",
                    },
                  ].map((r, i, arr) => (
                    <div key={r.l} style={{ position: "relative" }}>
                      <div
                        style={{
                          ...card,
                          background: "#f8faff",
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                        }}
                      >
                        {r.i}
                        <span
                          style={{ flex: 1, fontSize: 17, fontWeight: 700 }}
                        >
                          {r.l}
                        </span>
                        <CheckBadge size={26} />
                      </div>
                      {i < arr.length - 1 && (
                        <svg
                          width="4"
                          height="10"
                          viewBox="0 0 4 10"
                          style={{
                            position: "absolute",
                            left: 37,
                            bottom: -10,
                          }}
                          aria-hidden
                        >
                          <path
                            className="flow-dots"
                            d="M2 0 V 10"
                            {...dotStroke}
                            strokeWidth={2}
                          />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    color: muted,
                    marginTop: 14,
                  }}
                >
                  Illustrative workflow
                </div>
              </Reveal>
            </div>
          </div>
          <div
            style={{
              ...card,
              marginTop: 24,
              padding: "22px 32px",
              display: "flex",
              alignItems: "center",
              gap: 26,
              flexWrap: "wrap",
            }}
          >
            <Tile size={64} radius={32}>
              <Mail size={28} />
            </Tile>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                Have a question before you start?
              </div>
              <div style={{ fontSize: 17, color: sub }}>
                Tell us about your team and workflow.
              </div>
            </div>
            <a href={`mailto:${EMAIL}`} style={cta}>
              {EMAIL} <ArrowRight size={18} />
            </a>
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: 14,
              color: muted,
              marginTop: 18,
            }}
          >
            LeadLo — A product of Zalgo Infotech Pvt. Ltd.
          </div>
        </div>
      </section>

      <MarketingFooter />
      <MarketingStyles />
      <style>{`
        .flow-dots { animation: flowDots .9s linear infinite; }
        @keyframes flowDots { to { stroke-dashoffset: -16; } }
        .hover-lift:hover { border-color: ${blue} !important; box-shadow: 0 22px 44px rgba(26,92,255,0.12); }
        .mk-page a[href^="/register"], .mk-page a[href^="/contact"], .mk-page a[href^="/features"], .mk-page a[href^="http"], .mk-page a[href^="mailto"] { transition: transform .2s ease, box-shadow .2s ease, filter .2s ease; }
        .mk-page a[href^="/register"]:hover, .mk-page a[href^="/features"]:hover { transform: translateY(-2px); filter: brightness(1.04); }
        html { scroll-behavior: smooth; }
        @media (max-width: 1100px) { .mk-h1 { font-size: 52px !important; } .mk-h2 { font-size: 44px !important; } .mk-strip-item { border-left: none !important; padding: 8px 18px !important; } }
        @media (max-width: 860px) {
          .mk-wrap { padding-left: 24px !important; padding-right: 24px !important; }
          .mk-2col { grid-template-columns: 1fr !important; gap: 32px !important; }
          .mk-3col { grid-template-columns: 1fr !important; }
          .mk-hero-visual { display: none; }
          .mk-h1 { font-size: 42px !important; } .mk-h2 { font-size: 36px !important; }
        }
      `}</style>
    </div>
  );
}
