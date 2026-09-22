const PDFDocument = require("pdfkit");

const BLUE = "#1a5cff";
const BLUE_DARK = "#0f47d6";
const INK = "#1a1f2e";
const MUTED = "#6b7280";
const LIGHT = "#f4f6fb";
const BORDER = "#e2e8f0";

const PAGE_LEFT = 50;
const PAGE_RIGHT = 545;
const PAGE_WIDTH = PAGE_RIGHT - PAGE_LEFT;

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// pdfkit's built-in fonts (Helvetica etc.) only cover WinAnsi/Latin-1, which
// does NOT include ₹ (U+20B9) — trying to render it silently substitutes a
// wrong glyph (shows up as a stray "1"). Swapping in "Rs." only for that one
// symbol avoids needing to embed a whole Unicode font just for this.
function money(n, symbol) {
  const amt = (parseFloat(n) || 0).toFixed(2);
  const s = symbol === "₹" ? "Rs. " : symbol || "";
  return `${s}${amt}`;
}

// Best-effort logo fetch — a bad/unreachable logo_url should never break
// invoice generation, just render without one.
async function fetchLogoBuffer(url) {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

// A right-aligned "label ... value" row where both columns have their own
// fixed width, so a long label can never run into the value — the overlap
// bug in the previous version came from drawing both at the same fixed x
// with no width/alignment guard.
function totalsRow(doc, label, value, y, { bold = false, color = INK } = {}) {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10);
  doc.fillColor(MUTED).text(label, 330, y, { width: 130, align: "left" });
  doc.fillColor(color).text(value, 460, y, { width: 85, align: "right" });
}

async function streamOrderInvoice(res, { seller, customer, order, items, currencySymbol }) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  const symbol = currencySymbol || "₹";
  const invoiceNo = `INV-${String(order.id).padStart(5, "0")}`;
  const logoBuffer = await fetchLogoBuffer(seller.logoUrl);

  // ── Header band ───────────────────────────────────────────────
  let sellerTextX = PAGE_LEFT;
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, PAGE_LEFT, 45, { fit: [64, 64] });
      sellerTextX = PAGE_LEFT + 78;
    } catch {
      // Not a decodable image (unsupported format, corrupt fetch, etc.) —
      // fall through and render the header without it.
    }
  }
  doc.font("Helvetica-Bold").fontSize(18).fillColor(INK).text(seller.name || "Invoice", sellerTextX, 48, { width: 260 });
  doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
  const sellerLines = [seller.addressLine, seller.cityLine, seller.phone, seller.email].filter(Boolean);
  let sy = doc.y + 2;
  for (const line of sellerLines) {
    doc.text(line, sellerTextX, sy, { width: 260 });
    sy = doc.y + 1;
  }

  doc.font("Helvetica-Bold").fontSize(20).fillColor(BLUE).text("INVOICE", 330, 48, { width: 215, align: "right" });
  doc.font("Helvetica").fontSize(9).fillColor(MUTED);
  doc.text(`Invoice #: ${invoiceNo}`, 330, doc.y + 6, { width: 215, align: "right" });
  doc.text(`Invoice Date: ${fmtDate(new Date())}`, 330, doc.y, { width: 215, align: "right" });
  doc.text(`Order Date: ${fmtDate(order.created_at)}`, 330, doc.y, { width: 215, align: "right" });

  const afterHeaderY = Math.max(sy, doc.y) + 18;
  doc.moveTo(PAGE_LEFT, afterHeaderY).lineTo(PAGE_RIGHT, afterHeaderY).lineWidth(1.5).strokeColor(BLUE).stroke();

  // ── Bill To / Shipment info ──────────────────────────────────
  const infoTop = afterHeaderY + 20;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text("BILL TO", PAGE_LEFT, infoTop);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text(customer.name || "—", PAGE_LEFT, infoTop + 14, { width: 260 });
  doc.font("Helvetica").fontSize(9).fillColor(MUTED);
  let by = doc.y + 3;
  if (customer.phone) {
    doc.text(customer.phone, PAGE_LEFT, by, { width: 260 });
    by = doc.y + 1;
  }
  if (order.address) {
    doc.text(order.address, PAGE_LEFT, by, { width: 260 });
    by = doc.y + 1;
  }
  const cityLine = [order.city, order.state, order.pincode].filter(Boolean).join(", ");
  if (cityLine) {
    doc.text(cityLine, PAGE_LEFT, by, { width: 260 });
    by = doc.y + 1;
  }

  doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text("SHIPMENT", 330, infoTop, { width: 215 });
  doc.font("Helvetica").fontSize(9).fillColor(INK);
  let sy2 = infoTop + 14;
  doc.text(`Payment: ${order.payment_type === "cod" ? "Cash on Delivery" : "Prepaid"}`, 330, sy2, { width: 215, align: "left" });
  sy2 = doc.y + 3;
  doc.fillColor(MUTED);
  if (order.tracking_id) {
    doc.text(`Tracking ID: ${order.tracking_id}`, 330, sy2, { width: 215 });
    sy2 = doc.y + 1;
  }
  if (order.provider) {
    doc.text(`Courier: ${order.provider}`, 330, sy2, { width: 215 });
    sy2 = doc.y + 1;
  }

  // ── Items table ──────────────────────────────────────────────
  let y = Math.max(by, sy2) + 26;
  doc.rect(PAGE_LEFT, y, PAGE_WIDTH, 24).fill(BLUE);
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff");
  doc.text("ITEM", PAGE_LEFT + 10, y + 8, { width: 260 });
  doc.text("QTY", 330, y + 8, { width: 50, align: "right" });
  doc.text("PRICE", 390, y + 8, { width: 70, align: "right" });
  doc.text("TOTAL", 470, y + 8, { width: 75, align: "right" });
  y += 24;

  const rows = items.length ? items : [{ name: "Order", quantity: 1, price: order.amount }];
  doc.font("Helvetica").fontSize(9.5);
  for (let i = 0; i < rows.length; i++) {
    const item = rows[i];
    const qty = parseInt(item.quantity) || 1;
    const price = parseFloat(item.price) || 0;
    const lineTotal = qty * price;
    const rowHeight = 24;
    if (i % 2 === 1) doc.rect(PAGE_LEFT, y, PAGE_WIDTH, rowHeight).fill(LIGHT);
    doc.fillColor(INK);
    doc.text(item.name || "Item", PAGE_LEFT + 10, y + 7, { width: 260 });
    doc.text(String(qty), 330, y + 7, { width: 50, align: "right" });
    doc.text(money(price, symbol), 390, y + 7, { width: 70, align: "right" });
    doc.text(money(lineTotal, symbol), 470, y + 7, { width: 75, align: "right" });
    y += rowHeight;
  }
  doc.moveTo(PAGE_LEFT, y).lineTo(PAGE_RIGHT, y).strokeColor(BORDER).stroke();

  // ── Totals ───────────────────────────────────────────────────
  const amount = parseFloat(order.amount) || 0;
  const advance = parseFloat(order.advance_paid) || 0;
  const balance = Math.max(0, amount - advance);

  // The item lines are priced at their catalog rate — if the order was
  // actually agreed at a lower total (a manually discounted price), that
  // gap is a real discount and should be shown as one line item with both
  // the rupee amount and the percentage off, not just a total that looks
  // "wrong" next to the item prices above it.
  const itemsSubtotal = rows.reduce((s, item) => s + (parseInt(item.quantity) || 1) * (parseFloat(item.price) || 0), 0);
  const discount = Math.max(0, itemsSubtotal - amount);
  const discountPct = itemsSubtotal > 0 ? (discount / itemsSubtotal) * 100 : 0;

  y += 16;
  if (discount > 0.01) {
    totalsRow(doc, "Subtotal", money(itemsSubtotal, symbol), y);
    y += 18;
    totalsRow(doc, `Discount (${discountPct.toFixed(discountPct % 1 === 0 ? 0 : 1)}%)`, `- ${money(discount, symbol)}`, y, {
      color: "#15803d",
    });
    y += 18;
    doc.moveTo(330, y - 4).lineTo(PAGE_RIGHT, y - 4).strokeColor(BORDER).stroke();
    y += 4;
  }
  totalsRow(doc, "Order Total", money(amount, symbol), y, { bold: discount > 0.01 });
  y += 18;
  totalsRow(doc, order.payment_type === "cod" ? "Advance Collected" : "Amount Paid", money(advance, symbol), y);
  y += 18;
  doc.moveTo(330, y - 4).lineTo(PAGE_RIGHT, y - 4).strokeColor(BORDER).stroke();
  totalsRow(doc, "Balance Due", money(balance, symbol), y + 2, {
    bold: true,
    color: balance > 0 ? "#b91c1c" : "#15803d",
  });

  // ── Footer ───────────────────────────────────────────────────
  doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(
    "Thank you for your business! This is a system-generated invoice and does not require a signature.",
    PAGE_LEFT,
    760,
    { align: "center", width: PAGE_WIDTH },
  );

  doc.end();
}

module.exports = { streamOrderInvoice };
