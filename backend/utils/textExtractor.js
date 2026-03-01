const fs = require("fs");
const mammoth = require("mammoth");

/**
 * Extract text from PDF file (TEMPORARY MOCK)
 * This keeps pipeline working and is replaceable later
 */
async function extractTextFromPDF(filePath) {
  // Temporary safe fallback
  return "[PDF TEXT EXTRACTION MODULE PLACEHOLDER]";
}

/**
 * Extract text from DOCX file (REAL, WORKING)
 */
async function extractTextFromDOCX(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error("Failed to extract text from DOCX");
  }
}

module.exports = {
  extractTextFromPDF,
  extractTextFromDOCX,
};