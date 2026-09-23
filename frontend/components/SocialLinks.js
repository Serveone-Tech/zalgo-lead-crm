"use client";
import { useState } from "react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { SOCIAL } from "../lib/social";

const ICONS = { facebook: FaFacebookF, instagram: FaInstagram, youtube: FaYoutube };
const BRAND_COLORS = { facebook: "#1877F2", instagram: "#E4405F", youtube: "#FF0000" };

/** Round social icon buttons using real brand glyphs — light (on white/mint
 * backgrounds) or dark (on the navy footer) variant, brand colour fills on hover. */
export default function SocialLinks({ size = 44, variant = "light" }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {SOCIAL.map((s) => {
        const Icon = ICONS[s.id];
        const brand = BRAND_COLORS[s.id];
        const isHovered = hovered === s.id;
        const baseBg = variant === "dark" ? "rgba(255,255,255,0.10)" : "#dfe9ff";
        const baseColor = variant === "dark" ? "#fff" : brand;
        return (
          <a
            key={s.id}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            onMouseEnter={() => setHovered(s.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: isHovered ? brand : baseBg,
              color: isHovered ? "#fff" : baseColor,
              transition: "background 0.2s ease, color 0.2s ease, transform 0.2s ease",
              transform: isHovered ? "translateY(-2px)" : "translateY(0)",
              textDecoration: "none",
            }}
          >
            <Icon size={size * 0.42} />
          </a>
        );
      })}
    </div>
  );
}
