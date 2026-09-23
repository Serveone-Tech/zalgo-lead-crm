"use client";
import Image from "next/image";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";

/* LeadLo footer tokens */
const navy = "#0a1f4e";
const navyDeep = "#061538";
const blue = "#1a5cff";
const blueLight = "#3d7bff";
const orange = "#f59a23";
const textSoft = "rgba(255,255,255,0.72)";
const line = "rgba(255,255,255,0.14)";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Shared WhatsApp", href: "/solutions" },
      { label: "Automation", href: "/automation-suite" },
      { label: "Orders & Delivery", href: "/features#orders" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Help Center", href: "/help-center" },
      { label: "FAQs", href: "/#faq" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
];

const CONTACT = [
  {
    icon: Mail,
    text: "leadlozalgo@gmail.com",
    href: "mailto:leadlozalgo@gmail.com",
  },
  { icon: Phone, text: "+91 92442 13326", href: "tel:+919244213326" },
  {
    icon: MapPin,
    text: "1/65, vinay nagar sec 3, 100 feet road, s. p. ashram, gwalior, madhya pradesh, india - 474012",
  },
];

export default function MarketingFooter() {
  return (
    <footer
      style={{
        background: `linear-gradient(135deg, ${navy} 0%, ${navyDeep} 100%)`,
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* decorative blue circles, top-right (as in the design) */}
      {[
        { size: 420, top: -220, right: -140, o: 0.55 },
        { size: 260, top: 150, right: -120, o: 0.45 },
      ].map((c, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            top: c.top,
            right: c.right,
            width: c.size,
            height: c.size,
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, ${blueLight} 0%, ${blue} 45%, rgba(26,92,255,0) 72%)`,
            opacity: c.o,
            pointerEvents: "none",
          }}
        />
      ))}

      <div
        className="mk-footer-grid"
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "64px 48px 48px",
          display: "grid",
          gridTemplateColumns: "1.35fr 1fr 1fr 1.25fr",
          position: "relative",
        }}
      >
        {/* Brand column */}
        <div
          className="mk-footer-col"
          style={{ paddingRight: 40, borderRight: `1px solid ${line}` }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#fff",
              borderRadius: 18,
              padding: "14px 22px",
              marginBottom: 28,
              boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
            }}
          >
            <Image
              src="/logo_light.png"
              alt="LeadLo"
              width={220}
              height={72}
              style={{
                height: 58,
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: 12,
              letterSpacing: "-0.01em",
            }}
          >
            Leads. Conversations.
            <br />
            Orders.
          </div>
          <div
            style={{
              fontSize: 17,
              color: textSoft,
              lineHeight: 1.5,
              maxWidth: 300,
              marginBottom: 36,
            }}
          >
            One connected workspace for your sales team.
          </div>
          <div style={{ fontSize: 15, color: textSoft, marginBottom: 4 }}>
            A product of
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            Zalgo Infotech Pvt. Ltd.
          </div>
        </div>

        {/* Link columns */}
        {COLUMNS.map((col) => (
          <div
            key={col.heading}
            className="mk-footer-col"
            style={{ padding: "0 40px", borderRight: `1px solid ${line}` }}
          >
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 26 }}>
              {col.heading}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {col.links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="mk-footer-link"
                  style={{
                    fontSize: 18,
                    color: textSoft,
                    textDecoration: "none",
                  }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* Contact column */}
        <div className="mk-footer-col" style={{ paddingLeft: 40 }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 26 }}>
            Contact
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {CONTACT.map(({ icon: Icon, text, href }) => {
              const inner = (
                <>
                  <span
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.10)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} />
                  </span>
                  <span style={{ fontSize: 18 }}>{text}</span>
                </>
              );
              return href ? (
                <a
                  key={text}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  {inner}
                </a>
              ) : (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    color: textSoft,
                  }}
                >
                  {inner}
                </div>
              );
            })}
          </div>
          <div style={{ height: 1, background: line, margin: "28px 0 22px" }} />
          <a
            href="https://zalgoinfotech.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: blueLight,
              fontSize: 18,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Visit Zalgo Infotech <ArrowUpRight size={20} />
          </a>
        </div>
      </div>

      {/* bottom bar */}
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 48px",
          position: "relative",
        }}
      >
        <div
          style={{
            borderTop: `1px solid ${line}`,
            padding: "26px 0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 16, color: textSoft }}>
            © {new Date().getFullYear()} Zalgo Infotech Pvt. Ltd. All rights
            reserved.
          </div>
          <a
            href="https://lead-management.zalgostore.com/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "#fff",
              fontSize: 17,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            LeadLo CRM <ArrowUpRight size={18} color={orange} />
          </a>
        </div>
      </div>

      <style>{`
        .mk-footer-link { transition: color .2s ease; }
        .mk-footer-link:hover { color: #fff !important; }
        @media (max-width: 1024px) {
          .mk-footer-grid { grid-template-columns: 1fr 1fr !important; row-gap: 40px; }
          .mk-footer-col { border-right: none !important; padding: 0 !important; }
        }
        @media (max-width: 640px) {
          .mk-footer-grid { grid-template-columns: 1fr !important; padding-left: 24px !important; padding-right: 24px !important; }
        }
      `}</style>
    </footer>
  );
}
