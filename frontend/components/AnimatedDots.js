"use client";

// The moving dotted field used behind hero/CTA mockups — a grid of dots
// that gently drifts diagonally on a loop, giving otherwise-static
// marketing sections a bit of life without distracting from the content
// in front of it.
export default function AnimatedDots({
  width = 220,
  height = 220,
  color = "rgba(0,134,138,0.35)",
  size = 14,
  dot = 1.6,
  style,
}) {
  const id = `dots-${color.replace(/[^a-z0-9]/gi, "")}-${size}`;
  return (
    <>
      <div
        className={id}
        style={{
          width,
          height,
          backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
          backgroundSize: `${size}px ${size}px`,
          ...style,
        }}
      />
      <style>{`
        .${id} {
          animation: ${id}Drift 6s linear infinite;
        }
        @keyframes ${id}Drift {
          to { background-position: ${size}px ${size}px; }
        }
      `}</style>
    </>
  );
}
