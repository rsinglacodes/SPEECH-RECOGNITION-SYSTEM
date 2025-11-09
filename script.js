const fileElem = document.getElementById("fileElem");
const dropArea = document.getElementById("drop-area");
const uploadBtn = document.getElementById("btnUpload");
const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");
const clearBtn = document.getElementById("clearBtn");
const player = document.getElementById("audioPlayer");
const playerArea = document.getElementById("playerArea");
const spinner = document.getElementById("spinner");
const transcript = document.getElementById("transcript");
const resultArea = document.getElementById("resultArea");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const languageSelect = document.getElementById("language");

let recordedBlob = null;
let mediaRecorder;
let chunks = [];

// 🟢 Click on drop area to select file
dropArea.addEventListener("click", () => {
  fileElem.click();
});

// 🟢 Show selected file name in drop area
fileElem.addEventListener("change", () => {
  if (fileElem.files[0]) {
    const fileName = fileElem.files[0].name;
    dropArea.querySelector("p").textContent = `Selected: ${fileName}`;
    dropArea.style.borderColor = "#10b981";
    dropArea.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%)";
  }
});

// 🟢 File Upload
uploadBtn.addEventListener("click", async () => {
  const file = fileElem.files[0];
  if (!file) return alert("Please choose a file first!");

  await sendToServer(file);
});

// 🟢 Drag & Drop
dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("highlight");
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("highlight");
});

dropArea.addEventListener("drop", async (e) => {
  e.preventDefault();
  dropArea.classList.remove("highlight");
  const file = e.dataTransfer.files[0];
  if (file) {
    // Update the file input element
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileElem.files = dataTransfer.files;
    
    // Update drop area text
    dropArea.querySelector("p").textContent = `Selected: ${file.name}`;
    dropArea.style.borderColor = "#10b981";
    dropArea.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%)";
  }
});

// 🟢 Recorder
recordBtn.addEventListener("click", async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  chunks = [];

  mediaRecorder.ondataavailable = e => chunks.push(e.data);
  mediaRecorder.onstop = () => {
    recordedBlob = new Blob(chunks, { type: "audio/webm" });
    const url = URL.createObjectURL(recordedBlob);
    player.src = url;
    playerArea.style.display = "block";
  };

  mediaRecorder.start();
  recordBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener("click", async () => {
  mediaRecorder.stop();
  recordBtn.disabled = false;
  stopBtn.disabled = true;

  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendToServer(recordedBlob, "recorded.webm");
});

clearBtn.addEventListener("click", () => {
  playerArea.style.display = "none";
  resultArea.style.display = "none";
  transcript.textContent = "";
  recordedBlob = null;
  fileElem.value = "";
  
  // Reset drop area
  dropArea.querySelector("p").textContent = "Drag & drop audio here, or click to select";
  dropArea.style.borderColor = "";
  dropArea.style.background = "";
});

async function sendToServer(file, filename = "audio.wav") {
  spinner.style.display = "block";
  resultArea.style.display = "none";

  const formData = new FormData();
  formData.append("file", file, filename);
  formData.append("language", languageSelect.value);

  const res = await fetch("/transcribe", { method: "POST", body: formData });
  const data = await res.json();

  spinner.style.display = "none";

  if (data.error) {
    alert("Error: " + data.error);
    return;
  }

  resultArea.style.display = "block";
  transcript.textContent = data.text;
  document.getElementById("languageDetected").textContent =
    "Detected Language: " + data.language.toUpperCase();
}

// 🟢 Copy + Download
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(transcript.textContent);
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([transcript.textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transcript.txt";
  a.click();
});