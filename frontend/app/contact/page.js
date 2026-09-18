"use client";
import { useState } from "react";
import axios from "axios";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Plus,
  Minus,
  MessageCircle,
  Headphones,
  Users2,
} from "lucide-react";
import { ink, sub, muted, border } from "../../lib/marketing-theme";
import { poppins } from "../../lib/marketing-font";
import { WhatsAppGlyph } from "../../components/BrandIcons";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";
import MarketingStyles from "../../components/MarketingStyles";
import Reveal from "../../components/Reveal";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/* ─────────── contact details — edit here ─────────── */
const EMAIL = "sales@zalgoinfotech.com";
const PHONE_DISPLAY = "+91 92442 13326";
const PHONE_TEL = "+919244213326";
const WHATSAPP_URL = `https://wa.me/${PHONE_TEL.replace("+", "")}`;
const ADDRESS = ""; // e.g. "12, MG Road, Indore, MP 452001" — map + directions appear once set
const HOURS = ""; // e.g. "Mon–Sat, 10:00 AM – 7:00 PM IST"
const MAPS_URL = ADDRESS
  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`
  : "";
const MAP_EMBED = ADDRESS
  ? `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`
  : "";

const ENQUIRY_TYPES = [
  "Free trial / demo",
  "Pricing & plans",
  "WhatsApp or courier integration",
  "Existing account support",
  "Partnership",
  "Other",
];

/* ─────────── LeadLo tokens ─────────── */
const blue = "#1a5cff";
const blueDeep = "#0f47d6";
const orange = "#f59a23";
const mint = "#eef4ff";
const mintDeep = "#dfe9ff";
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
  fontFamily: "inherit",
};
const card = {
  background: "#fff",
  border: `1px solid ${border}`,
  borderRadius: 16,
};
const inp = {
  width: "100%",
  padding: "15px 18px",
  border: `1px solid ${border}`,
  borderRadius: 12,
  fontSize: 16,
  color: ink,
  outline: "none",
  fontFamily: "inherit",
  background: "#fff",
  boxSizing: "border-box",
};
const lbl = {
  display: "block",
  fontSize: 15,
  fontWeight: 700,
  color: ink,
  marginBottom: 8,
};
const Req = () => <span style={{ color: "#e5484d" }}> *</span>;

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
function Pill({ children }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: mintDeep,
        color: blue,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "0.06em",
        borderRadius: 24,
        padding: "10px 22px",
        border: `1px solid #c9d8ff`,
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

const faqs = [
  {
    q: "How do I start the 15-day free trial?",
    a: "Click Start Free Trial and sign up to explore LeadLo. Contact our team if you need help getting started.",
  },
  {
    q: "Can I request a demo for my team?",
    a: 'Yes. Send an enquiry with "Free trial / demo" as the type and a good time to reach you — we\'ll walk your team through LeadLo.',
  },
  {
    q: "What details should I share in my enquiry?",
    a: "Your team size, the channels you get leads from (Meta, WhatsApp, calls), and whether you manage orders or deliveries. That helps us point you to the right plan.",
  },
  {
    q: "Who should I contact for pricing questions?",
    a: `Email ${EMAIL} or call/WhatsApp ${PHONE_DISPLAY}. We'll confirm plan details and any applicable charges before you start.`,
  },
  {
    q: "How can I get help with my existing account?",
    a: "Reach us on the same email or phone with your registered email address, and our team will help you directly.",
  },
  {
    q: "Can we discuss WhatsApp or courier integrations?",
    a: "Yes. Tell us which WhatsApp number and courier partner you use, and we'll explain how the integration works for your workflow.",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    type: "",
    message: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(0);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.type ||
      !form.message.trim()
    ) {
      setError("Name, work email, enquiry type and message are required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await axios.post(`${BASE}/contact`, { ...form, source: "contact-page" });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again in a moment.");
    }
    setSaving(false);
  };

  return (
    <div
      className={`${poppins.className} mk-page`}
      style={{ background: "#fff", color: ink }}
    >
      <MarketingNav ctaLabel="Start Free Trial" />

      {/* ═══════════ 1. HERO + FORM ═══════════ */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#f4f8ff",
        }}
      >
        <Blob size={620} top={-260} right={-200} />
        <Blob size={480} bottom={-240} left={-200} />
        <Blob size={90} top={130} left="42%" color="#dfe9ff" solid />
        <Blob size={140} top={60} right={-30} color="#dfe9ff" solid />
        <Blob size={60} bottom={190} left="44%" color="#dfe9ff" solid />
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
            <Pill>CONTACT US</Pill>
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
              Let's talk about
              <br />
              <span style={{ color: blue }}>
                your team's
                <br />
                next step.
              </span>
            </h1>
            <p
              style={{
                fontSize: 21,
                color: sub,
                lineHeight: 1.5,
                margin: "0 0 30px",
                maxWidth: 560,
              }}
            >
              Have a question about LeadLo, pricing or a demo? Tell us what your
              team needs.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                maxWidth: 560,
              }}
            >
              <a
                href={`mailto:${EMAIL}`}
                className="ct-card"
                style={{
                  ...card,
                  border: "1px solid #c9d8ff",
                  padding: "22px 30px",
                  display: "flex",
                  alignItems: "center",
                  gap: 26,
                  textDecoration: "none",
                  color: ink,
                }}
              >
                <Tile size={64} radius={14} bg={blue} color="#fff">
                  <Mail size={30} />
                </Tile>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>Email us</div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: blue }}>
                    {EMAIL}
                  </div>
                </div>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="ct-card"
                style={{
                  ...card,
                  border: "1px solid #c9d8ff",
                  padding: "22px 30px",
                  display: "flex",
                  alignItems: "center",
                  gap: 26,
                  textDecoration: "none",
                  color: ink,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <WhatsAppGlyph size={54} />
                  <Tile size={46} radius={23} bg={blue} color="#fff">
                    <Phone size={20} />
                  </Tile>
                </span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    Call or WhatsApp
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: blue }}>
                    {PHONE_DISPLAY}
                  </div>
                </div>
              </a>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 26,
                fontSize: 15,
                color: sub,
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  background: orange,
                }}
              />{" "}
              LeadLo is a product of Zalgo Infotech Pvt. Ltd.
            </div>
          </Reveal>

          <Reveal
            delay={0.12}
            style={{
              ...card,
              borderRadius: 24,
              padding: "40px 44px",
              boxShadow: "0 30px 70px rgba(11,31,74,0.12)",
            }}
          >
            {sent ? (
              <div style={{ textAlign: "center", padding: "56px 20px" }}>
                <Tile size={84} radius={42} bg="#e4f5ec" color="#1f8a5c">
                  <CheckCircle2 size={44} />
                </Tile>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    margin: "22px 0 8px",
                  }}
                >
                  Enquiry sent!
                </div>
                <div style={{ fontSize: 17, color: sub, marginBottom: 26 }}>
                  Thanks, {form.name.split(" ")[0]}. We'll get back to you
                  within 24 hours.
                </div>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...cta,
                    background: "#25D366",
                    boxShadow: "0 12px 28px rgba(37,211,102,0.3)",
                  }}
                >
                  Chat on WhatsApp now <ArrowUpRight size={18} />
                </a>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    marginBottom: 6,
                  }}
                >
                  How can we help?
                </div>
                <div style={{ fontSize: 18, color: sub, marginBottom: 26 }}>
                  Share a few details and your question.
                </div>
                {error && (
                  <div
                    style={{
                      background: "#fdecea",
                      border: "1px solid #f4c7c3",
                      color: "#c8372f",
                      borderRadius: 10,
                      padding: "12px 16px",
                      fontSize: 15,
                      marginBottom: 18,
                    }}
                  >
                    {error}
                  </div>
                )}
                <div
                  className="mk-2col-keep"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <label style={lbl}>
                      Full name
                      <Req />
                    </label>
                    <input
                      style={inp}
                      value={form.name}
                      onChange={set("name")}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label style={lbl}>
                      Work email
                      <Req />
                    </label>
                    <input
                      style={inp}
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div
                  className="mk-2col-keep"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <label style={lbl}>Phone / WhatsApp</label>
                    <input
                      style={inp}
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="Include country code"
                      autoComplete="tel"
                    />
                  </div>
                  <div>
                    <label style={lbl}>Company name</label>
                    <input
                      style={inp}
                      value={form.company}
                      onChange={set("company")}
                      placeholder="Your company"
                      autoComplete="organization"
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 20, position: "relative" }}>
                  <label style={lbl}>
                    Enquiry type
                    <Req />
                  </label>
                  <select
                    value={form.type}
                    onChange={set("type")}
                    style={{
                      ...inp,
                      appearance: "none",
                      WebkitAppearance: "none",
                      paddingRight: 48,
                      color: form.type ? ink : muted,
                      cursor: "pointer",
                    }}
                  >
                    <option value="" disabled>
                      Select an option
                    </option>
                    {ENQUIRY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={22}
                    color={blue}
                    style={{
                      position: "absolute",
                      right: 16,
                      bottom: 15,
                      pointerEvents: "none",
                    }}
                  />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={lbl}>
                    Your message
                    <Req />
                  </label>
                  <textarea
                    style={{ ...inp, resize: "vertical", minHeight: 120 }}
                    rows={4}
                    value={form.message}
                    onChange={set("message")}
                    placeholder="Tell us about your team or question..."
                  />
                </div>
                <div style={{ fontSize: 13.5, color: muted, marginBottom: 20 }}>
                  We'll use these details to respond to your enquiry.
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...cta,
                    width: "100%",
                    padding: "18px",
                    fontSize: 18,
                    opacity: saving ? 0.7 : 1,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Sending..." : "Send My Enquiry"}{" "}
                  {saving ? <Send size={18} /> : <ArrowRight size={18} />}
                </button>
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 14,
                    color: sub,
                    marginTop: 16,
                  }}
                >
                  Please review our{" "}
                  <a href="/privacy" style={{ color: blue, fontWeight: 600 }}>
                    Privacy Policy.
                  </a>
                </div>
              </form>
            )}
          </Reveal>
        </div>
      </section>

      {/* ═══════════ 2. COMPANY + MAP ═══════════ */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#f8faff",
        }}
      >
        <Blob size={420} top={140} left={-180} color="#dfe9ff" solid />
        <Blob size={420} top={140} right={-180} color="#dfe9ff" solid />
        <Blob size={50} top={110} left="16%" color="#dfe9ff" solid />
        <Blob size={50} top={90} right="20%" color="#dfe9ff" solid />
        <div
          className="mk-wrap"
          style={{ padding: "64px 48px 48px", position: "relative" }}
        >
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <Pill>THE COMPANY BEHIND LEADLO</Pill>
            <h2
              className="mk-h2"
              style={{
                fontSize: 62,
                fontWeight: 800,
                lineHeight: 1.06,
                letterSpacing: "-0.03em",
                margin: "18px 0 8px",
              }}
            >
              Let's <span style={{ color: blue }}>connect.</span>
            </h2>
            <div style={{ fontSize: 21, color: sub }}>
              Reach the team at Zalgo Infotech Pvt. Ltd.
            </div>
          </div>

          <div
            className="mk-2col"
            style={{
              display: "grid",
              gridTemplateColumns: "0.9fr 1.1fr",
              gap: 24,
              alignItems: "stretch",
            }}
          >
            <Reveal style={{ ...card, borderRadius: 24, padding: "36px 40px" }}>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                Zalgo Infotech Pvt. Ltd.
              </div>
              <div style={{ fontSize: 18, color: sub, marginBottom: 22 }}>
                The company behind LeadLo CRM
              </div>
              {[
                {
                  icon: <MapPin size={26} color={orange} />,
                  bg: "#fff1dd",
                  t: "Office address",
                  v: ADDRESS || "[Add your company address]",
                },
                {
                  icon: <Clock size={26} />,
                  t: "Working hours",
                  v: HOURS || "[Add working days and hours]",
                },
                {
                  icon: <Mail size={26} />,
                  t: "Email our team",
                  v: EMAIL,
                  href: `mailto:${EMAIL}`,
                },
              ].map((r) => (
                <div
                  key={r.t}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 22,
                    padding: "18px 0",
                    borderBottom: `1px solid ${border}`,
                  }}
                >
                  <Tile size={64} radius={32} bg={r.bg || mintDeep}>
                    {r.icon}
                  </Tile>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{r.t}</div>
                    {r.href ? (
                      <a
                        href={r.href}
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: blue,
                          textDecoration: "none",
                        }}
                      >
                        {r.v}
                      </a>
                    ) : (
                      <div style={{ fontSize: 18, color: sub }}>{r.v}</div>
                    )}
                  </div>
                </div>
              ))}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  padding: "22px 0 4px",
                  textDecoration: "none",
                  color: ink,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <WhatsAppGlyph size={54} />
                  <Tile size={46} radius={23} bg={blue} color="#fff">
                    <Phone size={20} />
                  </Tile>
                </span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    Call or WhatsApp
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: blue }}>
                    {PHONE_DISPLAY}
                  </div>
                </div>
              </a>
            </Reveal>

            <Reveal
              delay={0.12}
              style={{
                ...card,
                borderRadius: 24,
                padding: 18,
                minHeight: 440,
                display: "flex",
              }}
            >
              {MAP_EMBED ? (
                <iframe
                  title="Office location"
                  src={MAP_EMBED}
                  style={{
                    flex: 1,
                    border: 0,
                    borderRadius: 16,
                    minHeight: 420,
                  }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div
                  className="ct-map"
                  style={{
                    flex: 1,
                    borderRadius: 16,
                    background: "#e9f0ff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: 32,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <MapPin
                    size={54}
                    color={orange}
                    fill={orange}
                    strokeWidth={1.5}
                    style={{ marginBottom: 8, position: "relative" }}
                  />
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      position: "relative",
                    }}
                  >
                    Office location
                  </div>
                  <div
                    style={{
                      fontSize: 17,
                      color: sub,
                      marginBottom: 22,
                      position: "relative",
                    }}
                  >
                    Map will appear here once the address is added.
                  </div>
                  <span
                    style={{
                      ...cta,
                      background: "#fff",
                      color: blue,
                      border: `1.5px solid ${blue}`,
                      boxShadow: "none",
                      padding: "13px 26px",
                      fontSize: 16,
                      position: "relative",
                      cursor: "default",
                    }}
                  >
                    Get Directions <ArrowUpRight size={17} />
                  </span>
                  <div
                    style={{
                      fontSize: 14,
                      color: muted,
                      marginTop: 12,
                      position: "relative",
                    }}
                  >
                    Available after location setup.
                  </div>
                </div>
              )}
            </Reveal>
          </div>

          <div
            style={{
              ...card,
              marginTop: 24,
              padding: "20px 30px",
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <Tile size={56} radius={28}>
              <Users2 size={26} />
            </Tile>
            <span style={{ width: 1, height: 44, background: border }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                Prefer to connect online?
              </div>
              <div style={{ fontSize: 16, color: sub }}>
                Email or WhatsApp us about your team's needs.
              </div>
            </div>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={cta}
            >
              Contact Our Team <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ 3. FAQ ═══════════ */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#f4f8ff",
        }}
      >
        <Blob size={100} top={110} left={40} color="#dfe9ff" solid />
        <Blob size={150} top={90} left="30%" color="#dfe9ff" solid />
        <Blob size={200} bottom={120} left={-90} color="#dfe9ff" solid />
        <Blob size={160} top={60} right={-60} color="#dfe9ff" solid />
        <div
          className="mk-wrap mk-2col"
          style={{
            padding: "64px 48px 40px",
            display: "grid",
            gridTemplateColumns: "0.72fr 1.28fr",
            gap: 40,
            position: "relative",
            alignItems: "start",
          }}
        >
          <Reveal style={{ position: "relative" }}>
            <Spark style={{ position: "absolute", top: 60, left: 330 }} />
            <Pill>QUICK ANSWERS</Pill>
            <h2
              className="mk-h2"
              style={{
                fontSize: 62,
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: "-0.03em",
                margin: "22px 0 18px",
              }}
            >
              Before you
              <br />
              <span style={{ color: blue }}>reach out.</span>
            </h2>
            <p
              style={{
                fontSize: 20,
                color: sub,
                lineHeight: 1.5,
                margin: "0 0 30px",
                maxWidth: 400,
              }}
            >
              A few helpful answers about trials, demos and getting in touch.
            </p>
            <div
              style={{
                background: mintDeep,
                borderRadius: 20,
                padding: 28,
                display: "flex",
                gap: 22,
                alignItems: "center",
              }}
            >
              <Tile size={84} radius={42} bg="#fff">
                <MessageCircle size={40} />
              </Tile>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>
                  Still have a question?
                </div>
                <div style={{ fontSize: 17, color: sub, marginBottom: 6 }}>
                  Tell us what your team needs.
                </div>
                <a
                  href={`mailto:${EMAIL}`}
                  style={{
                    color: blue,
                    fontWeight: 700,
                    fontSize: 18,
                    textDecoration: "none",
                  }}
                >
                  {EMAIL}
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal
            delay={0.1}
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              border: `1px solid ${border}`,
            }}
          >
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={f.q}
                  style={{
                    ...card,
                    background: isOpen ? mint : "#fff",
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
                    <span style={{ fontSize: 21, fontWeight: 700, color: ink }}>
                      {f.q}
                    </span>
                    <Tile
                      size={40}
                      radius={20}
                      bg={isOpen ? blue : mintDeep}
                      color={isOpen ? "#fff" : blue}
                    >
                      {isOpen ? (
                        <Minus size={20} strokeWidth={3} />
                      ) : (
                        <Plus size={20} strokeWidth={3} />
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
                        fontSize: 17,
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
        <div
          className="mk-wrap"
          style={{ padding: "0 48px 56px", position: "relative" }}
        >
          <div
            style={{
              ...card,
              padding: "20px 30px",
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <Tile size={64} radius={32}>
              <Headphones size={30} />
            </Tile>
            <span style={{ width: 1, height: 44, background: border }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 19, fontWeight: 700 }}>
                Prefer a quick conversation?
              </div>
              <div style={{ fontSize: 17, color: sub }}>
                Call or WhatsApp us on{" "}
                <a
                  href={`tel:${PHONE_TEL}`}
                  style={{
                    color: blue,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  {PHONE_DISPLAY}
                </a>
              </div>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={cta}
            >
              Talk to Our Team <ArrowRight size={18} />
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

      {/* ═══════════ 4. CTA BAR ═══════════ */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "40px 48px 48px",
        }}
      >
        <Blob size={120} top={-40} left={-30} color="#dfe9ff" solid />
        <Spark style={{ position: "absolute", top: 20, right: 70 }} />
        <div
          className="mk-wrap"
          style={{
            background: mint,
            borderRadius: 28,
            padding: "30px 40px",
            display: "flex",
            alignItems: "center",
            gap: 30,
            flexWrap: "wrap",
            position: "relative",
          }}
        >
          <Spark style={{ position: "absolute", top: 12, left: 118 }} />
          <div
            style={{
              position: "relative",
              width: 110,
              height: 110,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: mintDeep,
              }}
            />
            <Tile size={62} radius={31} bg={blue} color="#fff">
              <MessageCircle size={30} />
            </Tile>
            <span style={{ position: "absolute", right: 6, bottom: 8 }}>
              <Tile size={40} radius={20} bg={orange} color="#fff">
                <MessageCircle size={20} />
              </Tile>
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              Let's talk about your team's workflow.
            </div>
            <div style={{ fontSize: 20, color: sub, marginTop: 6 }}>
              Questions about LeadLo? Get in touch with our team.
            </div>
          </div>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{ ...cta, padding: "20px 34px", fontSize: 19 }}
          >
            Send an Enquiry <ArrowRight size={20} />
          </a>
        </div>
      </section>

      <MarketingFooter />
      <MarketingStyles />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .mk-page input:focus, .mk-page select:focus, .mk-page textarea:focus { border-color: ${blue} !important; box-shadow: 0 0 0 4px ${blueSoft}; }
        .mk-page input::placeholder, .mk-page textarea::placeholder { color: ${muted}; }
        .ct-card { transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .ct-card:hover { transform: translateY(-2px); border-color: ${blue} !important; box-shadow: 0 16px 34px rgba(26,92,255,0.12); }
        .mk-page a[href^="http"], .mk-page a[href="#top"], .mk-page button[type="submit"] { transition: transform .2s ease, box-shadow .2s ease, filter .2s ease; }
        .mk-page a[href="#top"]:hover, .mk-page button[type="submit"]:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.04); }
        .ct-map::before { content: ""; position: absolute; inset: 0; opacity: .5; background-image:
          linear-gradient(rgba(26,92,255,0.08) 2px, transparent 2px), linear-gradient(90deg, rgba(26,92,255,0.08) 2px, transparent 2px);
          background-size: 84px 84px; transform: rotate(-12deg) scale(1.4); }
        html { scroll-behavior: smooth; }
        @media (max-width: 1100px) { .mk-h1 { font-size: 52px !important; } .mk-h2 { font-size: 44px !important; } }
        @media (max-width: 860px) {
          .mk-wrap { padding-left: 24px !important; padding-right: 24px !important; }
          .mk-2col { grid-template-columns: 1fr !important; gap: 32px !important; }
          .mk-h1 { font-size: 42px !important; } .mk-h2 { font-size: 36px !important; }
        }
        @media (max-width: 560px) { .mk-2col-keep { grid-template-columns: 1fr !important; } }
      `,
        }}
      />
    </div>
  );
}
