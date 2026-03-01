const piiPatterns = require("./piiPatterns");

/**
 * Detect PII from extracted text
 */
function detectPII(text) {
  const detectedPII = {};

  for (const key in piiPatterns) {
    const matches = text.match(piiPatterns[key]);
    if (matches && matches.length > 0) {
      detectedPII[key] = matches;
    }
  }

  return detectedPII;
}

module.exports = detectPII;