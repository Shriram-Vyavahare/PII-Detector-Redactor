const piiPatterns = require("./piiPatterns");

/**
 * Detect PII from extracted text
 */
function detectPII(text) {

  const detectedPII = {};
  let workingText = text;

  // -------- Context keywords for each PII type --------
  const contextKeywords = {

    paymentCardNumber: [
      "credit card", "creditcard", "card number", "card no", "card details", "card info", "cc number", "cc no",
      "credit", "debit", "debit card", "debitcard", "visa", "mastercard", "rupay", "amex", "american express",
      "payment card", "bank card", "atm", "atm card", "expiry", "cvv"
    ],

    aadhaar: [
      "aadhaar", "aadhar", "adhar", "aadhaar number", "aadhar number", "aadhaar no", "aadhar no",
      "uid", "uidai", "uid number", "aadhaar id", "aadhaar card", "aadhar card", "aadhaar details"
    ],

    pan: [
      "pan", "pan number", "pan no", "pan card", "permanent account number", "permanent account no",
      "income tax", "tax id", "tax identification", "tax number", "pan details"
    ],

    phone: [
      "phone", "phone number", "phone no", "mobile", "mobile number", "mobile no", "contact",
      "contact number", "contact no", "call", "call me", "reach me", "reach at",
      "tel", "telephone", "telephone number", "cell", "cellphone", "whatsapp", "whatsapp number"
    ],

    email: [
      "email", "email id", "email address", "mail", "mail id", "e-mail",
      "e-mail id", "contact email", "official email", "personal email"
    ],

    ifsc: [
      "ifsc", "ifsc code", "bank ifsc", "branch code", "bank branch code",
      "ifsc number", "branch ifsc", "rtgs", "neft", "imps"
    ],

    bankAccount: [
      "account", "account number", "account no", "account details", "bank account",
      "bank account number", "bank a/c", "a/c", "a/c no", "acc", "acc no",
      "savings account", "current account", "personal account", "account holder",
      "bank details", "account information", "account id"
    ]

  };

  /**
   * Get nearby context window around detected value
   */
  function getContextWindow(fullText, index, valueLength, windowSize = 80) {

    const start = Math.max(0, index - windowSize);
    const end = Math.min(fullText.length, index + valueLength + windowSize);

    return fullText.substring(start, end).toLowerCase();
  }

  /**
   * Calculate confidence score based on nearby context
   */
  function getConfidence(type, contextWindow) {

    if (type === "email") {
      return "HIGH";
    }

    const keywords = contextKeywords[type] || [];

    const hasContext = keywords.some(keyword =>
      contextWindow.includes(keyword)
    );

    return hasContext ? "HIGH" : "LOW";
  }

  // ---------- 1️⃣ Detect Payment Card Numbers FIRST ----------
  const cardMatches = [...workingText.matchAll(piiPatterns.paymentCardNumber)];

  if (cardMatches.length) {

    detectedPII.paymentCardNumber = cardMatches.map(match => {

      const value = match[0];
      const index = match.index;

      const contextWindow = getContextWindow(text, index, value.length);

      return {
        value: value,
        confidence: getConfidence("paymentCardNumber", contextWindow)
      };

    });

    cardMatches.forEach(match => {
      workingText = workingText.replace(match[0], " ");
    });
  }

  // ---------- 2️⃣ Detect Aadhaar ----------
  const aadhaarMatches = [...workingText.matchAll(piiPatterns.aadhaar)];

  if (aadhaarMatches.length) {

    detectedPII.aadhaar = aadhaarMatches.map(match => {

      const value = match[0];
      const index = match.index;

      const contextWindow = getContextWindow(text, index, value.length);

      return {
        value: value,
        confidence: getConfidence("aadhaar", contextWindow)
      };

    });

    aadhaarMatches.forEach(match => {
      workingText = workingText.replace(match[0], " ");
    });
  }

  // ---------- 3️⃣ PAN ----------
  const panMatches = [...workingText.matchAll(piiPatterns.pan)];

  if (panMatches.length) {

    detectedPII.pan = panMatches.map(match => {

      const value = match[0];
      const index = match.index;

      const contextWindow = getContextWindow(text, index, value.length);

      return {
        value: value,
        confidence: getConfidence("pan", contextWindow)
      };

    });
  }

  // ---------- 4️⃣ Phone ----------
  const phoneMatches = [...workingText.matchAll(piiPatterns.phone)];

  if (phoneMatches.length) {

    detectedPII.phone = phoneMatches.map(match => {

      const value = match[0];
      const index = match.index;

      const contextWindow = getContextWindow(text, index, value.length);

      return {
        value: value,
        confidence: getConfidence("phone", contextWindow)
      };

    });
  }

  // ---------- 5️⃣ Email ----------
  const emailMatches = [...workingText.matchAll(piiPatterns.email)];

  if (emailMatches.length) {

    detectedPII.email = emailMatches.map(match => {

      const value = match[0];
      const index = match.index;

      const contextWindow = getContextWindow(text, index, value.length);

      return {
        value: value,
        confidence: getConfidence("email", contextWindow)
      };

    });
  }

  // ---------- 6️⃣ IFSC ----------
  const ifscMatches = [...workingText.matchAll(piiPatterns.ifsc)];

  if (ifscMatches.length) {

    detectedPII.ifsc = ifscMatches.map(match => {

      const value = match[0];
      const index = match.index;

      const contextWindow = getContextWindow(text, index, value.length);

      return {
        value: value,
        confidence: getConfidence("ifsc", contextWindow)
      };

    });
  }

  // ---------- 7️⃣ Bank Account ----------
  const bankMatches = [...workingText.matchAll(piiPatterns.bankAccount)];

  if (bankMatches.length) {

    detectedPII.bankAccount = bankMatches.map(match => {

      const value = match[0];
      const index = match.index;

      const contextWindow = getContextWindow(text, index, value.length);

      return {
        value: value,
        confidence: getConfidence("bankAccount", contextWindow)
      };

    });
  }

  return detectedPII;
}

module.exports = detectPII;