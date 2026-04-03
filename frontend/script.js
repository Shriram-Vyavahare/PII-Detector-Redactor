const fileInput  = document.getElementById("fileInput");
const browseBtn  = document.getElementById("browseBtn");
const processBtn = document.getElementById("processBtn");
const loader     = document.getElementById("loader");
const results    = document.getElementById("results");
const piiList    = document.getElementById("piiList");
const downloadBtn = document.getElementById("downloadBtn");
const reportBtn   = document.getElementById("reportBtn");
const uploadBox  = document.getElementById("uploadBox");

let selectedFile  = null;
let downloadPath  = "";
let reportPath    = "";


/* Browse File */

browseBtn.addEventListener("click", () => {
  fileInput.click();
});


/* Drag & Drop Upload */

uploadBox.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadBox.style.borderColor = "#007bff";
});

uploadBox.addEventListener("dragleave", () => {
  uploadBox.style.borderColor = "#aaa";
});

uploadBox.addEventListener("drop", (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    selectedFile = files[0];
    fileInput.files = files;
    processBtn.disabled = false;
    document.getElementById("uploadText").textContent = selectedFile.name;
  }
  uploadBox.style.borderColor = "#aaa";
});


/* File Input Change */

fileInput.addEventListener("change", () => {
  selectedFile = fileInput.files[0];
  if (selectedFile) {
    document.getElementById("uploadText").textContent = selectedFile.name;
    processBtn.disabled = false;
  }
});


/* Process Document */

processBtn.addEventListener("click", async () => {

  if (!selectedFile) {
    alert("Please upload a file");
    return;
  }

  loader.classList.remove("hidden");

  const formData = new FormData();
  formData.append("document", selectedFile);

  try {

    const response = await fetch("/api/upload", {
      method: "POST",
      body:   formData
    });

    const data = await response.json();

    loader.classList.add("hidden");

    showResults(data);

    /* Redacted file path */
    if (data.redactedFile) {
      downloadPath = data.redactedFile;
      downloadBtn.disabled = false;
    } else {
      downloadPath = "";
      downloadBtn.disabled = true;
    }

    /* Report file path (new) */
    if (data.reportFile) {
      reportPath = data.reportFile;
      reportBtn.disabled = false;
    } else {
      reportPath = "";
      reportBtn.disabled = true;
    }

    /* Reset file input */
    fileInput.value = "";
    selectedFile    = null;
    processBtn.disabled = true;

  } catch (err) {
    loader.classList.add("hidden");
    alert("Error processing file");
  }

});


/* Show Results */

function showResults(data) {

  results.classList.remove("hidden");
  piiList.innerHTML = "";

  const detected = data.detectedPII;

  if (!detected || Object.keys(detected).length === 0) {
    const div = document.createElement("div");
    div.className   = "no-pii-message";
    div.textContent = "No sensitive information detected.";
    piiList.appendChild(div);
    downloadBtn.disabled = true;
    reportBtn.disabled   = true;
    return;
  }

  downloadBtn.disabled = false;

  Object.keys(detected).forEach(type => {
    detected[type].forEach(item => {
      const div = document.createElement("div");
      div.className = "pii-item";
      const confidenceClass = item.confidence === "HIGH" ? "high" : "low";
      div.innerHTML = `
        <span>${type.toUpperCase()} : ${item.value}</span>
        <span class="${confidenceClass}">${item.confidence}</span>
      `;
      piiList.appendChild(div);
    });
  });
}


/* Download Redacted File */

downloadBtn.addEventListener("click", () => {
  if (!downloadPath) {
    alert("No redacted file available for download");
    return;
  }
  triggerDownload(window.location.origin + downloadPath,
                  downloadPath.split("/").pop());
});


/* Download Report */

reportBtn.addEventListener("click", () => {
  if (!reportPath) {
    alert("No report available for download");
    return;
  }
  triggerDownload(window.location.origin + reportPath,
                  reportPath.split("/").pop());
});


/* Shared download helper */

function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}