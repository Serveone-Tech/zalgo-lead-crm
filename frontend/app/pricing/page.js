"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Check, ArrowRight } from "lucide-react";
import { teal, ink, sub, muted, border } from "../../lib/marketing-theme";
import { FEATURE_LABELS } from "../../lib/plan-features";
import MarketingNav from "../../components/MarketingNav";
import MarketingFooter from "../../components/MarketingFooter";
import Reveal from "../../components/Reveal";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function fmtPrice(n) {
  return `₹${Math.round(parseFloat(n) || 0).toLocaleString("en-IN")}`;
}

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${BASE}/plans`)
      .then((r) => setPlans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const customCard = {
    id: "custom",
    name: "Custom",
    price_monthly: null,
    description: "Need something specific? We'll build it with you.",
    features: ["Everything in Pro Max", "Custom integrations & workflows", "Dedicated onboarding support"],
    custom: true,
  };

  const cards = [
    ...plans.map((p) => ({
      ...p,
      features: Array.isArray(p.features) ? p.features : JSON.parse(p.features || "[]"),
    })),
    customCard,
  ];

  return (
    <div style={{ background: "#fff", color: ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <MarketingNav />

      <Reveal style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 48px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 14 }}>
          Simple, <span style={{ color: teal }}>Transparent</span> Pricing
        </h1>
        <p style={{ fontSize: 16, color: sub, maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
          Start with what you need today, upgrade the moment you need more — every plan begins with a free trial,
          no card required. No hidden fees, no surprises.
        </p>
      </Reveal>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 48px 96px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: muted, padding: 60 }}>Loading plans...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, alignItems: "stretch" }}>
            {cards.map((p, i) => {
              const highlighted = p.name === "Pro";
              return (
                <Reveal
                  key={p.id}
                  delay={i * 0.08}
                  className="price-card"
                  style={{
                    border: highlighted ? `2px solid ${teal}` : `1px solid ${border}`,
                    borderRadius: 16,
                    padding: "28px 24px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    boxShadow: highlighted ? "0 20px 50px rgba(0,134,138,0.16)" : "none",
                  }}
                >
                  {highlighted && (
                    <div
                      style={{
                        position: "absolute",
                        top: -13,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: teal,
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 14px",
                        borderRadius: 20,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Most Popular
                    </div>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: sub, marginBottom: 20, minHeight: 36 }}>{p.description}</div>
                  <div style={{ marginBottom: 22 }}>
                    {p.custom ? (
                      <div style={{ fontSize: 28, fontWeight: 800 }}>Contact Us</div>
                    ) : (
                      <>
                        <span style={{ fontSize: 34, fontWeight: 800 }}>{fmtPrice(p.price_monthly)}</span>
                        <span style={{ fontSize: 13, color: muted }}> /month</span>
                        {p.trial_days > 0 && (
                          <div style={{ fontSize: 12, color: teal, fontWeight: 600, marginTop: 4 }}>
                            {p.trial_days}-day free trial
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26, flex: 1 }}>
                    {p.features.map((f) => (
                      <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: sub }}>
                        <Check size={15} color={teal} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{FEATURE_LABELS[f] || f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push(p.custom ? "/contact" : "/register")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      background: highlighted ? teal : "transparent",
                      color: highlighted ? "#fff" : teal,
                      border: `1.5px solid ${teal}`,
                      borderRadius: 9,
                      padding: "11px 18px",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {p.custom ? "Contact Us" : "Get Started"} <ArrowRight size={15} />
                  </button>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .price-card {
          transition: box-shadow 0.25s;
        }
        .price-card:hover {
          box-shadow: 0 20px 44px rgba(20,30,35,0.12);
        }
      `}</style>

      <MarketingFooter />
    </div>
  );
}
