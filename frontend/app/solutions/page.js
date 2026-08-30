"use client";
import { useRouter } from "next/navigation";
import { Phone, TrendingUp, GraduationCap, ShoppingBag, Download, UserPlus, Send, Target, ArrowRight } from "lucide-react";
import { teal, ink, sub, border } from "../../lib/marketing-theme";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";
import SectionHeading from "../../components/SectionHeading";

const AUDIENCES = [
  {
    icon: <Phone size={24} color={teal} />,
    title: "Telecalling Teams",
    desc: "Every incoming call, every missed call, every callback — logged and assigned automatically so no lead falls through the cracks.",
  },
  {
    icon: <TrendingUp size={24} color={teal} />,
    title: "Sales Teams",
    desc: "See your entire pipeline at a glance, track who's closing what, and automate the follow-ups your reps keep forgetting to send.",
  },
  {
    icon: <GraduationCap size={24} color={teal} />,
    title: "Coaching & Education Institutes",
    desc: "Capture enquiries from every channel, nurture them with automated WhatsApp/email sequences, and convert more admissions.",
  },
  {
    icon: <ShoppingBag size={24} color={teal} />,
    title: "D2C & E-commerce Brands",
    desc: "Manage orders, track inventory, auto-create courier shipments, and follow up on COD collections — all in one place.",
  },
];

const steps = [
  { icon: <Download size={22} color="#fff" />, title: "Capture", desc: "Leads from multiple channels in real-time." },
  { icon: <UserPlus size={22} color="#fff" />, title: "Assign", desc: "Auto-assign leads to the right representative." },
  { icon: <Send size={22} color="#fff" />, title: "Automate", desc: "Engage instantly with automated messages & reminders." },
  { icon: <Target size={22} color="#fff" />, title: "Convert", desc: "Track progress and close more deals." },
];

export default function SolutionsPage() {
  const router = useRouter();
  return (
    <div style={{ background: "#fff", color: ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <MarketingNav />

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 48px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 14 }}>
          Built for <span style={{ color: teal }}>Telecalling & Sales Teams</span>
        </h1>
        <p style={{ fontSize: 16, color: sub, maxWidth: 600, margin: "0 auto" }}>
          Whatever your business, Zalgo CRM adapts to how your team actually works — not the other way around.
        </p>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "48px 48px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
          {AUDIENCES.map((a) => (
            <div key={a.title} style={{ border: `1px solid ${border}`, borderRadius: 14, padding: "26px 24px", display: "flex", gap: 16 }}>
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
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "56px 48px 96px" }}>
        <SectionHeading>
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
            <div key={s.title} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
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
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 48px 80px" }}>
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
      </div>

      <MarketingFooter />
    </div>
  );
}
