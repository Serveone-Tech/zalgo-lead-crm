"use client";
import Image from "next/image";
import { border, muted, sub, ink } from "../lib/marketing-theme";

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
    <div style={{ borderTop: `1px solid ${border}` }}>
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "48px 48px 32px",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          gap: 32,
        }}
      >
        <div>
          <Image src="/logo_light.png" alt="Zalgo Infotech" width={140} height={40} style={{ objectFit: "contain", marginBottom: 12 }} />
          <div style={{ fontSize: 13, color: muted, lineHeight: 1.6, maxWidth: 260 }}>
            Lead &amp; customer management, built for teams that sell fast.
          </div>
          <a href="mailto:zalgoinfotec@gmail.com" style={{ display: "block", marginTop: 12, fontSize: 13, color: sub, fontWeight: 600 }}>
            zalgoinfotec@gmail.com
          </a>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ink, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
              {col.heading}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {col.links.map((l) => (
                <a key={l.href} href={l.href} style={{ fontSize: 13.5, color: sub }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: `1px solid ${border}`,
          padding: "18px 48px",
          textAlign: "center",
          fontSize: 12.5,
          color: muted,
        }}
      >
        © {new Date().getFullYear()} Zalgo Infotech. All rights reserved.
      </div>
    </div>
  );
}
