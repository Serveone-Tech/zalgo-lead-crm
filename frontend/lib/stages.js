// Default stages used as fallback before API loads
export const STAGES = ["New", "Active", "Follow-up", "Booked", "Converted", "Closed"];

export const STAGE_COLORS = {
  New:        { bg: "rgba(82,184,138,0.16)",  color: "#2f9e6f" },
  Active:     { bg: "rgba(0,168,173,0.18)",   color: "#00868a" },
  "Follow-up":{ bg: "rgba(224,160,80,0.2)",   color: "#b06a00" },
  Booked:     { bg: "rgba(91,163,217,0.2)",   color: "#2a6fb0" },
  Converted:  { bg: "rgba(82,184,138,0.26)",  color: "#1f8a5c" },
  Closed:     { bg: "rgba(120,120,120,0.18)", color: "#6b6b6b" },
};

// Convert a hex color → badge style { bg, color }
// Appends "28" (≈16% alpha) to produce a soft tinted background
export function getStageStyle(hexColor) {
  const c = hexColor || "#6b6b6b";
  return { bg: c + "28", color: c };
}

// Given dynamic stages array from API, find style for a stage name
export function stageStyle(stageName, dynamicStages) {
  if (dynamicStages?.length) {
    const found = dynamicStages.find(s => s.name === stageName);
    if (found) return getStageStyle(found.color);
  }
  return STAGE_COLORS[stageName] || { bg: "rgba(120,120,120,0.18)", color: "#6b6b6b" };
}
