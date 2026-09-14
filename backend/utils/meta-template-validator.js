// MetaTemplateValidator — the single authority for "is this template
// structurally valid enough to submit to Meta". Used by the template
// builder routes before every save/validate/submit call. The frontend
// builder (frontend/lib/template-validator.js) mirrors these same rules so
// the UI can show live errors without a round trip, but this backend copy
// is what actually gates submission — never trust the frontend's copy.
//
// Scope note: this only checks the technical/structural rules Meta's
// template API enforces (name format, required fields, variable/sample
// consistency, button field shape, known limits for the component types
// this builder currently supports — TEXT header, BODY, FOOTER, up to 3
// BUTTONS incl. dynamic URL). It intentionally does NOT claim to predict
// Meta's own content-quality review — that's a human review process on
// Meta's side and no local check can substitute for it.

const CATEGORIES = ["MARKETING", "UTILITY", "AUTHENTICATION"];
const HEADER_FORMATS = ["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"];
const MEDIA_HEADER_FORMATS = ["IMAGE", "VIDEO", "DOCUMENT"];
const BUTTON_TYPES = ["QUICK_REPLY", "URL", "PHONE_NUMBER"];
const MAX_BUTTONS = 3; // matches what this integration's Meta account has been submitting successfully
const MAX_BODY_LEN = 1024;
const MAX_HEADER_LEN = 60;
const MAX_FOOTER_LEN = 60;
const MAX_BUTTON_TEXT_LEN = 25;
// Carousel cards are documented as MARKETING-only, each card requiring an
// IMAGE/VIDEO header (never TEXT/NONE) and up to 2 buttons — narrower than
// a normal template's 3. Verify against Meta's current docs before relying
// on this for a live submission; this integration hasn't used carousel
// before, so treat these limits as "best-effort per Meta's documented
// structure," not as something already proven against this account.
const MIN_CAROUSEL_CARDS = 2;
const MAX_CAROUSEL_CARDS = 10;
const MAX_CAROUSEL_CARD_BUTTONS = 2;

// Meta template names: lowercase letters, digits, underscores only.
function slugifyTemplateName(name) {
  return (name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

function isValidTemplateName(name) {
  return /^[a-z0-9_]{1,64}$/.test(name || "");
}

// Extracts the sorted, deduped {{n}} positions used in a piece of text.
function extractVariablePositions(text) {
  const matches = [...String(text || "").matchAll(/\{\{(\d+)\}\}/g)];
  const positions = [...new Set(matches.map((m) => parseInt(m[1], 10)))].sort((a, b) => a - b);
  return positions;
}

// Meta requires {{1}}, {{2}}, {{3}}... with no gaps and no repeats-as-different-var —
// a template using {{1}} and {{3}} but not {{2}} gets rejected.
function isSequential(positions) {
  return positions.every((p, i) => p === i + 1);
}

function validateTemplate(tpl) {
  const errors = [];
  const warnings = [];

  const name = tpl?.name || "";
  const slug = slugifyTemplateName(name);
  if (!name.trim()) {
    errors.push({ field: "name", message: "Template name is required." });
  } else if (!isValidTemplateName(slug) || slug !== name) {
    errors.push({
      field: "name",
      message: `Template name must be lowercase letters, numbers and underscores only (e.g. "${slug || "summer_sale_2026"}").`,
    });
  }

  if (!CATEGORIES.includes(tpl?.category)) {
    errors.push({ field: "category", message: "Select a category: Marketing, Utility, or Authentication." });
  }

  if (!tpl?.language?.trim()) {
    errors.push({ field: "language", message: "Select a template language." });
  }

  // ── Header ──────────────────────────────────────────────
  const header = tpl?.header || { format: "NONE" };
  if (!HEADER_FORMATS.includes(header.format)) {
    errors.push({ field: "header", message: `Header type "${header.format}" isn't supported by this builder yet.` });
  }
  let headerVarPositions = [];
  if (header.format === "TEXT") {
    if (!header.text?.trim()) {
      errors.push({ field: "header", message: "Header text can't be empty when Header type is Text." });
    } else if (header.text.length > MAX_HEADER_LEN) {
      errors.push({ field: "header", message: `Header text must be ${MAX_HEADER_LEN} characters or fewer.` });
    }
    headerVarPositions = extractVariablePositions(header.text);
    if (headerVarPositions.length > 1) {
      errors.push({ field: "header", message: "A header can contain at most one variable." });
    }
    if (headerVarPositions.length === 1 && headerVarPositions[0] !== 1) {
      errors.push({ field: "header", message: "A header's single variable must be {{1}}." });
    }
    for (const pos of headerVarPositions) {
      const sample = header.variables?.find((v) => v.position === pos)?.sample;
      if (!sample?.trim()) {
        errors.push({ field: "header", message: `Header variable {{${pos}}} is missing a sample value.` });
      }
    }
  }
  if (MEDIA_HEADER_FORMATS.includes(header.format) && !header.media_handle) {
    errors.push({ field: "header", message: `Upload ${header.format.toLowerCase()} for the header before submitting.` });
  }

  // ── Body ────────────────────────────────────────────────
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
    if (!v?.sample?.trim()) {
      errors.push({ field: "body", message: `Variable {{${pos}}} is missing a sample value.` });
    }
  }

  // ── Footer ──────────────────────────────────────────────
  const footer = tpl?.footer || {};
  if (footer.text) {
    if (footer.text.length > MAX_FOOTER_LEN) {
      errors.push({ field: "footer", message: `Footer text must be ${MAX_FOOTER_LEN} characters or fewer.` });
    }
    if (extractVariablePositions(footer.text).length > 0) {
      errors.push({ field: "footer", message: "Footer text can't contain variables." });
    }
  }

  // ── Buttons ─────────────────────────────────────────────
  errors.push(...validateButtonList(tpl?.buttons, { field: "buttons", max: MAX_BUTTONS, labelPrefix: "Button" }));

  // ── Carousel (marketing only) ────────────────────────────
  if (tpl?.carousel?.cards?.length) {
    if (tpl.category !== "MARKETING") {
      errors.push({ field: "carousel", message: "Carousel cards are only supported on Marketing templates." });
    }
    const cards = tpl.carousel.cards;
    if (cards.length < MIN_CAROUSEL_CARDS || cards.length > MAX_CAROUSEL_CARDS) {
      errors.push({ field: "carousel", message: `A carousel needs between ${MIN_CAROUSEL_CARDS} and ${MAX_CAROUSEL_CARDS} cards (currently ${cards.length}).` });
    }
    cards.forEach((card, i) => {
      const cardLabel = `Card ${i + 1}`;
      const cardHeader = card.header || {};
      if (!MEDIA_HEADER_FORMATS.includes(cardHeader.format)) {
        errors.push({ field: "carousel", message: `${cardLabel}: needs an image or video header — text/no header isn't supported on carousel cards.` });
      } else if (!cardHeader.media_handle) {
        errors.push({ field: "carousel", message: `${cardLabel}: upload the ${cardHeader.format.toLowerCase()} before submitting.` });
      }
      if (!card.body?.text?.trim()) {
        errors.push({ field: "carousel", message: `${cardLabel}: body text is required.` });
      } else if (card.body.text.length > MAX_BODY_LEN) {
        errors.push({ field: "carousel", message: `${cardLabel}: body text must be ${MAX_BODY_LEN} characters or fewer.` });
      }
      const cardBodyPositions = extractVariablePositions(card.body?.text);
      if (cardBodyPositions.length > 0 && !isSequential(cardBodyPositions)) {
        errors.push({ field: "carousel", message: `${cardLabel}: body variables must be sequential starting from {{1}}.` });
      }
      for (const pos of cardBodyPositions) {
        const v = card.body?.variables?.find((x) => x.position === pos);
        if (!v?.sample?.trim()) errors.push({ field: "carousel", message: `${cardLabel}: variable {{${pos}}} is missing a sample value.` });
      }
      errors.push(...validateButtonList(card.buttons, { field: "carousel", max: MAX_CAROUSEL_CARD_BUTTONS, labelPrefix: `${cardLabel} button` }));
    });
  }

  if (tpl?.category === "MARKETING" && body.text && /(!!!|100% free|act now|urgent)/i.test(body.text)) {
    warnings.push({
      field: "body",
      message: "This body uses language Meta sometimes flags for marketing quality review (e.g. excessive urgency/promotional phrasing). This won't block submission — Meta's own review is the final word.",
    });
  }

  return { valid: errors.length === 0, errors, warnings, slug };
}

// Shared by the main template's own buttons and each carousel card's
// buttons — same field rules, just a different max count and label prefix.
function validateButtonList(rawButtons, { field, max, labelPrefix }) {
  const errors = [];
  const buttons = Array.isArray(rawButtons) ? rawButtons : [];
  if (buttons.length > max) {
    errors.push({ field, message: `At most ${max} buttons allowed here.` });
  }
  const urlButtonCount = buttons.filter((b) => b.type === "URL").length;
  const phoneButtonCount = buttons.filter((b) => b.type === "PHONE_NUMBER").length;
  if (urlButtonCount > 1) errors.push({ field, message: "Only one Website (URL) button is allowed." });
  if (phoneButtonCount > 1) errors.push({ field, message: "Only one Call Phone Number button is allowed." });

  buttons.forEach((b, i) => {
    const label = `${labelPrefix} ${i + 1}`;
    if (!BUTTON_TYPES.includes(b.type)) {
      errors.push({ field, message: `${label}: unknown button type.` });
      return;
    }
    if (!b.text?.trim()) {
      errors.push({ field, message: `${label}: text is required.` });
    } else if (b.text.length > MAX_BUTTON_TEXT_LEN) {
      errors.push({ field, message: `${label}: text must be ${MAX_BUTTON_TEXT_LEN} characters or fewer.` });
    }
    if (b.type === "URL") {
      if (!b.url?.trim()) {
        errors.push({ field, message: `${label}: URL is required.` });
      } else if (!/^https?:\/\/.+/i.test(b.url.trim())) {
        errors.push({ field, message: `${label}: URL must start with http:// or https://.` });
      }
      const urlVarPositions = extractVariablePositions(b.url);
      if (urlVarPositions.length > 1) {
        errors.push({ field, message: `${label}: a URL button can contain at most one variable, and it must be at the end.` });
      }
      if (urlVarPositions.length === 1) {
        if (!b.url.trim().endsWith(`{{${urlVarPositions[0]}}}`)) {
          errors.push({ field, message: `${label}: the variable must be the last part of the URL.` });
        }
        if (!b.url_example?.trim()) {
          errors.push({ field, message: `${label}: provide a sample value for the dynamic URL variable.` });
        }
      }
    }
    if (b.type === "PHONE_NUMBER") {
      if (!b.phone_number?.trim()) {
        errors.push({ field, message: `${label}: phone number is required.` });
      } else if (!/^\+?[0-9]{6,15}$/.test(b.phone_number.trim().replace(/[\s-]/g, ""))) {
        errors.push({ field, message: `${label}: enter a valid phone number with country code.` });
      }
    }
  });

  return errors;
}

// Converts the CRM's structured template config into the exact `components`
// array Meta's POST /{waba-id}/message_templates expects. Only called once
// validateTemplate() has confirmed the config is submittable.
function buildMetaComponents(tpl) {
  const components = [];
  const header = tpl.header || { format: "NONE" };

  if (header.format === "TEXT" && header.text?.trim()) {
    const comp = { type: "HEADER", format: "TEXT", text: header.text.trim() };
    const positions = extractVariablePositions(header.text);
    if (positions.length > 0) {
      const samples = positions.map((p) => header.variables?.find((v) => v.position === p)?.sample || "");
      comp.example = { header_text: [samples] };
    }
    components.push(comp);
  }
  if (MEDIA_HEADER_FORMATS.includes(header.format) && header.media_handle) {
    components.push({ type: "HEADER", format: header.format, example: { header_handle: [header.media_handle] } });
  }

  const body = tpl.body || {};
  const bodyComp = { type: "BODY", text: body.text || "" };
  const bodyPositions = extractVariablePositions(body.text);
  if (bodyPositions.length > 0) {
    const samples = bodyPositions.map((p) => body.variables?.find((v) => v.position === p)?.sample || "");
    bodyComp.example = { body_text: [samples] };
  }
  components.push(bodyComp);

  if (tpl.footer?.text?.trim()) {
    components.push({ type: "FOOTER", text: tpl.footer.text.trim() });
  }

  const metaButtons = buildMetaButtons(tpl.buttons, MAX_BUTTONS);
  if (metaButtons.length > 0) components.push({ type: "BUTTONS", buttons: metaButtons });

  if (tpl.carousel?.cards?.length) {
    const cards = tpl.carousel.cards.map((card, i) => {
      const cardComponents = [];
      const cardHeader = card.header || {};
      if (MEDIA_HEADER_FORMATS.includes(cardHeader.format) && cardHeader.media_handle) {
        cardComponents.push({ type: "HEADER", format: cardHeader.format, example: { header_handle: [cardHeader.media_handle] } });
      }
      const cardBody = card.body || {};
      const cardBodyComp = { type: "BODY", text: cardBody.text || "" };
      const cardBodyPositions = extractVariablePositions(cardBody.text);
      if (cardBodyPositions.length > 0) {
        cardBodyComp.example = { body_text: [cardBodyPositions.map((p) => cardBody.variables?.find((v) => v.position === p)?.sample || "")] };
      }
      cardComponents.push(cardBodyComp);
      const cardButtons = buildMetaButtons(card.buttons, MAX_CAROUSEL_CARD_BUTTONS);
      if (cardButtons.length > 0) cardComponents.push({ type: "BUTTONS", buttons: cardButtons });
      return { card_index: i, components: cardComponents };
    });
    components.push({ type: "CAROUSEL", cards });
  }

  return components;
}

// Shared by the main template's buttons and each carousel card's — turns
// the CRM's button config into Meta's BUTTONS component array shape.
function buildMetaButtons(rawButtons, max) {
  const buttons = Array.isArray(rawButtons) ? rawButtons.filter((b) => b?.text?.trim()).slice(0, max) : [];
  return buttons.map((b) => {
    if (b.type === "URL") {
      const btn = { type: "URL", text: b.text.trim(), url: (b.url || "").trim() };
      const urlPositions = extractVariablePositions(b.url);
      if (urlPositions.length === 1 && b.url_example?.trim()) btn.example = [b.url_example.trim()];
      return btn;
    }
    if (b.type === "PHONE_NUMBER") {
      return { type: "PHONE_NUMBER", text: b.text.trim(), phone_number: (b.phone_number || "").trim() };
    }
    return { type: "QUICK_REPLY", text: b.text.trim() };
  });
}

module.exports = {
  CATEGORIES,
  HEADER_FORMATS,
  MEDIA_HEADER_FORMATS,
  BUTTON_TYPES,
  MAX_BUTTONS,
  MIN_CAROUSEL_CARDS,
  MAX_CAROUSEL_CARDS,
  MAX_CAROUSEL_CARD_BUTTONS,
  slugifyTemplateName,
  isValidTemplateName,
  extractVariablePositions,
  isSequential,
  validateTemplate,
  buildMetaComponents,
};
