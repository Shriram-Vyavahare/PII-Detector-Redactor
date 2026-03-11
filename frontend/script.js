const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const processBtn = document.getElementById("processBtn");

const loader = document.getElementById("loader");

const results = document.getElementById("results");
const piiList = document.getElementById("piiList");

const downloadBtn = document.getElementById("downloadBtn");

let selectedFile = null;
let downloadPath = "";


/* Browse File */

browseBtn.addEventListener("click", () => {

fileInput.click();

});


fileInput.addEventListener("change", () => {

selectedFile = fileInput.files[0];

if(selectedFile){

processBtn.disabled = false;

}

});


/* Process Document */

processBtn.addEventListener("click", async () => {

if(!selectedFile){

alert("Please upload a file");

return;

}

loader.classList.remove("hidden");

const formData = new FormData();

formData.append("document", selectedFile);

try{

const response = await fetch("/api/upload",{

method:"POST",
body:formData

});

const data = await response.json();

loader.classList.add("hidden");

showResults(data);

downloadPath = data.redactedFile;

}catch(err){

loader.classList.add("hidden");

alert("Error processing file");

}

});


/* Show Results */

function showResults(data){

results.classList.remove("hidden");

piiList.innerHTML="";

const detected = data.detectedPII;

Object.keys(detected).forEach(type=>{

detected[type].forEach(item=>{

const div=document.createElement("div");

div.className="pii-item";

const confidenceClass = item.confidence === "HIGH" ? "high":"low";

div.innerHTML=`

<span>${type.toUpperCase()} : ${item.value}</span>

<span class="${confidenceClass}">${item.confidence}</span>

`;

piiList.appendChild(div);

});

});

}


/* Download File */

downloadBtn.addEventListener("click",()=>{

window.location.href = "/api/download";

});