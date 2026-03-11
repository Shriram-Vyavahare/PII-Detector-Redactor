const piiPatterns = require("./piiPatterns");

/**
 * Luhn Algorithm to validate payment card numbers
 */
function isValidCardNumber(cardNumber) {

  const digits = cardNumber.replace(/\D/g, "").split("").reverse().map(Number);

  let sum = 0;

  for (let i = 0; i < digits.length; i++) {

    let digit = digits[i];

    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
  }

  return sum % 10 === 0;
}


/**
 * Detect PII from extracted text
 */
function detectPII(text) {

  const detectedPII = {};

  const contextKeywords = {

    paymentCardNumber: [
      "credit card","creditcard","card number","card no","card details","card info",
      "cc number","cc no","credit","debit","debit card","debitcard","visa","mastercard",
      "rupay","amex","american express","payment card","bank card","atm","atm card",
      "expiry","cvv","credit card number","debit card number","atm card number"
    ],

    aadhaar: [
      "aadhaar","aadhar","adhar","aadhaar number","aadhar number","aadhaar no","aadhar no",
      "uid","uidai","uid number","aadhaar id","aadhaar card","aadhar card","aadhaar details"
    ],

    pan: [
      "pan","pan number","pan no","pan card","permanent account number",
      "permanent account no","income tax","tax id","tax identification",
      "tax number","pan details"
    ],

    phone: [
      "phone","phone number","phone no","mobile","mobile number","mobile no","contact",
      "contact number","contact no","call","call me","reach me","reach at",
      "tel","telephone","telephone number","cell","cellphone","whatsapp","whatsapp number"
    ],

    email: [
      "email","email id","email address","mail","mail id","e-mail",
      "e-mail id","contact email","official email","personal email"
    ],

    ifsc: [
      "ifsc","ifsc code","bank ifsc","branch code","bank branch code",
      "ifsc number","branch ifsc","rtgs","neft","imps"
    ],

    bankAccount: [
      "account","account number","account no","account details","bank account",
      "bank account number","bank a/c","a/c","a/c no","acc","acc no",
      "savings account","current account","personal account","account holder",
      "bank details","account information","account id"
    ]
  };


  function getContextWindow(fullText, index, valueLength, windowSize = 120) {

    const start = Math.max(0, index - windowSize);
    const end = Math.min(fullText.length, index + valueLength + windowSize);

    return fullText.substring(start, end).toLowerCase();
  }


  function getConfidence(type, contextWindow) {

    if (type === "email") return "HIGH";

    const keywords = contextKeywords[type] || [];

    const normalizedWindow = contextWindow
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase();

    const hasContext = keywords.some(keyword =>
      normalizedWindow.includes(keyword.toLowerCase())
    );

    return hasContext ? "HIGH" : "LOW";
  }



  // ---------- Payment Card ----------
  const cardMatches = [...text.matchAll(piiPatterns.paymentCardNumber)];

  if (cardMatches.length) {

    const validCards = [];

    cardMatches.forEach(match => {

      const value = match[0];
      const index = match.index;

      if (!isValidCardNumber(value)) return;

      const contextWindow = getContextWindow(text, index, value.length);

      validCards.push({
        value,
        confidence: getConfidence("paymentCardNumber", contextWindow)
      });

    });

    if (validCards.length) detectedPII.paymentCardNumber = validCards;
  }



  // ---------- Aadhaar ----------
  const aadhaarMatches = [...text.matchAll(piiPatterns.aadhaar)];

  if (aadhaarMatches.length) {

    detectedPII.aadhaar = aadhaarMatches.map(match => {

      const value = match[0];
      const index = match.index;

      const contextWindow = getContextWindow(text, index, value.length);

      return {
        value,
        confidence: getConfidence("aadhaar", contextWindow)
      };

    });
  }



  // ---------- PAN ----------
  const panMatches = [...text.matchAll(piiPatterns.pan)];

  if (panMatches.length) {

    detectedPII.pan = panMatches.map(match => {

      const value = match[0];
      const index = match.index;

      const contextWindow = getContextWindow(text, index, value.length);

      return {
        value,
        confidence: getConfidence("pan", contextWindow)
      };

    });
  }



  // ---------- Phone ----------
  const phoneMatches = [...text.matchAll(piiPatterns.phone)];

  if (phoneMatches.length) {

    detectedPII.phone = phoneMatches.map(match => {

      const value = match[0];
      const index = match.index;

      const contextWindow = getContextWindow(text, index, value.length);

      return {
        value,
        confidence: getConfidence("phone", contextWindow)
      };

    });
  }



  // ---------- Email ----------
  const emailMatches = [...text.matchAll(piiPatterns.email)];

  if (emailMatches.length) {

    detectedPII.email = emailMatches.map(match => {

      const value = match[0];
      const index = match.index;

      const contextWindow = getContextWindow(text, index, value.length);

      return {
        value,
        confidence: getConfidence("email", contextWindow)
      };

    });
  }



  // ---------- IFSC ----------
  const ifscMatches = [...text.matchAll(piiPatterns.ifsc)];

  if (ifscMatches.length) {

    detectedPII.ifsc = ifscMatches.map(match => {

      const value = match[0];
      const index = match.index;

      const contextWindow = getContextWindow(text, index, value.length);

      return {
        value,
        confidence: getConfidence("ifsc", contextWindow)
      };

    });
  }



  // ---------- Bank Account ----------
  const bankMatches = [...text.matchAll(piiPatterns.bankAccount)];

  if (bankMatches.length) {

    detectedPII.bankAccount = bankMatches.map(match => {

      const value = match[0];
      const index = match.index;

      const contextWindow = getContextWindow(text, index, value.length);

      return {
        value,
        confidence: getConfidence("bankAccount", contextWindow)
      };

    });
  }


  return detectedPII;
}

module.exports = detectPII;