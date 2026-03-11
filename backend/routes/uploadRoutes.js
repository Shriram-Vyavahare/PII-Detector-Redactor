const express = require("express");
const multer = require("multer");
const path = require("path");

const detectPII = require("../utils/piiDetector");
const { redactText, saveRedactedFile } = require("../utils/redactor");

const {
  extractTextFromPDF,
  extractTextFromDOCX
} = require("../utils/textExtractor");

const router = express.Router();

/*
  ============================
  Multer storage configuration
  ============================
*/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/*
  ============================
  Upload & Extract Route
  ============================
*/
router.post("/upload", upload.single("document"), async (req, res) => {
  try {

    // 1️⃣ Check if file exists
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    // 2️⃣ Validate allowed file types
    const allowedTypes = [".pdf", ".docx"];

    if (!allowedTypes.includes(fileExtension)) {
      return res.status(400).json({
        message: "Only PDF and DOCX files are allowed"
      });
    }

    let extractedText = "";

    // 3️⃣ Extract text
    // NOTE: PDF extraction currently placeholder (design ready for replacement)
    if (fileExtension === ".pdf") {
      extractedText = await extractTextFromPDF(filePath);
    } else if (fileExtension === ".docx") {
      extractedText = await extractTextFromDOCX(filePath);
    }

    // 4️⃣ Debug: Print extracted text
    console.log("===== EXTRACTED TEXT START =====");
    console.log(extractedText);
    console.log("===== EXTRACTED TEXT END =====");



    /* ============================
       5️⃣ Detect PII
       ============================ */

    const detectedPII = detectPII(extractedText);

    console.log("===== DETECTED PII START =====");
    console.log(detectedPII);
    console.log("===== DETECTED PII END =====");



    /* ============================
       6️⃣ Redact PII
       ============================ */

    const redactedText = redactText(extractedText, detectedPII);

    console.log("===== REDACTED TEXT START =====");
    console.log(redactedText);
    console.log("===== REDACTED TEXT END =====");



    /* ============================
       7️⃣ Save redacted document
       ============================ */

    saveRedactedFile(redactedText);

    const redactedFilePath = "/uploads/redacted_output.txt";



    /* ============================
       8️⃣ Send response
       ============================ */

    res.json({
      message: "File uploaded, PII detected and redacted successfully",
      fileType: fileExtension,
      textLength: extractedText.length,
      detectedPII,
      redactedFile: redactedFilePath
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error processing document"
    });

  }
});

router.get("/download", (req, res) => {

  const filePath = "D:/Downloads/redacted_document.txt";

  res.download(filePath, "redacted_document.txt", (err) => {

    if (err) {

      console.error("Download error:", err);
      res.status(500).send("File not found");

    }

  });

});

module.exports = router;

