// Shared inline-style tokens for the template builder component tree —
// keeps every sub-component visually consistent without a CSS file, same
// convention the rest of the app's pages use (see e.g. app/employees/page.js).
export const sectionCard = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  padding: "16px 18px",
  marginBottom: 14,
};

export const label = {
  fontSize: 10,
  color: "var(--text-secondary)",
  marginBottom: 8,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  fontFamily: "var(--font-main)",
};

export const textInput = {
  width: "100%",
  padding: "9px 11px",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export const textarea = {
  ...textInput,
  resize: "vertical",
  minHeight: 110,
  lineHeight: 1.5,
};
