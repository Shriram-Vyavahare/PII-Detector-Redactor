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
   ============================================================ */

const TRAI_ALLOCATED_SERIES = new Set([
  "60","61","62","63","64","65","66","67","68","69",
  "70","71","72","73","74","75","76","77","78","79",
  "80","81","82","83","84","85","86","87","88","89",
  "90","91","92","93","94","95","96","97","98","99",
]);

const BLOCKED_NUMBERS = new Set([
  "9000000000","8000000000","7000000000","6000000000",
  "9111111111","8111111111","7111111111","6111111111",
  "9999999999","8888888888","7777777777","6666666666",
  "9876543210","8765432109","7654321098","6543210987",
  "9000000001","9000000002","9000000003","9999900000",
  "9876500000","9800000000","9900000000",
]);

function isValidPhone(phoneRaw) {
  let digits = phoneRaw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.length !== 10) return false;
  if (!["6","7","8","9"].includes(digits[0])) return false;
  if (!TRAI_ALLOCATED_SERIES.has(digits.slice(0, 2))) return false;
  if (/^(\d)\1{9}$/.test(digits)) return false;
  if (BLOCKED_NUMBERS.has(digits)) return false;
  const isAscending = [...digits].every(
    (d, i, arr) => i === 0 || (parseInt(d) - parseInt(arr[i - 1]) + 10) % 10 === 1
  );
  if (isAscending) return false;
  const isDescending = [...digits].every(
    (d, i, arr) => i === 0 || (parseInt(arr[i - 1]) - parseInt(d) + 10) % 10 === 1
  );
  if (isDescending) return false;
  for (let d = 0; d <= 9; d++) {
    if (digits.split("").filter(x => x === String(d)).length > 7) return false;
  }
  return true;
}


/* ============================================================
   BANK ACCOUNT VALIDATION — RBI Guidelines & Heuristic Rules
   ============================================================
   IMPORTANT: Bank account detection requires MANDATORY CONTEXT.
   
   Unlike other PII types (Aadhaar has Verhoeff checksum, PAN has
   structural validation, Credit Cards have Luhn algorithm), Indian
   bank account numbers have NO universal validation algorithm.
   Each bank uses its own internal format.
   
   Without context keywords, any random 12-digit number would be
   detected as a bank account, causing excessive false positives.
   
   Therefore, bank accounts are ONLY detected when context keywords
   like "account", "bank account", "a/c" are present nearby.

   The following heuristic rules are applied to eliminate obvious
   false positives when context IS present:

   Rule 1 — Length must be 9–18 digits (RBI mandated range)
             Accounts shorter than 9 or longer than 18 are invalid.

   Rule 1.5 — Cannot be exactly 16 digits (payment card overlap)
             16-digit numbers are payment cards, not bank accounts.
             This prevents credit cards from being detected as bank accounts.

   Rule 2 — Cannot be all zeros
             e.g. 000000000000 → rejected

   Rule 3 — Cannot be all same digits
             e.g. 111111111111, 999999999999 → rejected

   Rule 3.5 — Cannot contain excessive repeating patterns (4+ consecutive same digits)
             e.g. 444411115555 (has 4444, 1111, 5555) → rejected
             e.g. 071918320007777 (has 7777) → rejected
             Real account numbers may have 000 or 111, but not 0000 or 1111.

   Rule 4 — Cannot be strictly sequential ascending or descending
             e.g. 123456789012, 987654321098 → rejected
             Real account numbers are never sequential.

   Rule 5 — Digit entropy check (Shannon entropy)
             Real account numbers have varied digit distribution.
             A number where one digit appears > 50% of the time
             is statistically suspicious.
             Threshold: no single digit can appear more than
             floor(length * 0.5) times.

   Rule 6 — Cannot be a known dummy / test account number
             Common placeholder numbers used in forms/examples
             are explicitly blocked.

   NOTE: "starts with 0" is intentionally NOT a rule — some Indian
   banks (SBI, co-operative banks) issue accounts beginning with 0,
   e.g. 071918210009932 is a valid SBI-format account number.
   ============================================================ */

// Known dummy/test/example account numbers used in documents
const BLOCKED_ACCOUNTS = new Set([
  "000000000","00000000000","000000000000",
  "111111111","11111111111","111111111111",
  "123456789","1234567890","12345678901","123456789012",
  "987654321","9876543210","98765432109","987654321098",
  "111222333444","444333222111","123123123123",
  "999999999","99999999999","999999999999",
]);

function isValidBankAccount(accountRaw) {
  const digits = accountRaw.replace(/\D/g, "");

  // Rule 1 — length must be 9–18 digits (RBI range)
  if (digits.length < 9 || digits.length > 18) return false;

  // Rule 1.5 — cannot be exactly 16 digits (payment card overlap prevention)
  // 16-digit numbers should be detected as payment cards, not bank accounts
  if (digits.length === 16) return false;

  // Rule 2 — cannot be all zeros
  if (/^0+$/.test(digits)) return false;

  // Rule 3 — cannot be all same digits
  if (/^(\d)\1+$/.test(digits)) return false;

  // Rule 3.5 — cannot contain excessive repeating patterns
  // Blocks numbers with 4+ consecutive same digits (e.g., 4444, 5555, 0000)
  // Real accounts may have 000 or 111, but not 0000 or 1111
  if (/(\d)\1{3,}/.test(digits)) return false;

  // Rule 4 — cannot be strictly sequential ascending
  const isAscending = [...digits].every(
    (d, i, arr) => i === 0 || (parseInt(d) - parseInt(arr[i - 1]) + 10) % 10 === 1
  );
  if (isAscending) return false;

  // Rule 4 — cannot be strictly sequential descending
  const isDescending = [...digits].every(
    (d, i, arr) => i === 0 || (parseInt(arr[i - 1]) - parseInt(d) + 10) % 10 === 1
  );
  if (isDescending) return false;

  // Rule 5 — digit entropy check
  // No single digit should appear more than 50% of the total length
  // (threshold tightened from 60% since we removed the starts-with-0 rule)
  const maxAllowed = Math.floor(digits.length * 0.5);
  for (let d = 0; d <= 9; d++) {
    const count = digits.split("").filter(x => x === String(d)).length;
    if (count > maxAllowed) return false;
  }

  // Rule 6 — blocked dummy/test account numbers
  if (BLOCKED_ACCOUNTS.has(digits)) return false;

  return true;
}


/* ============================================================
   CONFIDENCE SCORE CALCULATION — 3-Layer Scoring System
   ============================================================
   Calculates numeric confidence scores (0-100%) based on:
   - Layer 1: Regex Pattern Match (30%)
   - Layer 2: Algorithmic Validation (40%)
   - Layer 3: Context Keywords (30%)
   ============================================================ */

function calculateConfidence(type, hasAlgorithmValidation, hasContextKeywords) {
  // Special case: Email always returns 100%
  if (type === "email") return 100;
  
  // Base score: regex match
  let score = 30;
  
  // Add validation layer
  if (hasAlgorithmValidation) score += 40;
  
  // Add context layer
  if (hasContextKeywords) score += 30;
  
  // Clamp to valid range [0, 100]
  return Math.max(0, Math.min(100, score));
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
      "account","account number","bank account","a/c","a c","account details"
    ],
  };


  function getContextWindow(fullText, index, valueLength, windowSize = 120) {
    const start = Math.max(0, index - windowSize);
    const end   = Math.min(fullText.length, index + valueLength + windowSize);
    return fullText.substring(start, end).toLowerCase();
  }


  function hasContextKeywords(type, contextWindow) {
    const keywords         = contextKeywords[type] || [];
    const normalizedWindow = contextWindow
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase();
    return keywords.some(kw => normalizedWindow.includes(kw.toLowerCase()));
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

    const hasAlgorithm = isValidCardNumber(value);
    if (!hasAlgorithm) return;
    if (isOverlapping(index, end)) return;

    const contextWindow = getContextWindow(text, index, value.length);
    const hasContext = hasContextKeywords("paymentCardNumber", contextWindow);
    const confidence = calculateConfidence("paymentCardNumber", hasAlgorithm, hasContext);
    
    validCards.push({ value, confidence });
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
    
    const hasAlgorithm = isValidAadhaar(value);
    if (!hasAlgorithm) return;

    const contextWindow = getContextWindow(text, index, value.length);
    const hasContext = hasContextKeywords("aadhaar", contextWindow);
    const confidence = calculateConfidence("aadhaar", hasAlgorithm, hasContext);
    
    aadhaarResults.push({ value, confidence });
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
    
    const hasAlgorithm = isValidPAN(value);
    if (!hasAlgorithm) return;

    const contextWindow = getContextWindow(text, index, value.length);
    const hasContext = hasContextKeywords("pan", contextWindow);
    const confidence = calculateConfidence("pan", hasAlgorithm, hasContext);
    
    panResults.push({ value, confidence });
    addRange(index, end);
  });

  if (panResults.length) detectedPII.pan = panResults;


  /* ── 4. Phone (Regex + TRAI Numbering Plan Validation) ───────────────── */

  const phoneMatches = [...text.matchAll(piiPatterns.phone)];
  const phoneResults = [];

  phoneMatches.forEach(match => {
    const value = match[0];
    const index = match.index;
    const end   = index + value.length;

    if (isOverlapping(index, end)) return;
    
    const hasAlgorithm = isValidPhone(value);
    if (!hasAlgorithm) return;

    const contextWindow = getContextWindow(text, index, value.length);
    const hasContext = hasContextKeywords("phone", contextWindow);
    const confidence = calculateConfidence("phone", hasAlgorithm, hasContext);
    
    phoneResults.push({ value, confidence });
    addRange(index, end);
  });

  if (phoneResults.length) detectedPII.phone = phoneResults;


  /* ── 5. Email ────────────────────────────────────────────────────────── */

  const emailMatches = [...text.matchAll(piiPatterns.email)];
  if (emailMatches.length) {
    detectedPII.email = emailMatches.map(match => ({
      value:      match[0],
      confidence: calculateConfidence("email", true, true),
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
    
    const hasAlgorithm = isValidIFSC(value);
    if (!hasAlgorithm) return;

    const contextWindow = getContextWindow(text, index, value.length);
    const hasContext = hasContextKeywords("ifsc", contextWindow);
    const confidence = calculateConfidence("ifsc", hasAlgorithm, hasContext);
    
    ifscResults.push({ value, confidence });
    addRange(index, end);
  });

  if (ifscResults.length) detectedPII.ifsc = ifscResults;


  /* ── 7. Bank Account (Regex + RBI Heuristic Validation + MANDATORY CONTEXT) ──
   *
   *  IMPORTANT: Bank account detection requires MANDATORY CONTEXT.
   *  Unlike other PII types (Aadhaar, PAN, Credit Card), bank account numbers
   *  have NO universal checksum or validation algorithm. Each bank uses its own
   *  internal format, making algorithmic validation unreliable.
   *
   *  Detection requirements:
   *    a) Regex match (11–18 digit number, excluding 16-digit credit cards)
   *    b) RBI heuristic validation (basic sanity checks):
   *         - length 9–18 digits
   *         - not all zeros or all same digits
   *         - not sequential ascending or descending
   *         - not excessive repeating patterns (4+ consecutive same digits)
   *         - digit entropy: no digit appears more than 50% of length
   *         - not a known dummy/test account number
   *    c) Context keywords (MANDATORY) - must have words like:
   *         "account", "account number", "bank account", "a/c", "account details"
   *
   *  Confidence scoring:
   *    - With context: 100% (regex + RBI validation + context)
   *    - Without context: NOT DETECTED (context is mandatory)
   *
   *  Example detections:
   *    "50155012345" → NOT DETECTED (no context)
   *    "Account number: 50155012345" → DETECTED at 100% (has context)
   *    "Bank a/c: 071918210009932" → DETECTED at 100% (has context)
   *
   *  Rationale: Without context keywords, any random 12-digit number would be
   *  detected as a bank account, leading to excessive false positives.
   * ──────────────────────────────────────────────────────────────────────── */

  const bankMatches = [...text.matchAll(piiPatterns.bankAccount)];
  const bankResults = [];

  bankMatches.forEach(match => {
    const value = match[0];
    const index = match.index;
    const end   = index + value.length;

    if (isOverlapping(index, end)) return;

    // Check for context keywords FIRST (mandatory requirement)
    const contextWindow = getContextWindow(text, index, value.length);
    const hasContext = hasContextKeywords("bankAccount", contextWindow);
    
    // If no context keywords found, skip this number entirely
    if (!hasContext) return;

    // RBI heuristic validation — rejects obviously fake account numbers
    const hasAlgorithm = isValidBankAccount(value);
    if (!hasAlgorithm) return;
    
    // Context is present and validation passed → 100% confidence
    const confidence = 100;
    
    bankResults.push({ value, confidence });
    addRange(index, end);
  });

  if (bankResults.length) detectedPII.bankAccount = bankResults;


  return detectedPII;
}


module.exports = detectPII;