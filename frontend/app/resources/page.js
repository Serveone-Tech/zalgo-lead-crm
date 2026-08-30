"use client";
import { useRouter } from "next/navigation";
import { Rocket, BookOpen, HelpCircle, ArrowRight } from "lucide-react";
import { teal, ink, sub, border } from "../../lib/marketing-theme";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";

const RESOURCES = [
  {
    icon: <Rocket size={22} color={teal} />,
    title: "Getting Started Guide",
    desc: "Set up your account, connect your first lead source, and log your first order — a walkthrough of the essentials.",
  },
  {
    icon: <BookOpen size={22} color={teal} />,
    title: "Best Practices for Lead Follow-up",
    desc: "How fast should you respond to a new lead? What should your automated messages say? Practical tips from real usage.",
  },
  {
    icon: <HelpCircle size={22} color={teal} />,
    title: "Frequently Asked Questions",
    desc: "Common questions about plans, integrations, and how billing works — answered directly.",
  },
];

export default function ResourcesPage() {
  const router = useRouter();
  return (
    <div style={{ background: "#fff", color: ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <MarketingNav />

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 48px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 14 }}>
          Resources &amp; <span style={{ color: teal }}>Guides</span>
        </h1>
        <p style={{ fontSize: 16, color: sub, maxWidth: 560, margin: "0 auto" }}>
          Everything you need to get the most out of Zalgo CRM.
        </p>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 48px 96px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {RESOURCES.map((r) => (
            <div
              key={r.title}
              style={{
                border: `1px solid ${border}`,
                borderRadius: 14,
                padding: "24px 26px",
                display: "flex",
                alignItems: "flex-start",
                gap: 18,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "rgba(0,134,138,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {r.icon}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{r.title}</div>
                <div style={{ fontSize: 13.5, color: sub, lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 32,
            border: `1px dashed ${border}`,
            borderRadius: 14,
            padding: "24px 26px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 14, color: sub, marginBottom: 14 }}>
            Can&apos;t find what you&apos;re looking for?
          </div>
          <button
            onClick={() => router.push("/contact")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: teal,
              color: "#fff",
              border: "none",
              borderRadius: 9,
              padding: "11px 22px",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Ask Us Directly <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
