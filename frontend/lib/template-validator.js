// Frontend mirror of backend/utils/meta-template-validator.js — powers the
// builder's live validation panel without a round trip on every keystroke.
// This is NOT the authority: the backend re-runs the same checks (and is
// the only thing that can actually gate a submit), so keep these two files
// in sync rather than trusting only one. See /docs/whatsapp-template-builder.md.

export const CATEGORIES = ["MARKETING", "UTILITY", "AUTHENTICATION"];
export const HEADER_FORMATS = ["NONE", "TEXT"];
export const BUTTON_TYPES = ["QUICK_REPLY", "URL", "PHONE_NUMBER"];
export const MAX_BUTTONS = 3;
const MAX_BODY_LEN = 1024;
const MAX_HEADER_LEN = 60;
const MAX_FOOTER_LEN = 60;
const MAX_BUTTON_TEXT_LEN = 25;

export function slugifyTemplateName(name) {
  return (name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

export function isValidTemplateName(name) {
  return /^[a-z0-9_]{1,64}$/.test(name || "");
}

export function extractVariablePositions(text) {
  const matches = [...String(text || "").matchAll(/\{\{(\d+)\}\}/g)];
  return [...new Set(matches.map((m) => parseInt(m[1], 10)))].sort((a, b) => a - b);
}

export function isSequential(positions) {
  return positions.every((p, i) => p === i + 1);
}

export function validateTemplate(tpl) {
  const errors = [];
  const warnings = [];

  const name = tpl?.name || "";
  const slug = slugifyTemplateName(name);
  if (!name.trim()) {
    errors.push({ field: "name", message: "Template name is required." });
  } else if (!isValidTemplateName(slug) || slug !== name) {
    errors.push({ field: "name", message: `Template name must be lowercase letters, numbers and underscores only (e.g. "${slug || "summer_sale_2026"}").` });
  }

  if (!CATEGORIES.includes(tpl?.category)) {
    errors.push({ field: "category", message: "Select a category: Marketing, Utility, or Authentication." });
  }
  if (!tpl?.language?.trim()) {
    errors.push({ field: "language", message: "Select a template language." });
  }

  const header = tpl?.header || { format: "NONE" };
  let headerVarPositions = [];
  if (header.format === "TEXT") {
    if (!header.text?.trim()) {
      errors.push({ field: "header", message: "Header text can't be empty when Header type is Text." });
    } else if (header.text.length > MAX_HEADER_LEN) {
      errors.push({ field: "header", message: `Header text must be ${MAX_HEADER_LEN} characters or fewer.` });
    }
    headerVarPositions = extractVariablePositions(header.text);
    if (headerVarPositions.length > 1) errors.push({ field: "header", message: "A header can contain at most one variable." });
    if (headerVarPositions.length === 1 && headerVarPositions[0] !== 1) errors.push({ field: "header", message: "A header's single variable must be {{1}}." });
    for (const pos of headerVarPositions) {
      const sample = header.variables?.find((v) => v.position === pos)?.sample;
      if (!sample?.trim()) errors.push({ field: "header", message: `Header variable {{${pos}}} is missing a sample value.` });
    }
  }

  const body = tpl?.body || {};
  if (!body.text?.trim()) {
    errors.push({ field: "body", message: "Body text is required." });
  } else if (body.text.length > MAX_BODY_LEN) {
    errors.push({ field: "body", message: `Body text must be ${MAX_BODY_LEN} characters or fewer.` });
  }
  const bodyVarPositions = extractVariablePositions(body.text);
  if (bodyVarPositions.length > 0 && !isSequential(bodyVarPositions)) {
    errors.push({ field: "body", message: `Body variables must be sequential starting from {{1}} (found {{${bodyVarPositions.join("}}, {{")}}}).` });
  }
  for (const pos of bodyVarPositions) {
    const v = body.variables?.find((x) => x.position === pos);
    if (!v?.sample?.trim()) errors.push({ field: "body", message: `Variable {{${pos}}} is missing a sample value.` });
  }

  const footer = tpl?.footer || {};
  if (footer.text) {
    if (footer.text.length > MAX_FOOTER_LEN) errors.push({ field: "footer", message: `Footer text must be ${MAX_FOOTER_LEN} characters or fewer.` });
    if (extractVariablePositions(footer.text).length > 0) errors.push({ field: "footer", message: "Footer text can't contain variables." });
  }

  const buttons = Array.isArray(tpl?.buttons) ? tpl.buttons : [];
  if (buttons.length > MAX_BUTTONS) errors.push({ field: "buttons", message: `A template can have at most ${MAX_BUTTONS} buttons.` });
  const urlButtonCount = buttons.filter((b) => b.type === "URL").length;
  const phoneButtonCount = buttons.filter((b) => b.type === "PHONE_NUMBER").length;
  if (urlButtonCount > 1) errors.push({ field: "buttons", message: "Only one Website (URL) button is allowed." });
  if (phoneButtonCount > 1) errors.push({ field: "buttons", message: "Only one Call Phone Number button is allowed." });

  buttons.forEach((b, i) => {
    const label = `Button ${i + 1}`;
    if (!BUTTON_TYPES.includes(b.type)) {
      errors.push({ field: "buttons", message: `${label}: unknown button type.` });
      return;
    }
    if (!b.text?.trim()) {
      errors.push({ field: "buttons", message: `${label}: text is required.` });
    } else if (b.text.length > MAX_BUTTON_TEXT_LEN) {
      errors.push({ field: "buttons", message: `${label}: text must be ${MAX_BUTTON_TEXT_LEN} characters or fewer.` });
    }
    if (b.type === "URL") {
      if (!b.url?.trim()) {
        errors.push({ field: "buttons", message: `${label}: URL is required.` });
      } else if (!/^https?:\/\/.+/i.test(b.url.trim())) {
        errors.push({ field: "buttons", message: `${label}: URL must start with http:// or https://.` });
      }
      const urlVarPositions = extractVariablePositions(b.url);
      if (urlVarPositions.length > 1) errors.push({ field: "buttons", message: `${label}: a URL button can contain at most one variable, and it must be at the end.` });
      if (urlVarPositions.length === 1) {
        if (!b.url.trim().endsWith(`{{${urlVarPositions[0]}}}`)) errors.push({ field: "buttons", message: `${label}: the variable must be the last part of the URL.` });
        if (!b.url_example?.trim()) errors.push({ field: "buttons", message: `${label}: provide a sample value for the dynamic URL variable.` });
      }
    }
    if (b.type === "PHONE_NUMBER") {
      if (!b.phone_number?.trim()) {
        errors.push({ field: "buttons", message: `${label}: phone number is required.` });
      } else if (!/^\+?[0-9]{6,15}$/.test(b.phone_number.trim().replace(/[\s-]/g, ""))) {
        errors.push({ field: "buttons", message: `${label}: enter a valid phone number with country code.` });
      }
    }
  });

  if (tpl?.category === "MARKETING" && body.text && /(!!!|100% free|act now|urgent)/i.test(body.text)) {
    warnings.push({ field: "body", message: "This body uses language Meta sometimes flags for marketing quality review. This won't block submission — Meta's own review is the final word." });
  }

  return { valid: errors.length === 0, errors, warnings, slug };
}

// Same shape Meta's API expects — used only for the "Meta Payload" debug tab
// (the actual submission payload is always built server-side).
export function buildMetaComponents(tpl) {
  const components = [];
  const header = tpl.header || { format: "NONE" };

  if (header.format === "TEXT" && header.text?.trim()) {
    const comp = { type: "HEADER", format: "TEXT", text: header.text.trim() };
    const positions = extractVariablePositions(header.text);
    if (positions.length > 0) {
      comp.example = { header_text: [positions.map((p) => header.variables?.find((v) => v.position === p)?.sample || "")] };
    }
    components.push(comp);
  }

  const body = tpl.body || {};
  const bodyComp = { type: "BODY", text: body.text || "" };
  const bodyPositions = extractVariablePositions(body.text);
  if (bodyPositions.length > 0) {
    bodyComp.example = { body_text: [bodyPositions.map((p) => body.variables?.find((v) => v.position === p)?.sample || "")] };
  }
  components.push(bodyComp);

  if (tpl.footer?.text?.trim()) components.push({ type: "FOOTER", text: tpl.footer.text.trim() });

  const buttons = Array.isArray(tpl.buttons) ? tpl.buttons.filter((b) => b?.text?.trim()).slice(0, MAX_BUTTONS) : [];
  if (buttons.length > 0) {
    const metaButtons = buttons.map((b) => {
      if (b.type === "URL") {
        const btn = { type: "URL", text: b.text.trim(), url: (b.url || "").trim() };
        const urlPositions = extractVariablePositions(b.url);
        if (urlPositions.length === 1 && b.url_example?.trim()) btn.example = [b.url_example.trim()];
        return btn;
      }
      if (b.type === "PHONE_NUMBER") return { type: "PHONE_NUMBER", text: b.text.trim(), phone_number: (b.phone_number || "").trim() };
      return { type: "QUICK_REPLY", text: b.text.trim() };
    });
    components.push({ type: "BUTTONS", buttons: metaButtons });
  }

  return components;
}
