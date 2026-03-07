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
    "credit","debit", "debit card", "debitcard", "visa", "mastercard", "rupay", "amex", "american express",
    "payment card", "bank card","atm", "atm card", "expiry", "cvv"
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
  function getContextWindow(fullText, value, windowSize = 80) {

    const index = fullText.indexOf(value);

    if (index === -1) return "";

    const start = Math.max(0, index - windowSize);
    const end = Math.min(fullText.length, index + value.length + windowSize);

    return fullText.substring(start, end).toLowerCase();
  }

  /**
   * Calculate confidence score based on nearby context
   */
function getConfidence(type, value) {

  // Email pattern itself is very strong
  if (type === "email") {
    return "HIGH";
  }

  const keywords = contextKeywords[type] || [];

  const contextWindow = getContextWindow(text, value);

  const hasContext = keywords.some(keyword =>
    contextWindow.includes(keyword)
  );

  return hasContext ? "HIGH" : "LOW";
}

  // ---------- 1️⃣ Detect Credit Cards FIRST ----------
  const paymentCardNumbers = workingText.match(piiPatterns.paymentCardNumber);
  if (paymentCardNumbers) {

    detectedPII.paymentCardNumber = paymentCardNumbers.map(card => ({
      value: card,
      confidence: getConfidence("paymentCardNumber", card)
    }));

    paymentCardNumbers.forEach(card => {
      workingText = workingText.replace(card, " ");
    });
  }

  // ---------- 2️⃣ Detect Aadhaar ----------
  const aadhaar = workingText.match(piiPatterns.aadhaar);
  if (aadhaar) {
 
    detectedPII.aadhaar = aadhaar.map(a => ({
      value: a,
      confidence: getConfidence("aadhaar", a)
    }));

    aadhaar.forEach(a => {
      workingText = workingText.replace(a, " ");
    });
  }

  // ---------- 3️⃣ PAN ----------
  const pan = workingText.match(piiPatterns.pan);
  if (pan) {

    detectedPII.pan = pan.map(p => ({
      value: p,
      confidence: getConfidence("pan", p)
    }));
  }

  // ---------- 4️⃣ Phone ----------
  const phone = workingText.match(piiPatterns.phone);
  if (phone) {

    detectedPII.phone = phone.map(p => ({
      value: p,
      confidence: getConfidence("phone", p)
    }));
  }

  // ---------- 5️⃣ Email ----------
  const email = workingText.match(piiPatterns.email);
  if (email) {

    detectedPII.email = email.map(e => ({
      value: e,
      confidence: getConfidence("email", e)
    }));
  }

  // ---------- 6️⃣ IFSC ----------
  const ifsc = workingText.match(piiPatterns.ifsc);
  if (ifsc) {

    detectedPII.ifsc = ifsc.map(i => ({
      value: i,
      confidence: getConfidence("ifsc", i)
    }));
  }

  // ---------- 7️⃣ Bank Account ----------
  const bank = workingText.match(piiPatterns.bankAccount);
  if (bank) {

    detectedPII.bankAccount = bank.map(b => ({
      value: b,
      confidence: getConfidence("bankAccount", b)
    }));
  }

  return detectedPII;
}

module.exports = detectPII;