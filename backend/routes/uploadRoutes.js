const express = require("express");
const multer  = require("multer");
const path    = require("path");
const { execFile } = require("child_process");

const detectPII = require("../utils/piiDetector");

const {
  redactText,
  saveRedactedPDF,
  saveRedactedDocxAsPDF,
} = require("../utils/redactor");

const { extractTextFromPDF, extractTextFromDOCX } = require("../utils/textExtractor");

const router     = express.Router();
const uploadPath = path.join(__dirname, "../uploads");
const pythonCmd  = process.platform === "win32" ? "python" : "python3";

/* ── Multer ─────────────────────────────────────────────────────────────── */

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename:    (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });


/* ── Report generator helper ─────────────────────────────────────────────── */

function generateReport(inputFilePath, detectedPII, originalFilename) {
  return new Promise((resolve, reject) => {
    const filename   = "report_" + Date.now() + ".pdf";
    const outputPath = path.join(uploadPath, filename);
    const scriptPath = path.join(__dirname, "../utils/report_generator.py");
    const piiJson    = JSON.stringify(detectedPII);

    execFile(
      pythonCmd,
      [scriptPath, inputFilePath, outputPath, piiJson, originalFilename],
      { maxBuffer: 20 * 1024 * 1024, shell: false },
      (error, stdout, stderr) => {
        if (error) {
          console.error("Report generator error:", stderr || error.message);
          return reject(new Error("Report generation failed: " + (stderr || error.message)));
        }
        const out = stdout.trim();
        if (out.startsWith("OK:")) {
          resolve("/uploads/" + filename);
        } else {
          reject(new Error("Report generation failed: unexpected output — " + out));
        }
      }
    );
  });
}


/* ── Upload & process route ──────────────────────────────────────────────── */

router.post("/upload", upload.single("document"), async (req, res) => {
  try {

    /* 1. Check file */
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath          = req.file.path;
    const fileExtension     = path.extname(req.file.originalname).toLowerCase();
    const originalFilename  = req.file.originalname;

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
        reportFile:   null,
      });
    }

    /* 6. Redact → always a PDF output (existing — unchanged) */
    let redactedFile = null;

    if (fileExtension === ".pdf") {
      redactedFile = await saveRedactedPDF(filePath, detectedPII);
    }
    if (fileExtension === ".docx") {
      redactedFile = await saveRedactedDocxAsPDF(filePath, detectedPII);
    }

    /* 7. Generate PII detection report (NEW — parallel, non-blocking) */
    let reportFile = null;
    try {
      reportFile = await generateReport(filePath, detectedPII, originalFilename);
    } catch (reportErr) {
      // Report failure must NOT affect the redacted file delivery
      console.error("Report generation failed (non-fatal):", reportErr.message);
    }

    /* 8. Respond */
    res.json({
      message:      "File uploaded, PII detected and redacted successfully",
      fileType:     fileExtension,
      textLength:   extractedText.length,
      detectedPII,
      redactedFile,   // existing field — unchanged
      reportFile,     // new field — null if report generation failed
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error processing document" });
  }
});

module.exports = router;