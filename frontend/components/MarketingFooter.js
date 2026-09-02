"use client";
import Image from "next/image";
import { Mail, ArrowUpRight } from "lucide-react";
import { teal, tealLight } from "../lib/marketing-theme";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Solutions", href: "/solutions" },
      { label: "Automation", href: "/automation-suite" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Resources", href: "/resources" },
      { label: "Documentation", href: "/docs" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund & Cancellation Policy", href: "/refund-policy" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <div style={{ background: "#0e1416", position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: -140,
          left: "50%",
          transform: "translateX(-50%)",
          width: 620,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,168,173,0.16) 0%, rgba(0,168,173,0) 70%)",
          pointerEvents: "none",
        }}
      />

      {/* CTA strip */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 48px 40px", position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
            paddingBottom: 44,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 44,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", marginBottom: 6 }}>
              Ready to stop losing leads?
            </div>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)" }}>
              Start free — no card required, cancel anytime.
            </div>
          </div>
          <a
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: teal,
              color: "#fff",
              borderRadius: 9,
              padding: "12px 22px",
              fontSize: 13.5,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 12px 28px rgba(0,134,138,0.35)",
              whiteSpace: "nowrap",
            }}
          >
            Book a Free Demo <ArrowUpRight size={15} />
          </a>
        </div>

        {/* Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gap: 32,
          }}
        >
          <div>
            <Image src="/logo_dark.png" alt="Zalgo Infotech" width={140} height={40} style={{ objectFit: "contain", marginBottom: 14 }} />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 260, marginBottom: 14 }}>
              Lead &amp; customer management, built for teams that sell fast — from first enquiry to delivered
              order.
            </div>
            <a
              href="mailto:zalgoinfotec@gmail.com"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: tealLight, fontWeight: 600, textDecoration: "none" }}
            >
              <Mail size={13} /> zalgoinfotec@gmail.com
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
                {col.heading}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {col.links.map((l) => (
                  <a key={l.href} href={l.href} style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "18px 48px",
          textAlign: "center",
          fontSize: 12,
          color: "rgba(255,255,255,0.35)",
          position: "relative",
        }}
      >
        © {new Date().getFullYear()} Zalgo Infotech. All rights reserved.
      </div>
    </div>
  );
}
