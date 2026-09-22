const PDFDocument = require("pdfkit");

const BLUE = "#1a5cff";
const INK = "#0f1b33";
const MUTED = "#6b7280";
const BORDER = "#e2e8f0";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtMoney(n, symbol) {
  return `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;
}

// Renders a simple, single-page order invoice straight to the given
// writable stream (an Express response). No external template engine or
// headless browser — pdfkit draws it directly, which is enough for a
// standard sale-receipt-style document and keeps this dependency-light.
function streamOrderInvoice(res, { seller, customer, order, items, currencySymbol }) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  const symbol = currencySymbol || "₹";
  const invoiceNo = `INV-${order.id}`;

  // ── Header ──────────────────────────────────────────────────────
  doc.fontSize(20).fillColor(BLUE).text(seller.name || "Invoice", { continued: false });
  doc.fontSize(9).fillColor(MUTED);
  if (seller.email) doc.text(seller.email);
  doc.moveDown(1.2);

  doc.fontSize(16).fillColor(INK).text("TAX INVOICE", { align: "right" });
  doc.fontSize(9).fillColor(MUTED).text(`Invoice #: ${invoiceNo}`, { align: "right" });
  doc.text(`Invoice Date: ${fmtDate(new Date())}`, { align: "right" });
  doc.text(`Order Date: ${fmtDate(order.created_at)}`, { align: "right" });
  doc.moveDown(1.5);

  // ── Bill To ─────────────────────────────────────────────────────
  const billToTop = doc.y;
  doc.fontSize(10).fillColor(MUTED).text("BILL TO", 50, billToTop);
  doc.fontSize(11).fillColor(INK).text(customer.name || "—", 50, billToTop + 14, { width: 250 });
  doc.fontSize(9).fillColor(MUTED);
  if (customer.phone) doc.text(customer.phone, 50, doc.y);
  if (order.address) doc.text(order.address, 50, doc.y, { width: 250 });
  const cityLine = [order.city, order.state, order.pincode].filter(Boolean).join(", ");
  if (cityLine) doc.text(cityLine, 50, doc.y, { width: 250 });

  doc.fontSize(10).fillColor(MUTED).text("SHIPMENT", 320, billToTop, { width: 220 });
  doc.fontSize(9).fillColor(INK);
  doc.text(`Payment: ${order.payment_type === "cod" ? "Cash on Delivery" : "Prepaid"}`, 320, doc.y === billToTop ? billToTop + 14 : doc.y, { width: 220 });
  doc.fillColor(MUTED);
  if (order.tracking_id) doc.text(`Tracking ID: ${order.tracking_id}`, 320, doc.y, { width: 220 });
  if (order.provider) doc.text(`Courier: ${order.provider}`, 320, doc.y, { width: 220 });

  doc.moveDown(3);

  // ── Items table ─────────────────────────────────────────────────
  const tableTop = doc.y + 10;
  const col = { item: 50, qty: 330, price: 400, total: 470 };
  doc.rect(50, tableTop, 495, 22).fill("#f4f6fb");
  doc.fillColor(INK).fontSize(9);
  doc.text("ITEM", col.item + 8, tableTop + 6);
  doc.text("QTY", col.qty, tableTop + 6);
  doc.text("PRICE", col.price, tableTop + 6);
  doc.text("TOTAL", col.total, tableTop + 6);

  let y = tableTop + 22;
  doc.fontSize(9.5).fillColor(INK);
  const rows = items.length ? items : [{ name: "Order", quantity: 1, price: order.amount }];
  for (const item of rows) {
    const qty = parseInt(item.quantity) || 1;
    const price = parseFloat(item.price) || 0;
    const lineTotal = qty * price;
    doc.text(item.name || "Item", col.item + 8, y + 6, { width: 260 });
    doc.text(String(qty), col.qty, y + 6);
    doc.text(fmtMoney(price, symbol), col.price, y + 6);
    doc.text(fmtMoney(lineTotal, symbol), col.total, y + 6);
    y += 22;
    doc.moveTo(50, y).lineTo(545, y).strokeColor(BORDER).stroke();
  }

  // ── Totals ──────────────────────────────────────────────────────
  const amount = parseFloat(order.amount) || 0;
  const advance = parseFloat(order.advance_paid) || 0;
  const balance = Math.max(0, amount - advance);

  y += 14;
  doc.fontSize(9.5).fillColor(MUTED).text("Order Total", col.price, y);
  doc.fillColor(INK).text(fmtMoney(amount, symbol), col.total, y);
  y += 16;
  doc.fillColor(MUTED).text(order.payment_type === "cod" ? "Advance Collected" : "Amount Paid", col.price, y);
  doc.fillColor(INK).text(fmtMoney(advance, symbol), col.total, y);
  y += 16;
  doc.fillColor(MUTED).text("Balance Due", col.price, y);
  doc.fillColor(balance > 0 ? "#b91c1c" : "#15803d").text(fmtMoney(balance, symbol), col.total, y);

  // ── Footer ──────────────────────────────────────────────────────
  doc.fontSize(8.5).fillColor(MUTED).text(
    "This is a system-generated invoice and does not require a signature.",
    50,
    760,
    { align: "center", width: 495 },
  );

  doc.end();
}

module.exports = { streamOrderInvoice };
