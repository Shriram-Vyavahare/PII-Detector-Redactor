/*
  ============================
  PII Detection Patterns
  ============================
*/

const piiPatterns = {
  aadhaar: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,

  pan: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,

  phone: /\b(?:\+91[-\s]?)?[6-9]\d{9}\b/g,

  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  ifsc: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,

  creditCard: /\b(?:\d[ -]?){13,19}\b/g,

  bankAccount: /\b\d{9,18}\b/g
};

module.exports = piiPatterns;