const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "order-attachments");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Payment screenshots and PDF reports only — anything else (e.g. an
// uploaded .html/.svg) would be a stored-XSS risk once served statically.
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  // Random filename — the URL is unauthenticated, so it must not be
  // guessable from the order id alone.
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomBytes(20).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) return cb(new Error("Only JPG, PNG, WEBP or PDF files are allowed"));
    cb(null, true);
  },
});

module.exports = upload;
