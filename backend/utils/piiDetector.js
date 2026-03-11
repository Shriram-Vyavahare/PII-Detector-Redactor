const piiPatterns = require("./piiPatterns");

/* ---------------- Luhn Validation ---------------- */

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


/* ---------------- PII Detector ---------------- */

function detectPII(text) {

  const detectedPII = {};
  const usedRanges = [];

  const contextKeywords = {

    paymentCardNumber: [
      "credit card","creditcard","card number","card no","card details",
      "cc number","debit card","visa","mastercard","rupay","amex",
      "payment card","bank card","atm card","expiry","cvv"
    ],

    aadhaar: [
      "aadhaar","aadhar","uid","uidai","aadhaar number","aadhaar card"
    ],

    pan: [
      "pan","pan number","pan card","permanent account number","income tax"
    ],

    phone: [
      "phone","mobile","contact","call","telephone","whatsapp","reach at","call me"
    ],

    email: [
      "email","mail","email id","email address"
    ],

    ifsc: [
      "ifsc","ifsc code","bank ifsc","rtgs","neft","imps"
    ],

    bankAccount: [
      "account","account number","bank account","a/c","account details"
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


  function isOverlapping(start, end) {

    return usedRanges.some(r =>
      start < r.end && end > r.start
    );
  }


  function addRange(start, end) {
    usedRanges.push({ start, end });
  }


  /* ---------- 1️⃣ Payment Cards ---------- */

  const cardMatches = [...text.matchAll(piiPatterns.paymentCardNumber)];
  const validCards = [];

  cardMatches.forEach(match => {

    const value = match[0];
    const index = match.index;
    const end = index + value.length;

    if (!isValidCardNumber(value)) return;

    if (isOverlapping(index, end)) return;

    const contextWindow = getContextWindow(text, index, value.length);

    validCards.push({
      value,
      confidence: getConfidence("paymentCardNumber", contextWindow)
    });

    addRange(index, end);

  });

  if (validCards.length) detectedPII.paymentCardNumber = validCards;



  /* ---------- 2️⃣ Aadhaar ---------- */

  const aadhaarMatches = [...text.matchAll(piiPatterns.aadhaar)];
  const aadhaarResults = [];

  aadhaarMatches.forEach(match => {

    const value = match[0];
    const digits = value.replace(/\D/g,"");

    const index = match.index;
    const end = index + value.length;

    /* Prevent Aadhaar from matching inside card numbers */

    if (digits.length === 12) {

      const surrounding = text.substring(index-5, index+20);

      if (/\d{16}/.test(surrounding.replace(/\D/g,""))) return;
    }

    if (isOverlapping(index,end)) return;

    const contextWindow = getContextWindow(text,index,value.length);

    aadhaarResults.push({
      value,
      confidence:getConfidence("aadhaar",contextWindow)
    });

    addRange(index,end);

  });

  if(aadhaarResults.length) detectedPII.aadhaar = aadhaarResults;



  /* ---------- PAN ---------- */

  const panMatches=[...text.matchAll(piiPatterns.pan)];
  const panResults=[];

  panMatches.forEach(match=>{

    const value=match[0];
    const index=match.index;
    const end=index+value.length;

    if(isOverlapping(index,end)) return;

    const contextWindow=getContextWindow(text,index,value.length);

    panResults.push({
      value,
      confidence:getConfidence("pan",contextWindow)
    });

    addRange(index,end);

  });

  if(panResults.length) detectedPII.pan=panResults;



  /* ---------- PHONE ---------- */

  const phoneMatches=[...text.matchAll(piiPatterns.phone)];
  const phoneResults=[];

  phoneMatches.forEach(match=>{

    const value=match[0];
    const index=match.index;
    const end=index+value.length;

    if(isOverlapping(index,end)) return;

    const contextWindow=getContextWindow(text,index,value.length);

    phoneResults.push({
      value,
      confidence:getConfidence("phone",contextWindow)
    });

    addRange(index,end);

  });

  if(phoneResults.length) detectedPII.phone=phoneResults;



  /* ---------- EMAIL ---------- */

  const emailMatches=[...text.matchAll(piiPatterns.email)];

  if(emailMatches.length){

    detectedPII.email=emailMatches.map(match=>({
      value:match[0],
      confidence:"HIGH"
    }));

  }



  /* ---------- IFSC ---------- */

  const ifscMatches=[...text.matchAll(piiPatterns.ifsc)];
  const ifscResults=[];

  ifscMatches.forEach(match=>{

    const value=match[0];
    const index=match.index;
    const end=index+value.length;

    if(isOverlapping(index,end)) return;

    const contextWindow=getContextWindow(text,index,value.length);

    ifscResults.push({
      value,
      confidence:getConfidence("ifsc",contextWindow)
    });

    addRange(index,end);

  });

  if(ifscResults.length) detectedPII.ifsc=ifscResults;



  /* ---------- BANK ACCOUNT ---------- */

/* ---------- BANK ACCOUNT ---------- */

const bankMatches = [...text.matchAll(piiPatterns.bankAccount)];
const bankResults = [];

bankMatches.forEach(match => {

  const value = match[0];
  const digits = value.replace(/\D/g, "");

  const index = match.index;
  const end = index + value.length;

  // Skip if overlapping with higher priority PII
  if (isOverlapping(index,end)) return;

  const contextWindow = getContextWindow(text,index,value.length);
  const confidence = getConfidence("bankAccount",contextWindow);

  // Only accept bank accounts when context confirms it
  if (confidence === "LOW") return;

  bankResults.push({
    value,
    confidence
  });

});

if (bankResults.length) detectedPII.bankAccount = bankResults;


  return detectedPII;
}


module.exports = detectPII;