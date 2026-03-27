const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

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

      const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedValue, "g");

      redactedText = redactedText.replace(regex, masked);

    });

  });

  return redactedText;
}

/* ---------------- Redact DOCX while preserving layout ---------------- */

async function redactDocxFile(inputPath, detectedPII){

  const zip = new AdmZip(inputPath);

  const xmlEntry = zip.getEntry("word/document.xml");

  let xml = xmlEntry.getData().toString("utf8");


  /* -------- Extract all text nodes -------- */

  const textNodes = [];

  xml.replace(/<w:t[^>]*>(.*?)<\/w:t>/g,(match,text)=>{

    textNodes.push(text);

  });


  /* Combine into full document text */

  let fullText = textNodes.join("");


  /* -------- Apply Redaction -------- */

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

      const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");

      const regex = new RegExp(escapedValue,"g");

      fullText = fullText.replace(regex,masked);

    });

  });


  /* -------- Write masked text back into nodes -------- */

  let pointer = 0;

  xml = xml.replace(/<w:t([^>]*)>(.*?)<\/w:t>/g,(match,attrs,originalText)=>{

    const length = originalText.length;

    const newText = fullText.substr(pointer,length);

    pointer += length;

    return `<w:t${attrs}>${newText}</w:t>`;

  });


  /* -------- Save DOCX -------- */

  zip.updateFile("word/document.xml",Buffer.from(xml));

  const filename = "redacted_"+Date.now()+".docx";

  const outputPath = path.join(__dirname,"../uploads",filename);

  zip.writeZip(outputPath);

  return "/uploads/"+filename;
}

/* ---------------- Export Functions ---------------- */

module.exports = {
  redactText,
  redactDocxFile
}; 