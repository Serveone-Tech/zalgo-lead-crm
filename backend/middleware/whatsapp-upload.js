const crypto = require("crypto");
const multer = require("multer");
const { UPLOAD_DIR } = require("../utils/whatsapp-media");

// What a tenant can send out — mirrors WhatsApp's own supported media
// mime types closely enough; Meta rejects anything it truly can't handle,
// which surfaces as a normal send-failure error rather than silently
// mangling the file.
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "audio/aac",
  "audio/mpeg",
  "audio/ogg",
  "audio/mp4",
  "video/mp4",
  "video/3gpp",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = require("path").extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomBytes(20).toString("hex")}${ext}`);
  },
});

const whatsappUpload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) return cb(new Error(`Unsupported file type: ${file.mimetype}`));
    cb(null, true);
  },
});

module.exports = whatsappUpload;
