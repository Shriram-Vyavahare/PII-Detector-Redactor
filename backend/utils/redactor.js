const fs   = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const pythonCmd  = process.platform === "win32" ? "python" : "python3";
const uploadsDir = path.join(__dirname, "../uploads");

/* ── helpers ──────────────────────────────────────────────────────────────── */

function runPython(scriptPath, args) {
  return new Promise((resolve, reject) => {
    execFile(
      pythonCmd,
      [scriptPath, ...args],
      { maxBuffer: 20 * 1024 * 1024, shell: false },
      (error, stdout, stderr) => {
        if (error) return reject(new Error(stderr || error.message));
        const out = stdout.trim();
        if (out.startsWith("OK:")) return resolve(out.slice(3)); // full output path
        reject(new Error("Unexpected output: " + out + " | " + stderr));
      }
    );
  });
}

/* ── Masking Functions ────────────────────────────────────────────────────── */

function maskAadhaar(value) {
  return "XXXX XXXX " + value.replace(/\D/g, "").slice(-4);
}
function maskPhone(value) {
  return "******" + value.slice(-4);
}
function maskCard(value) {
  return "XXXX XXXX XXXX " + value.replace(/\D/g, "").slice(-4);
}
function maskPAN(value) {
  return value.slice(0, 5) + "****" + value.slice(-1);
}
function maskEmail(value) {
  const [local, domain] = value.split("@");
  return local.slice(0, 2) + "****@" + domain;
}
function maskIFSC(value) {
  return "XXXXXXX" + value.slice(-4);
}
function maskBankAccount(value) {
  const digits = value.replace(/\D/g, "");
  return "X".repeat(digits.length - 4) + digits.slice(-4);
}

/* ── Plain-text redaction (used for PII detection display only) ───────────── */

function redactText(originalText, detectedPII) {
  let out = originalText;
  Object.keys(detectedPII).forEach(type => {
    detectedPII[type].forEach(({ value }) => {
      let masked = value;
      switch (type) {
        case "aadhaar":           masked = maskAadhaar(value);    break;
        case "phone":             masked = maskPhone(value);       break;
        case "paymentCardNumber": masked = maskCard(value);        break;
        case "pan":               masked = maskPAN(value);         break;
        case "email":             masked = maskEmail(value);       break;
        case "bankAccount":       masked = maskBankAccount(value); break;
        case "ifsc":              masked = maskIFSC(value);        break;
      }
      out = out.replace(new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), masked);
    });
  });
  return out;
}

/* ── PDF input → layout-preserving overlay PDF ────────────────────────────── */

async function saveRedactedPDF(inputPath, detectedPII) {
  const filename   = "redacted_" + Date.now() + ".pdf";
  const outputPath = path.join(uploadsDir, filename);
  const scriptPath = path.join(__dirname, "pdf_redactor.py");

  await runPython(scriptPath, [inputPath, outputPath, JSON.stringify(detectedPII)]);
  return "/uploads/" + filename;
}

/* ── DOCX input → layout-preserving PDF ──────────────────────────────────────
 *
 * Step 1: LibreOffice converts DOCX → PDF  (all formatting preserved)
 * Step 2: pdf_redactor.py overlays white boxes + masked text on that PDF
 *         (exact same pipeline as a PDF input — no formatting lost)
 * ─────────────────────────────────────────────────────────────────────────── */

async function saveRedactedDocxAsPDF(inputDocxPath, detectedPII) {

  // Step 1 — DOCX → PDF via LibreOffice
  const intermediateName = "intermediate_" + Date.now() + ".pdf";
  const intermediatePath = path.join(uploadsDir, intermediateName);
  const docxScript       = path.join(__dirname, "docx_to_pdf.py");

  try {
    await runPython(docxScript, [inputDocxPath, intermediatePath]);
  } catch (err) {
    throw new Error("DOCX→PDF conversion failed: " + err.message);
  }

  // Step 2 — overlay PII masks onto the intermediate PDF
  const finalName = "redacted_" + Date.now() + ".pdf";
  const finalPath = path.join(uploadsDir, finalName);
  const pdfScript = path.join(__dirname, "pdf_redactor.py");

  try {
    await runPython(pdfScript, [intermediatePath, finalPath, JSON.stringify(detectedPII)]);
  } finally {
    // Clean up the intermediate file regardless of success/failure
    try { fs.unlinkSync(intermediatePath); } catch (_) {}
  }

  return "/uploads/" + finalName;
}

/* ── Exports ──────────────────────────────────────────────────────────────── */

module.exports = {
  redactText,
  saveRedactedPDF,          // PDF  input → overlay-redacted PDF
  saveRedactedDocxAsPDF,    // DOCX input → LibreOffice PDF → overlay-redacted PDF
};