// Mobile/tablet horizontal-overflow checker. Loads each given page in headless
// Chromium at several viewport widths and reports any element whose VISIBLE
// (i.e. not already clipped invisible by some ancestor's overflow:hidden) box
// extends past the viewport edge — the exact "content bahar ja raha hai" bug.
//
// Deliberately does NOT rely on document.documentElement.scrollWidth, because
// an `overflow-x:hidden` band-aid on html/body/.mk-page makes that metric
// always equal clientWidth even when real content is too wide — it only hides
// the symptom. Walking every element's clipped bounding box catches the
// actual bug regardless of whether something upstream is masking it.
//
// Usage: node scripts/check-overflow.js [--base=http://localhost:3000] [--shots]
// CRM pages: set LOGIN_EMAIL / LOGIN_PASSWORD env vars to include them.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = (process.argv.find((a) => a.startsWith("--base=")) || "--base=http://localhost:3000").split("=")[1];
const TAKE_SHOTS = process.argv.includes("--shots");
const SHOT_DIR = path.join(__dirname, "..", "overflow-shots");

const WIDTHS = [360, 390, 412, 480, 768, 1024];

const MARKETING_PAGES = [
  "/", "/features", "/solutions", "/automation-suite", "/pricing",
  "/contact", "/docs", "/terms", "/privacy", "/refund-policy",
  "/help-center", "/about",
];

const CRM_PAGES = [
  "/dashboard", "/leads", "/customers", "/customers/trash", "/inventory",
  "/employees", "/settings", "/reports", "/whatsapp", "/whatsapp-templates",
  "/whatsapp-templates/builder", "/plans", "/automation", "/notifications",
  "/unverified-leads", "/ignored-followups",
];

// Runs inside the page. Returns only elements whose EFFECTIVE visible rect
// (after intersecting with every ancestor's overflow-clip box) still pokes
// past the viewport — i.e. a real, visible bug, not a decorative element
// that's already fully hidden by a parent's `overflow: hidden`.
function findOffenders() {
  const vw = window.innerWidth;

  function clippedRect(el) {
    const rect = el.getBoundingClientRect();
    let r = { left: rect.left, right: rect.right };
    let node = el.parentElement;
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      if (cs.overflowX === "hidden" || cs.overflowX === "clip" || cs.overflow === "hidden" || cs.overflow === "clip") {
        const pr = node.getBoundingClientRect();
        r.left = Math.max(r.left, pr.left);
        r.right = Math.min(r.right, pr.right);
        if (r.right <= r.left) return null;
      }
      node = node.parentElement;
    }
    return r;
  }

  const offenders = [];
  const all = document.querySelectorAll("body *");
  for (const el of all) {
    const raw = el.getBoundingClientRect();
    if (raw.width === 0 && raw.height === 0) continue;
    if (raw.right <= vw + 1 && raw.left >= -1) continue; // fast skip, not even raw-overflowing
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const r = clippedRect(el);
    if (!r) continue; // fully clipped away by an ancestor — invisible, not a real bug
    if (r.right > vw + 1 || r.left < -1) {
      offenders.push({
        tag: el.tagName,
        cls: typeof el.className === "string" ? el.className.slice(0, 80) : "",
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(raw.width),
        overshoot: Math.round(Math.max(r.right - vw, -r.left)),
      });
    }
  }
  offenders.sort((a, b) => b.overshoot - a.overshoot);
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    offenderCount: offenders.length,
    topOffenders: offenders.slice(0, 6),
  };
}

async function checkOnPage(page, url, width, shotPrefix) {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(400); // let fonts/animations settle
    const metrics = await page.evaluate(findOffenders);
    const overflow = metrics.offenderCount > 0;
    let shotPath = null;
    if (overflow && TAKE_SHOTS) {
      fs.mkdirSync(SHOT_DIR, { recursive: true });
      const safe = (shotPrefix + url).replace(/[^a-z0-9]/gi, "_") || "root";
      shotPath = path.join(SHOT_DIR, `${safe}_${width}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
    }
    return { url, width, overflow, metrics, shotPath, error: null };
  } catch (e) {
    return { url, width, overflow: null, metrics: null, shotPath: null, error: e.message };
  }
}

async function login(browser) {
  const email = process.env.LOGIN_EMAIL;
  const password = process.env.LOGIN_PASSWORD;
  if (!email || !password) return null;
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  const cookies = await context.cookies();
  await context.close();
  return cookies;
}

(async () => {
  const browser = await chromium.launch();
  const results = [];

  for (const p of MARKETING_PAGES) {
    for (const w of WIDTHS) {
      const context = await browser.newContext({ viewport: { width: w, height: 900 } });
      const page = await context.newPage();
      results.push(await checkOnPage(page, `${BASE}${p}`, w, "mk_"));
      await context.close();
    }
  }

  const cookies = await login(browser);
  if (cookies) {
    // Grab one real customer id so the detail page (dynamic route, not in
    // the static CRM_PAGES list) gets checked too.
    const pagesToCheck = [...CRM_PAGES];
    try {
      const probeCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await probeCtx.addCookies(cookies);
      const probePage = await probeCtx.newPage();
      await probePage.goto(`${BASE}/customers`, { waitUntil: "networkidle", timeout: 30000 });
      await probePage.waitForTimeout(800);
      const firstRow = probePage.locator("table tbody tr").first();
      if (await firstRow.count()) {
        await firstRow.click();
        await probePage.waitForTimeout(800);
        const url = probePage.url();
        const m = url.match(/\/customers\/(\d+)/);
        if (m) pagesToCheck.push(`/customers/${m[1]}`);
      }
      await probeCtx.close();
    } catch (e) {
      console.log("Could not probe a real customer id:", e.message);
    }

    for (const p of pagesToCheck) {
      for (const w of WIDTHS) {
        const context = await browser.newContext({ viewport: { width: w, height: 900 } });
        await context.addCookies(cookies);
        const page = await context.newPage();
        results.push(await checkOnPage(page, `${BASE}${p}`, w, "crm_"));
        await context.close();
      }
    }
  } else {
    results.push({ url: "(CRM pages)", width: "-", overflow: null, metrics: null, shotPath: null, error: "LOGIN_EMAIL/LOGIN_PASSWORD not set — CRM pages skipped" });
  }

  await browser.close();

  const fails = results.filter((r) => r.overflow === true);
  const errors = results.filter((r) => r.error);

  console.log("\n=== OVERFLOW CHECK RESULTS ===\n");
  for (const r of results) {
    if (r.error) {
      console.log(`ERROR  ${r.url}  @${r.width}px  — ${r.error}`);
    } else {
      const tag = r.overflow ? "FAIL" : "ok  ";
      console.log(`${tag}   ${r.url}  @${r.width}px  scrollWidth=${r.metrics.scrollWidth} clientWidth=${r.metrics.clientWidth} offenders=${r.metrics.offenderCount || 0}${r.shotPath ? "  [screenshot: " + r.shotPath + "]" : ""}`);
      if (r.metrics.topOffenders && r.metrics.topOffenders.length) {
        for (const o of r.metrics.topOffenders) {
          console.log(`         +${o.overshoot}px  <${o.tag.toLowerCase()} class="${o.cls}">  left=${o.left} right=${o.right} width=${o.width}`);
        }
      }
    }
  }

  console.log(`\n${fails.length} overflow failure(s) out of ${results.length - errors.length} checks.`);
  if (errors.length) console.log(`${errors.length} error(s) (see ERROR lines above).`);

  fs.writeFileSync(path.join(__dirname, "..", "overflow-report.json"), JSON.stringify(results, null, 2));
  process.exit(fails.length > 0 ? 1 : 0);
})();
