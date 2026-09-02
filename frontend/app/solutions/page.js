"use client";
import { useRouter } from "next/navigation";
import { Phone, TrendingUp, GraduationCap, ShoppingBag, Download, UserPlus, Send, Target, ArrowRight, CheckCircle2 } from "lucide-react";
import { teal, ink, sub, border } from "../../lib/marketing-theme";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";
import SectionHeading from "../../components/SectionHeading";
import Reveal from "../../components/Reveal";
import LeadsMockup from "../../components/mockups/LeadsMockup";

const AUDIENCES = [
  {
    icon: <Phone size={24} color={teal} />,
    title: "Telecalling Teams",
    desc: "Every incoming call, every missed call, every callback — logged and assigned automatically so no lead falls through the cracks, even on your busiest day.",
    points: ["Auto-log calls & missed calls", "Instant assignment to a rep", "Follow-up reminders that actually fire"],
  },
  {
    icon: <TrendingUp size={24} color={teal} />,
    title: "Sales Teams",
    desc: "See your entire pipeline at a glance, track who's closing what, and automate the follow-ups your reps keep forgetting to send.",
    points: ["Custom pipeline stages", "Per-rep performance visibility", "Automated nudges on stale leads"],
  },
  {
    icon: <GraduationCap size={24} color={teal} />,
    title: "Coaching & Education Institutes",
    desc: "Capture enquiries from every channel, nurture them with automated WhatsApp/email sequences, and convert more admissions without hiring more counsellors.",
    points: ["Multi-channel enquiry capture", "Automated nurture sequences", "Track enquiry → admission conversion"],
  },
  {
    icon: <ShoppingBag size={24} color={teal} />,
    title: "D2C & E-commerce Brands",
    desc: "Manage orders, track inventory, auto-create courier shipments, and follow up on COD collections — all without leaving the CRM.",
    points: ["Inventory synced to orders", "One-click courier shipment", "COD balance-due tracking"],
  },
];

const steps = [
  { icon: <Download size={22} color="#fff" />, title: "Capture", desc: "Leads from every connected channel land automatically, tagged with their source." },
  { icon: <UserPlus size={22} color="#fff" />, title: "Assign", desc: "Routed to the right rep instantly — nothing sits in a shared inbox unowned." },
  { icon: <Send size={22} color="#fff" />, title: "Automate", desc: "An automated first message goes out in seconds, then reminders keep it moving." },
  { icon: <Target size={22} color="#fff" />, title: "Convert", desc: "Fulfil the order and track it straight through to a happy, repeat customer." },
];

export default function SolutionsPage() {
  const router = useRouter();
  return (
    <div style={{ background: "#fff", color: ink, fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" }}>
      <MarketingNav />

      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: -100,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 380,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,168,173,0.12) 0%, rgba(0,168,173,0) 70%)",
            pointerEvents: "none",
          }}
        />
        <Reveal style={{ maxWidth: 900, margin: "0 auto", padding: "72px 48px 24px", textAlign: "center", position: "relative" }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 }}>
            Built for <span style={{ color: teal }}>Telecalling &amp; Sales Teams</span>
          </h1>
          <p style={{ fontSize: 16, color: sub, maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
            Whatever your business — calling leads all day, running a D2C brand, or filling admission seats — Zalgo
            CRM adapts to how your team actually works, not the other way around.
          </p>
        </Reveal>

        <Reveal delay={0.15} style={{ maxWidth: 940, margin: "36px auto 0", padding: "0 48px" }}>
          <LeadsMockup />
        </Reveal>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "88px 48px 40px" }}>
        <SectionHeading subtitle="Four kinds of teams lean on Zalgo CRM every day — here's exactly what it does for each.">
          Who It&apos;s <span style={{ color: teal }}>Built For</span>
        </SectionHeading>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
          {AUDIENCES.map((a, i) => (
            <Reveal key={a.title} delay={(i % 2) * 0.1} style={{ border: `1px solid ${border}`, borderRadius: 14, padding: "28px 26px" }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "rgba(0,134,138,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {a.icon}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: sub, lineHeight: 1.55 }}>{a.desc}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 64 }}>
                {a.points.map((p) => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: sub }}>
                    <CheckCircle2 size={14} color={teal} style={{ flexShrink: 0 }} />
                    {p}
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "56px 48px 96px" }}>
        <SectionHeading subtitle="Four steps, start to finish — every lead follows the same reliable path from the moment it lands to a converted customer.">
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

      <Reveal as="div" style={{ padding: "0 48px 80px" }}>
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
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Find the right fit for your team</div>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.8)" }}>Talk to us about your specific workflow.</div>
          </div>
          <button
            onClick={() => router.push("/contact")}
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
              whiteSpace: "nowrap",
            }}
          >
            Talk to Us <ArrowRight size={15} />
          </button>
        </div>
      </Reveal>

      <MarketingFooter />
    </div>
  );
}
