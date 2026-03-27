const express = require("express");
const multer = require("multer");
const path = require("path");

const detectPII = require("../utils/piiDetector");
const { redactDocxFile } = require("../utils/redactor");

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

const uploadPath = path.join(__dirname, "../uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });


/*
  ============================
  Upload & Extract Route
  ============================
*/

router.post("/upload", upload.single("document"), async (req, res) => {

  try {

    /* 1️⃣ Check file upload */

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();


    /* 2️⃣ Validate file type */

    const allowedTypes = [".pdf", ".docx"];

    if (!allowedTypes.includes(fileExtension)) {
      return res.status(400).json({
        message: "Only PDF and DOCX files are allowed"
      });
    }


    /* 3️⃣ Extract text */

    let extractedText = "";

    if (fileExtension === ".pdf") {
      extractedText = await extractTextFromPDF(filePath);
    }

    if (fileExtension === ".docx") {
      extractedText = await extractTextFromDOCX(filePath);
    }


    /* ============================
       4️⃣ Detect PII
       ============================ */

    const detectedPII = detectPII(extractedText);

    const hasPII = Object.keys(detectedPII).length > 0;


    /* ============================
       5️⃣ If no PII detected
       ============================ */

    if (!hasPII) {

      return res.json({
        message: "No PII detected in the document",
        detectedPII: {},
        redactedFile: null
      });

    }


    /* ============================
       6️⃣ Redact DOCX (preserve layout)
       ============================ */

    const redactedFilePath = await redactDocxFile(filePath, detectedPII);


    /* ============================
       7️⃣ Send response
       ============================ */

    res.json({
      message: "File uploaded, PII detected and redacted successfully",
      fileType: fileExtension,
      textLength: extractedText.length,
      detectedPII,
      redactedFile: redactedFilePath
    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error processing document"
    });

  }

});

module.exports = router; 