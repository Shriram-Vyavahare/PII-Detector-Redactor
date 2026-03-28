const express = require("express");
const multer  = require("multer");
const path    = require("path");

const detectPII = require("../utils/piiDetector");

const {
  redactText,
  saveRedactedPDF,
  saveRedactedDocxAsPDF,
} = require("../utils/redactor");

const { extractTextFromPDF, extractTextFromDOCX } = require("../utils/textExtractor");

const router  = express.Router();
const uploadPath = path.join(__dirname, "../uploads");

/* ── Multer ─────────────────────────────────────────────────────────────── */

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename:    (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

/* ── Route ──────────────────────────────────────────────────────────────── */

router.post("/upload", upload.single("document"), async (req, res) => {
  try {

    /* 1. Check file */
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath      = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    /* 2. Validate type */
    if (![".pdf", ".docx"].includes(fileExtension)) {
      return res.status(400).json({ message: "Only PDF and DOCX files are allowed" });
    }

    /* 3. Extract text for PII detection */
    let extractedText = "";
    if (fileExtension === ".pdf")  extractedText = await extractTextFromPDF(filePath);
    if (fileExtension === ".docx") extractedText = await extractTextFromDOCX(filePath);

    /* 4. Detect PII */
    const detectedPII = detectPII(extractedText);
    const hasPII      = Object.keys(detectedPII).length > 0;

    /* 5. No PII */
    if (!hasPII) {
      return res.json({
        message:      "No PII detected in the document",
        detectedPII:  {},
        redactedFile: null,
      });
    }

    /* 6. Redact → always a PDF output
     *
     *   PDF  → coordinate overlay directly on the original PDF
     *   DOCX → LibreOffice converts to PDF first (preserving all formatting),
     *           then coordinate overlay applied — identical quality to PDF input
     */
    let redactedFile = null;

    if (fileExtension === ".pdf") {
      redactedFile = await saveRedactedPDF(filePath, detectedPII);
    }

    if (fileExtension === ".docx") {
      redactedFile = await saveRedactedDocxAsPDF(filePath, detectedPII);
    }

    /* 7. Respond */
    res.json({
      message:      "File uploaded, PII detected and redacted successfully",
      fileType:     fileExtension,
      textLength:   extractedText.length,
      detectedPII,
      redactedFile,   // always a .pdf path
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error processing document" });
  }
});

module.exports = router;