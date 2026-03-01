const express = require("express");
const multer = require("multer");
const path = require("path");

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
    cb(null, "backend/uploads");
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

    // 2️⃣ Allowed file types validation
    const allowedTypes = [".pdf", ".docx"];
    if (!allowedTypes.includes(fileExtension)) {
      return res.status(400).json({
        message: "Only PDF and DOCX files are allowed"
      });
    }

    let extractedText = "";

    // 3️⃣ Extract text based on file type
        // NOTE: PDF extraction is currently abstracted due to Node.js compatibility issues.
        // The design allows easy replacement with a stable PDF parser in future.
    if (fileExtension === ".pdf") {
      extractedText = await extractTextFromPDF(filePath);
    } else if (fileExtension === ".docx") {
      extractedText = await extractTextFromDOCX(filePath);
    }

    // 4️⃣ Print extracted text in console (debugging)
    console.log("===== EXTRACTED TEXT START =====");
    console.log(extractedText);
    console.log("===== EXTRACTED TEXT END =====");

    // 5️⃣ Send success response
    res.json({
      message: "File uploaded and text extracted successfully",
      fileType: fileExtension,
      textLength: extractedText.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error extracting text"
    });
  }
});

module.exports = router;