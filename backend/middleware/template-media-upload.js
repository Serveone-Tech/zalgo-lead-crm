const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Separate from whatsapp-upload.js (outbound message attachments) — this is
// specifically for template header *examples*, which Meta reviews once and
// then keeps its own copy of. Kept on our own disk too so the builder can
// still show the image/video/document in the preview and on re-edit.
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "whatsapp-template-media");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Meta's own per-format limits for template header examples.
const LIMITS_BY_FORMAT = {
  IMAGE: { maxSize: 5 * 1024 * 1024, mimes: ["image/jpeg", "image/png"] },
  VIDEO: { maxSize: 16 * 1024 * 1024, mimes: ["video/mp4", "video/3gpp"] },
  DOCUMENT: { maxSize: 100 * 1024 * 1024, mimes: ["application/pdf"] },
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomBytes(20).toString("hex")}${ext}`);
  },
});

const templateMediaUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // widest of the three; per-format size is re-checked in the route
  fileFilter: (req, file, cb) => {
    const format = (req.query.format || "").toUpperCase();
    const limits = LIMITS_BY_FORMAT[format];
    if (!limits) return cb(new Error("Specify ?format=IMAGE|VIDEO|DOCUMENT"));
    if (!limits.mimes.includes(file.mimetype)) {
      return cb(new Error(`${format} headers accept ${limits.mimes.join(", ")} — got ${file.mimetype}`));
    }
    cb(null, true);
  },
});

module.exports = { templateMediaUpload, UPLOAD_DIR, LIMITS_BY_FORMAT };
