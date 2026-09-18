"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";
import { teal, ink, sub, border } from "../lib/marketing-theme";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Solutions", href: "/solutions" },
  { label: "Automation", href: "/automation-suite" },
  { label: "Pricing", href: "/pricing" },
  { label: "Help Center", href: "/help-center" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/**
 * @param {{ ctaLabel?: string, ctaHref?: string }} props
 * ctaLabel defaults to "Book a Free Demo"; the pricing page passes "Start Free Trial".
 */
export default function MarketingNav({
  ctaLabel = "Book a Free Demo",
  ctaHref = "https://lead-management.zalgostore.com/register",
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: `1px solid ${border}`,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "14px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* Logo — sized by height so it reads large regardless of the PNG's canvas */}
        <a
          href="/"
          aria-label="LeadLo home"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          <Image
            src="/logo_light.png"
            alt="LeadLo"
            width={220}
            height={72}
            priority
            style={{
              height: 60,
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </a>

        {/* Desktop links */}
        <nav className="mk-nav-links" style={{ display: "flex", gap: 36 }}>
          {NAV_LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <a
                key={l.href}
                href={l.href}
                style={{
                  position: "relative",
                  fontSize: 16,
                  fontWeight: active ? 700 : 500,
                  color: active ? teal : ink,
                  textDecoration: "none",
                  padding: "6px 0",
                  transition: "color .2s ease",
                }}
              >
                {l.label}
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: -8,
                      height: 3,
                      borderRadius: 2,
                      background: teal,
                    }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right side */}
        <div
          className="mk-nav-actions"
          style={{ display: "flex", alignItems: "center", gap: 26 }}
        >
          <a
            href="https://lead-management.zalgostore.com/login"
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: ink,
              textDecoration: "none",
            }}
          >
            Log in
          </a>
          <button
            onClick={() => router.push(ctaHref)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: `linear-gradient(180deg, ${teal} 0%, #0f47d6 100%)`,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "13px 22px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 10px 24px rgba(26,92,255,0.28)",
              fontFamily: "inherit",
              transition: "transform .2s ease, box-shadow .2s ease",
            }}
          >
            {ctaLabel} <ArrowRight size={17} />
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="mk-nav-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: ink,
          }}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="mk-nav-mobile"
          style={{
            borderTop: `1px solid ${border}`,
            background: "#fff",
            padding: "12px 24px 20px",
          }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                display: "block",
                padding: "12px 0",
                fontSize: 17,
                fontWeight: isActive(l.href) ? 700 : 500,
                color: isActive(l.href) ? teal : ink,
                textDecoration: "none",
                borderBottom: `1px solid ${border}`,
              }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://lead-management.zalgostore.com/login"
            style={{
              display: "block",
              padding: "12px 0",
              fontSize: 17,
              color: ink,
              textDecoration: "none",
            }}
          >
            Log in
          </a>
          <button
            onClick={() => router.push(ctaHref)}
            style={{
              width: "100%",
              marginTop: 8,
              background: teal,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "14px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {ctaLabel}
          </button>
        </div>
      )}

      <style>{`
        .mk-nav-links a:hover { color: ${teal} !important; }
        header button:hover { transform: translateY(-1px); box-shadow: 0 14px 30px rgba(26,92,255,0.34); }
        @media (max-width: 1024px) {
          .mk-nav-links, .mk-nav-actions { display: none !important; }
          .mk-nav-toggle { display: inline-flex !important; }
        }
        @media (min-width: 1025px) { .mk-nav-mobile { display: none; } }
      `}</style>
    </header>
  );
}
