"use client";
import { Users, MessageCircle, Truck, Zap, MapPin, Mail, Target, ShieldCheck, Heart, Rocket } from "lucide-react";
import { ink, sub, muted, border } from "../../lib/marketing-theme";
import { poppins } from "../../lib/marketing-font";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";
import MarketingStyles from "../../components/MarketingStyles";
import Reveal from "../../components/Reveal";
import SectionHeading from "../../components/SectionHeading";
import AnimatedDots from "../../components/AnimatedDots";

/* ─────────────── LeadLo tokens (same as pricing & help-center) ─────────────── */
const blue = "#1a5cff";
const blueDeep = "#0f47d6";
const orange = "#f59a23";
const mint = "#eef4ff";
const mintDeep = "#dfe9ff";

const cta = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  background: `linear-gradient(180deg, ${blue} 0%, ${blueDeep} 100%)`,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "15px 26px",
  fontSize: 15,
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(26,92,255,0.28)",
  whiteSpace: "nowrap",
  fontFamily: "inherit",
};

const WHAT_WE_DO = [
  { icon: Users, title: "Lead capture", text: "Every enquiry — Meta Ads, WhatsApp, Sheets, or manual — lands in one pipeline." },
  { icon: MessageCircle, title: "WhatsApp, shared", text: "One business number, your whole team replying from one connected inbox." },
  { icon: Truck, title: "Orders & delivery", text: "Fulfillment, inventory, and courier tracking in the same place you manage leads." },
  { icon: Zap, title: "Automation", text: "Follow-ups and updates that send themselves, so nothing slips through." },
];

const VALUES = [
  {
    icon: Target,
    title: "Built from the field, not a spec sheet",
    text: "LeadLo started from watching telecalling and sales teams actually work — juggling spreadsheets, missed WhatsApp replies, and no visibility into who followed up on what. Every module answers a real gap we saw, not a feature we thought sounded good.",
  },
  {
    icon: ShieldCheck,
    title: "Your data stays yours",
    text: "Leads, conversations, and orders live in your own workspace. We don't sell data, and WhatsApp messages send through your own connected number — never a shared one.",
  },
  {
    icon: Heart,
    title: "Support that picks up the phone",
    text: "You're talking to the people who build the product, not a ticket queue. If something's confusing, we'd rather fix the product than write another FAQ.",
  },
];

export default function AboutPage() {
  return (
    <div className={`${poppins.className} mk-page`} style={{ background: "#fff", color: ink }}>
      <MarketingNav />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div style={{ position: "relative", overflow: "hidden", background: `linear-gradient(180deg, ${mint} 0%, #ffffff 100%)` }}>
        <AnimatedDots
          width={220}
          height={220}
          color="rgba(26,92,255,0.16)"
          style={{ position: "absolute", top: 40, right: -40, pointerEvents: "none" }}
        />
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "72px 24px 64px", textAlign: "center", position: "relative" }}>
          <Reveal>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#fff",
                border: `1px solid ${border}`,
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12.5,
                fontWeight: 700,
                color: blue,
                marginBottom: 20,
              }}
            >
              <Rocket size={13} /> ABOUT LEADLO
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.18, letterSpacing: "-0.02em", marginBottom: 18 }}>
              Built for teams who live in <span style={{ color: blue }}>WhatsApp</span> and spreadsheets — not enterprise software.
            </h1>
            <p style={{ fontSize: 16, color: sub, lineHeight: 1.65, maxWidth: 600, margin: "0 auto" }}>
              LeadLo is a lead, WhatsApp, and order management platform built by Zalgo Infotech for sales and
              telecalling teams who need one connected workflow, not five disconnected tools.
            </p>
          </Reveal>
        </div>
      </div>

      {/* ── Our story ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }} className="mk-2col">
          <Reveal>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: blue, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
              Our story
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 16, lineHeight: 1.3 }}>
              We kept seeing the same problem.
            </h2>
            <p style={{ fontSize: 15, color: sub, lineHeight: 1.75, marginBottom: 14 }}>
              A lead comes in on WhatsApp. Someone replies from a personal phone. Another teammate has no idea it
              happened. Follow-ups get tracked in a spreadsheet that's always a day out of date. By the time an
              order ships, nobody can say for certain who talked to that customer, or when.
            </p>
            <p style={{ fontSize: 15, color: sub, lineHeight: 1.75 }}>
              LeadLo exists to close that gap — one shared WhatsApp inbox, one lead pipeline, one place to fulfill
              and track an order, built specifically for teams selling over calls and chat, not enterprise sales
              floors.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {WHAT_WE_DO.map((w) => {
                const Icon = w.icon;
                return (
                  <div
                    key={w.title}
                    className="hover-lift"
                    style={{
                      border: `1px solid ${border}`,
                      borderRadius: 14,
                      padding: "20px 18px",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: mintDeep,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 14,
                      }}
                    >
                      <Icon size={17} color={blue} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{w.title}</div>
                    <div style={{ fontSize: 12.5, color: muted, lineHeight: 1.55 }}>{w.text}</div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── Values ────────────────────────────────────────────── */}
      <div style={{ background: mint, padding: "72px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <SectionHeading eyebrow="What we believe" subtitle="A short list, kept short on purpose.">
            What we stand for
          </SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 20 }} className="mk-3col">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title} delay={i * 0.08}>
                  <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 16, padding: "26px 24px", height: "100%" }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 11,
                        background: mintDeep,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 16,
                      }}
                    >
                      <Icon size={19} color={blue} />
                    </div>
                    <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 10 }}>{v.title}</div>
                    <div style={{ fontSize: 13.5, color: sub, lineHeight: 1.65 }}>{v.text}</div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Company info ──────────────────────────────────────── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 24px" }}>
        <Reveal
          style={{
            border: `1px solid ${border}`,
            borderRadius: 18,
            padding: "36px 40px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              A product of
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Zalgo Infotech Pvt. Ltd.</div>
            <div style={{ fontSize: 13.5, color: sub }}>Building LeadLo out of Gwalior, Madhya Pradesh.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a href="mailto:sales@zalgoinfotech.com" style={{ display: "flex", alignItems: "center", gap: 10, color: ink, textDecoration: "none", fontSize: 14 }}>
              <Mail size={16} color={blue} /> sales@zalgoinfotech.com
            </a>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, color: sub, fontSize: 13.5, maxWidth: 320 }}>
              <MapPin size={16} color={blue} style={{ flexShrink: 0, marginTop: 2 }} />
              1/65, Vinay Nagar Sec 3, 100 Feet Road, S. P. Ashram, Gwalior, Madhya Pradesh, India - 474012
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${blueDeep} 0%, #0a1f4e 100%)`, padding: "64px 24px", textAlign: "center" }}>
        <Reveal>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 14 }}>Want to see it running on your leads?</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
            Start your 15-day free trial, or talk to us first if you'd rather see a walkthrough.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://lead-management.zalgostore.com/register" style={cta}>
              Start Your Free Trial
            </a>
            <a
              href="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "15px 26px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Get in Touch
            </a>
          </div>
        </Reveal>
      </div>

      <MarketingFooter />
      <MarketingStyles />
    </div>
  );
}
