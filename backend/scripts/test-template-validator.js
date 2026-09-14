// Standalone validation test for MetaTemplateValidator — this project has no
// test framework (no Jest/Mocha/Vitest anywhere), so this follows the same
// plain-Node-script convention used throughout the codebase's own
// verification scripts. Run with: node backend/scripts/test-template-validator.js
const assert = require("assert");
const { validateTemplate, slugifyTemplateName, extractVariablePositions, isSequential } = require("../utils/meta-template-validator");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

const VALID_BASE = {
  name: "summer_sale_2026",
  category: "MARKETING",
  language: "en_US",
  header: { format: "NONE" },
  body: { text: "Hi {{1}}, your order {{2}} is confirmed.", variables: [{ position: 1, sample: "Rahul" }, { position: 2, sample: "ORD123" }] },
  footer: { text: "Reply STOP to opt out" },
  buttons: [],
};

console.log("MetaTemplateValidator tests\n");

test("valid minimal template passes", () => {
  const r = validateTemplate(VALID_BASE);
  assert.strictEqual(r.valid, true, JSON.stringify(r.errors));
});

test("invalid name (spaces/caps) is rejected", () => {
  const r = validateTemplate({ ...VALID_BASE, name: "Summer Sale!!" });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "name"));
});

test("slugify produces a Meta-safe name", () => {
  assert.strictEqual(slugifyTemplateName("Summer Sale 2026!!"), "summer_sale_2026");
});

test("missing category is rejected", () => {
  const r = validateTemplate({ ...VALID_BASE, category: undefined });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "category"));
});

test("missing language is rejected", () => {
  const r = validateTemplate({ ...VALID_BASE, language: "" });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "language"));
});

test("missing body text is rejected", () => {
  const r = validateTemplate({ ...VALID_BASE, body: { text: "" } });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "body"));
});

test("non-sequential body variables are rejected ({{1}}, {{3}} skipping {{2}})", () => {
  const r = validateTemplate({ ...VALID_BASE, body: { text: "Hi {{1}}, code {{3}}", variables: [] } });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "body" && /sequential/.test(e.message)));
});

test("variable missing a sample value is rejected", () => {
  const r = validateTemplate({ ...VALID_BASE, body: { text: "Hi {{1}}", variables: [{ position: 1, sample: "" }] } });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "body" && /sample/.test(e.message)));
});

test("header with more than one variable is rejected", () => {
  const r = validateTemplate({ ...VALID_BASE, header: { format: "TEXT", text: "Hi {{1}} {{2}}", variables: [{ position: 1, sample: "A" }, { position: 2, sample: "B" }] } });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "header"));
});

test("footer with a variable is rejected", () => {
  const r = validateTemplate({ ...VALID_BASE, footer: { text: "Bye {{1}}" } });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "footer"));
});

test("more than 3 buttons is rejected", () => {
  const r = validateTemplate({ ...VALID_BASE, buttons: [
    { type: "QUICK_REPLY", text: "A" }, { type: "QUICK_REPLY", text: "B" },
    { type: "QUICK_REPLY", text: "C" }, { type: "QUICK_REPLY", text: "D" },
  ] });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "buttons" && /at most 3/i.test(e.message)));
});

test("two URL buttons is rejected (Meta allows at most one)", () => {
  const r = validateTemplate({ ...VALID_BASE, buttons: [
    { type: "URL", text: "Shop", url: "https://a.com" },
    { type: "URL", text: "Shop 2", url: "https://b.com" },
  ] });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "buttons" && /one Website/.test(e.message)));
});

test("URL button without http/https is rejected", () => {
  const r = validateTemplate({ ...VALID_BASE, buttons: [{ type: "URL", text: "Shop", url: "example.com" }] });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "buttons" && /http/.test(e.message)));
});

test("dynamic URL button missing its example value is rejected", () => {
  const r = validateTemplate({ ...VALID_BASE, buttons: [{ type: "URL", text: "Track", url: "https://a.com/{{1}}", url_example: "" }] });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "buttons" && /sample value for the dynamic URL/.test(e.message)));
});

test("valid dynamic URL button with example passes", () => {
  const r = validateTemplate({ ...VALID_BASE, buttons: [{ type: "URL", text: "Track", url: "https://a.com/{{1}}", url_example: "ORD1" }] });
  assert.strictEqual(r.valid, true, JSON.stringify(r.errors));
});

test("phone button with an invalid number is rejected", () => {
  const r = validateTemplate({ ...VALID_BASE, buttons: [{ type: "PHONE_NUMBER", text: "Call", phone_number: "abc" }] });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "buttons" && /valid phone number/.test(e.message)));
});

test("extractVariablePositions finds and dedupes {{n}}", () => {
  assert.deepStrictEqual(extractVariablePositions("Hi {{1}} order {{2}} again {{1}}"), [1, 2]);
});

test("isSequential rejects gaps", () => {
  assert.strictEqual(isSequential([1, 2, 3]), true);
  assert.strictEqual(isSequential([1, 3]), false);
});

const CAROUSEL_CARD = {
  header: { format: "IMAGE", media_handle: "handle123" },
  body: { text: "Black Formal Derby ₹899", variables: [] },
  buttons: [{ type: "QUICK_REPLY", text: "Shop Now" }],
};

test("carousel on a non-MARKETING category is rejected", () => {
  const r = validateTemplate({ ...VALID_BASE, category: "UTILITY", carousel: { cards: [CAROUSEL_CARD, CAROUSEL_CARD] } });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "carousel" && /Marketing/.test(e.message)));
});

test("carousel with only 1 card is rejected (needs at least 2)", () => {
  const r = validateTemplate({ ...VALID_BASE, carousel: { cards: [CAROUSEL_CARD] } });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "carousel" && /between 2 and 10/.test(e.message)));
});

test("carousel card with a TEXT header is rejected (must be image/video)", () => {
  const badCard = { ...CAROUSEL_CARD, header: { format: "TEXT", text: "Hi" } };
  const r = validateTemplate({ ...VALID_BASE, carousel: { cards: [badCard, CAROUSEL_CARD] } });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "carousel" && /image or video header/.test(e.message)));
});

test("carousel card missing body text is rejected", () => {
  const badCard = { ...CAROUSEL_CARD, body: { text: "" } };
  const r = validateTemplate({ ...VALID_BASE, carousel: { cards: [badCard, CAROUSEL_CARD] } });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => e.field === "carousel" && /body text is required/.test(e.message)));
});

test("valid 2-card carousel passes", () => {
  const r = validateTemplate({ ...VALID_BASE, carousel: { cards: [CAROUSEL_CARD, CAROUSEL_CARD] } });
  assert.strictEqual(r.valid, true, JSON.stringify(r.errors));
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
