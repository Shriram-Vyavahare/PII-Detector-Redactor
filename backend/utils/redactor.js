const fs = require("fs");
const path = require("path");

const { Document, Packer, Paragraph } = require("docx");


/* ---------------- Masking Functions ---------------- */

function maskAadhaar(value) {
  const digits = value.replace(/\D/g, "");
  return "XXXX XXXX " + digits.slice(-4);
}

function maskPhone(value) {
  return "******" + value.slice(-4);
}

function maskCard(value) {
  const digits = value.replace(/\D/g, "");
  return "XXXX XXXX XXXX " + digits.slice(-4);
}

function maskPAN(value) {
  return value.slice(0,5) + "****" + value.slice(-1);
}

function maskEmail(value) {
  const parts = value.split("@");
  return parts[0].slice(0,2) + "****@" + parts[1];
}

function maskIFSC(value) {
  return "XXXXXXX" + value.slice(-4);
}

function maskBankAccount(value) {

  const digits = value.replace(/\D/g,"");
  const visible = digits.slice(-4);
  const maskedLength = digits.length - 4;

  return "X".repeat(maskedLength) + visible;
}


/* ---------------- Redaction Engine ---------------- */

function redactText(originalText, detectedPII) {

  let redactedText = originalText;

  Object.keys(detectedPII).forEach(type => {

    detectedPII[type].forEach(item => {

      const value = item.value;
      let masked = value;

      switch(type){

        case "aadhaar":
          masked = maskAadhaar(value);
          break;

        case "phone":
          masked = maskPhone(value);
          break;

        case "paymentCardNumber":
          masked = maskCard(value);
          break;

        case "pan":
          masked = maskPAN(value);
          break;

        case "email":
          masked = maskEmail(value);
          break;

        case "bankAccount":
          masked = maskBankAccount(value);
          break;

        case "ifsc":
          masked = maskIFSC(value);
          break;
      }

      // Escape regex special characters in the value
      const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const regex = new RegExp(escapedValue, "g");

      redactedText = redactedText.replace(regex, masked);

    });

  });

  return redactedText;
}


/* ---------------- Save Redacted DOCX ---------------- */

async function saveRedactedDocx(text){

  const { Document, Packer, Paragraph } = require("docx");

  const filename = "redacted_" + Date.now() + ".docx";

  const filePath = path.join(__dirname, "../uploads", filename);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: text.split("\n").map(line => new Paragraph(line)),
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  fs.writeFileSync(filePath, buffer);

  return "/uploads/" + filename;
}

/* ---------------- Export Functions ---------------- */

module.exports = {
  redactText,
  saveRedactedDocx
};