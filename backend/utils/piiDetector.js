const piiPatterns = require("./piiPatterns");

/* ============================================================
   VERHOEFF CHECKSUM ALGORITHM — Official UIDAI Aadhaar Validation
   ============================================================ */

const verhoeffMultTable = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,2,3,4,0,6,7,8,9,5],
  [2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],
  [4,0,1,2,3,9,5,6,7,8],
  [5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],
  [7,6,5,9,8,2,1,0,4,3],
  [8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0],
];

const verhoeffPermTable = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,5,7,6,2,8,3,0,9,4],
  [5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],
  [9,4,5,3,1,2,6,8,7,0],
  [4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],
  [7,0,4,6,9,1,3,2,5,8],
];

function isValidAadhaar(aadhaarNumber) {
  const digits = aadhaarNumber.replace(/\D/g, "");
  if (digits.length !== 12) return false;
  if (digits[0] === "0" || digits[0] === "1") return false;
  let c = 0;
  const arr = digits.split("").reverse().map(Number);
  for (let i = 0; i < arr.length; i++) {
    c = verhoeffMultTable[c][verhoeffPermTable[i % 8][arr[i]]];
  }
  return c === 0;
}


/* ============================================================
   PAN STRUCTURAL VALIDATION — Income Tax Department of India
   ============================================================ */

const PAN_VALID_TYPES = new Set(['P','C','H','F','A','T','B','L','J','G']);

function isValidPAN(pan) {
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return false;
  if (!PAN_VALID_TYPES.has(pan[3])) return false;
  const seqNumber = parseInt(pan.slice(5, 9), 10);
  if (seqNumber === 0) return false;
  return true;
}


/* ============================================================
   LUHN ALGORITHM — Payment Card Validation
   ============================================================ */

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


/* ============================================================
   IFSC VALIDATION — RBI Registered Bank Codes
   ============================================================ */

const RBI_BANK_CODES = new Set([
  // Public Sector Banks
  "SBIN","BKID","BARB","CNRB","PUNB","UBIN","IOBA","ANDB","CORP",
  "ALLA","IDIB","MAHB","UCBA","CBIN","PSIB","UTBI","ORBC","VIJB",
  "DENA","SYND",
  // Private Sector Banks
  "HDFC","ICIC","UTIB","KKBK","YESB","INDB","IDFB","FDRL","KVBL",
  "DLXB","SRCB","DCBL","LAKX","CSFB","NKGS","JAKA","KARB","CLBL",
  "TMBL","SBMY","BDBL","RATN","SIBL",
  // Small Finance Banks
  "AUBL","ESFB","UFBU","USFB","JANA","NESF","FINF","ESAF","SUBL","CLSX",
  // Payment Banks
  "AIRP","IPOS","JIOP","FINO","PAYTM","PYTM",
  // Foreign Banks
  "CITI","HSBC","DEUT","SCBL","DBSS","BNPA","BOFA","CHAS","MHCB",
  "SMBC","ABNA","BBKM","ABNL",
  // Co-operative & RRBs
  "SVCB","GSCB","MSCI","APMC","COSB","BSBL","NJBK","PMCB","GDCB",
  "APGB","TGMB","PUGB","HPGB","JKGB","RBIS","UTGB","SGRB","KGBK","WBSC",
  // Others
  "LICL","IBKL","LAVB","APBL","RNSB","NSPB",
]);

function isValidIFSC(ifsc) {
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return false;
  if (!RBI_BANK_CODES.has(ifsc.slice(0, 4))) return false;
  if (ifsc[4] !== "0") return false;
  if (ifsc.slice(5) === "000000") return false;
  return true;
}


/* ============================================================
   PHONE VALIDATION — TRAI Numbering Plan Rules
   ============================================================
   Indian mobile numbers follow the Telecom Regulatory Authority
   of India (TRAI) National Numbering Plan. Rules applied:

   Rule 1 — First digit must be 6, 7, 8, or 9 (regex enforces this
             but we double-check on the clean 10-digit number)

   Rule 2 — First 2 digits (series) must be TRAI-allocated.
             TRAI assigns specific 2-digit prefixes to telecom
             operators. Unallocated series are rejected.

   Rule 3 — Cannot be all same digits
             e.g. 9999999999, 8888888888 → rejected

   Rule 4 — Cannot be a known test / placeholder number
             e.g. 9000000000, 8000000000 → rejected

   Rule 5 — Cannot be strictly sequential ascending or descending
             e.g. 9876543210, 6789012345 → rejected

   Rule 6 — Cannot have more than 7 of the same digit
             e.g. 9888888810 (eight 8s) → rejected (not realistic)
   ============================================================ */

// TRAI-allocated 2-digit mobile series (first 2 digits of 10-digit number)
// Source: TRAI National Numbering Plan & DoT allocation tables
const TRAI_ALLOCATED_SERIES = new Set([
  // 6x series (allocated from 2017 onwards)
  "60","61","62","63","64","65","66","67","68","69",
  // 7x series
  "70","71","72","73","74","75","76","77","78","79",
  // 8x series
  "80","81","82","83","84","85","86","87","88","89",
  // 9x series
  "90","91","92","93","94","95","96","97","98","99",
]);

// Known test / placeholder / unassigned numbers (first 10 digits)
const BLOCKED_NUMBERS = new Set([
  "9000000000","8000000000","7000000000","6000000000",
  "9111111111","8111111111","7111111111","6111111111",
  "9999999999","8888888888","7777777777","6666666666",
  "9876543210","8765432109","7654321098","6543210987",
  "9000000001","9000000002","9000000003","9999900000",
  "9876500000","9800000000","9900000000",
]);

function isValidPhone(phoneRaw) {
  // Strip country code (+91 or 91) and all non-digit chars
  let digits = phoneRaw.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  }

  // Must be exactly 10 digits after stripping
  if (digits.length !== 10) return false;

  // Rule 1 — first digit must be 6–9
  const firstDigit = digits[0];
  if (!["6","7","8","9"].includes(firstDigit)) return false;

  // Rule 2 — first 2 digits must be a TRAI-allocated series
  const series = digits.slice(0, 2);
  if (!TRAI_ALLOCATED_SERIES.has(series)) return false;

  // Rule 3 — cannot be all same digits
  if (/^(\d)\1{9}$/.test(digits)) return false;

  // Rule 4 — cannot be a known blocked/test number
  if (BLOCKED_NUMBERS.has(digits)) return false;

  // Rule 5 — cannot be strictly sequential ascending (e.g. 6789012345)
  const isAscending = [...digits].every(
    (d, i, arr) => i === 0 || (parseInt(d) - parseInt(arr[i - 1]) + 10) % 10 === 1
  );
  if (isAscending) return false;

  // Rule 5 — cannot be strictly sequential descending (e.g. 9876543210)
  const isDescending = [...digits].every(
    (d, i, arr) => i === 0 || (parseInt(arr[i - 1]) - parseInt(d) + 10) % 10 === 1
  );
  if (isDescending) return false;

  // Rule 6 — no single digit appearing more than 7 times
  for (let d = 0; d <= 9; d++) {
    const count = digits.split("").filter(x => x === String(d)).length;
    if (count > 7) return false;
  }

  return true;
}


/* ============================================================
   PII DETECTOR
   ============================================================ */

function detectPII(text) {

  const detectedPII = {};
  const usedRanges  = [];

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
    ],
  };


  function getContextWindow(fullText, index, valueLength, windowSize = 120) {
    const start = Math.max(0, index - windowSize);
    const end   = Math.min(fullText.length, index + valueLength + windowSize);
    return fullText.substring(start, end).toLowerCase();
  }


  function getConfidence(type, contextWindow) {
    if (type === "email") return "HIGH";
    const keywords         = contextKeywords[type] || [];
    const normalizedWindow = contextWindow
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase();
    const hasContext = keywords.some(kw => normalizedWindow.includes(kw.toLowerCase()));
    return hasContext ? "HIGH" : "LOW";
  }


  function isOverlapping(start, end) {
    return usedRanges.some(r => start < r.end && end > r.start);
  }


  function addRange(start, end) {
    usedRanges.push({ start, end });
  }


  /* ── 1. Payment Cards (Luhn) ─────────────────────────────────────────── */

  const cardMatches = [...text.matchAll(piiPatterns.paymentCardNumber)];
  const validCards  = [];

  cardMatches.forEach(match => {
    const value = match[0];
    const index = match.index;
    const end   = index + value.length;

    if (!isValidCardNumber(value)) return;
    if (isOverlapping(index, end)) return;

    const contextWindow = getContextWindow(text, index, value.length);
    validCards.push({ value, confidence: getConfidence("paymentCardNumber", contextWindow) });
    addRange(index, end);
  });

  if (validCards.length) detectedPII.paymentCardNumber = validCards;


  /* ── 2. Aadhaar (Regex + Verhoeff Checksum) ──────────────────────────── */

  const aadhaarMatches = [...text.matchAll(piiPatterns.aadhaar)];
  const aadhaarResults = [];

  aadhaarMatches.forEach(match => {
    const value  = match[0];
    const digits = value.replace(/\D/g, "");
    const index  = match.index;
    const end    = index + value.length;

    if (digits.length === 12) {
      const surrounding = text.substring(index - 5, index + 20);
      if (/\d{16}/.test(surrounding.replace(/\D/g, ""))) return;
    }

    if (isOverlapping(index, end)) return;
    if (!isValidAadhaar(value)) return;

    const contextWindow = getContextWindow(text, index, value.length);
    aadhaarResults.push({ value, confidence: getConfidence("aadhaar", contextWindow) });
    addRange(index, end);
  });

  if (aadhaarResults.length) detectedPII.aadhaar = aadhaarResults;


  /* ── 3. PAN (Regex + IT Dept Structural Validation) ──────────────────── */

  const panMatches = [...text.matchAll(piiPatterns.pan)];
  const panResults = [];

  panMatches.forEach(match => {
    const value = match[0];
    const index = match.index;
    const end   = index + value.length;

    if (isOverlapping(index, end)) return;
    if (!isValidPAN(value)) return;

    const contextWindow = getContextWindow(text, index, value.length);
    panResults.push({ value, confidence: getConfidence("pan", contextWindow) });
    addRange(index, end);
  });

  if (panResults.length) detectedPII.pan = panResults;


  /* ── 4. Phone (Regex + TRAI Numbering Plan Validation) ───────────────
   *
   *  Detection now requires BOTH:
   *    a) Regex match (Indian mobile pattern)
   *    b) TRAI validation:
   *         - first digit must be 6–9
   *         - first 2 digits must be TRAI-allocated series
   *         - not all same digits (9999999999)
   *         - not a known test/blocked number
   *         - not strictly sequential ascending or descending
   *         - no single digit appearing more than 7 times
   *
   *  Example rejections:
   *    9999999999 → rejected (all same digits)
   *    9876543210 → rejected (sequential descending)
   *    9000000000 → rejected (known test number)
   *    8978908765 → accepted (real TRAI series, passes all rules)
   * ─────────────────────────────────────────────────────────────────── */

  const phoneMatches = [...text.matchAll(piiPatterns.phone)];
  const phoneResults = [];

  phoneMatches.forEach(match => {
    const value = match[0];
    const index = match.index;
    const end   = index + value.length;

    if (isOverlapping(index, end)) return;

    // TRAI validation — rejects fake/test/invalid phone numbers
    if (!isValidPhone(value)) return;

    const contextWindow = getContextWindow(text, index, value.length);
    phoneResults.push({ value, confidence: getConfidence("phone", contextWindow) });
    addRange(index, end);
  });

  if (phoneResults.length) detectedPII.phone = phoneResults;


  /* ── 5. Email ────────────────────────────────────────────────────────── */

  const emailMatches = [...text.matchAll(piiPatterns.email)];
  if (emailMatches.length) {
    detectedPII.email = emailMatches.map(match => ({
      value:      match[0],
      confidence: "HIGH",
    }));
  }


  /* ── 6. IFSC (Regex + RBI Bank Code Validation) ──────────────────────── */

  const ifscMatches = [...text.matchAll(piiPatterns.ifsc)];
  const ifscResults = [];

  ifscMatches.forEach(match => {
    const value = match[0];
    const index = match.index;
    const end   = index + value.length;

    if (isOverlapping(index, end)) return;
    if (!isValidIFSC(value)) return;

    const contextWindow = getContextWindow(text, index, value.length);
    ifscResults.push({ value, confidence: getConfidence("ifsc", contextWindow) });
    addRange(index, end);
  });

  if (ifscResults.length) detectedPII.ifsc = ifscResults;


  /* ── 7. Bank Account ─────────────────────────────────────────────────── */

  const bankMatches = [...text.matchAll(piiPatterns.bankAccount)];
  const bankResults = [];

  bankMatches.forEach(match => {
    const value = match[0];
    const index = match.index;
    const end   = index + value.length;

    if (isOverlapping(index, end)) return;

    const contextWindow = getContextWindow(text, index, value.length);
    const confidence    = getConfidence("bankAccount", contextWindow);

    if (confidence === "LOW") return;

    bankResults.push({ value, confidence });
    addRange(index, end);
  });

  if (bankResults.length) detectedPII.bankAccount = bankResults;


  return detectedPII;
}


module.exports = detectPII;