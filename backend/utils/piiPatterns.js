/*
  ============================
  PII Detection Patterns
  Improved & Non-Overlapping
  ============================
*/

const piiPatterns = {

  // Aadhaar: exactly 12 digits (may have spaces)
  aadhaar: /\b\d{4}\s\d{4}\s\d{4}\b|\b\d{12}\b/g,

  // PAN: standard PAN format
  pan: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,

  // Phone numbers (Indian)
  phone: /\b(?:\+91[-\s]?)?[6-9]\d{9}\b/g,

  // Email
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,

  // IFSC code
  ifsc: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,

  // payment Card: exactly 16 digits (spaces or hyphen allowed)
  paymentCardNumber: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,

  // Bank account: 11–18 digits (avoid 10-digit phone numbers)
  bankAccount: /\b\d{11,18}\b/g
};

module.exports = piiPatterns; 