"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { teal, sub, border } from "../lib/marketing-theme";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Solutions", href: "/solutions" },
  { label: "Automation", href: "/automation-suite" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

export default function MarketingNav() {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 48px",
        borderBottom: `1px solid ${border}`,
        position: "sticky",
        top: 0,
        background: "#fff",
        zIndex: 50,
      }}
    >
      <a href="/">
        <Image src="/logo_light.png" alt="Zalgo Infotech" width={150} height={42} style={{ objectFit: "contain" }} />
      </a>
      <div style={{ display: "flex", gap: 32 }}>
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: 500, color: sub }}>
            {l.label}
          </a>
        ))}
      </div>
      <button
        onClick={() => router.push("/register")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: teal,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "11px 20px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Book a Free Demo <ArrowRight size={15} />
      </button>
    </div>
  );
}
