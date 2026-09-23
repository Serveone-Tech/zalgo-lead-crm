"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { DEMO_VIDEO_ID } from "../lib/social";
import SocialLinks from "./SocialLinks";

const blue = "#1a5cff";
const sub = "#4a5670";
const border = "#dfe6f3";

function buildSrc({ autoplay, muted }) {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: muted ? "1" : "0",
    loop: "1",
    playlist: DEMO_VIDEO_ID,
    controls: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?${params.toString()}`;
}

/** The demo video card on the home page — mounts (and therefore starts
 * loading/autoplaying) only once scrolled into view, muted as browsers
 * require for autoplay, with a small Unmute overlay. Falls back to a
 * normal, non-autoplaying player when the visitor has asked for reduced
 * motion. */
export default function DemoVideo() {
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const autoplay = visible && !reducedMotion;
  const effectiveMuted = reducedMotion ? false : muted;
  const showUnmute = autoplay && effectiveMuted;

  return (
    <div ref={wrapRef}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          borderRadius: 24,
          overflow: "hidden",
          background: "#fff",
          border: `1px solid ${border}`,
          boxShadow: "0 40px 90px rgba(11,31,74,0.16)",
          position: "relative",
        }}
      >
        <div style={{ position: "relative", paddingTop: "56.25%" }}>
          {visible && (
            <iframe
              key={effectiveMuted ? "muted" : "unmuted"}
              src={buildSrc({ autoplay, muted: effectiveMuted })}
              title="LeadLo demo"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              loading="eager"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          )}
          {showUnmute && (
            <button
              type="button"
              onClick={() => setMuted(false)}
              style={{
                position: "absolute",
                bottom: 18,
                right: 18,
                background: "#fff",
                color: blue,
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                borderRadius: 999,
                padding: "10px 18px",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(11,31,74,0.25)",
              }}
            >
              🔊 Unmute
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          flexWrap: "wrap",
          marginTop: 26,
        }}
      >
        <a
          href={`https://www.youtube.com/watch?v=${DEMO_VIDEO_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: blue,
            fontWeight: 700,
            fontSize: 16,
            textDecoration: "none",
          }}
        >
          Watch on YouTube <ArrowUpRight size={18} />
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 15, color: sub, fontWeight: 600 }}>Follow LeadLo:</span>
          <SocialLinks variant="light" size={40} />
        </div>
      </div>
    </div>
  );
}
