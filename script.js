const classifyBtn = document.getElementById("classifyBtn");
const imageInput = document.getElementById("imageInput");
const fileNameEl = document.getElementById("fileName");

const resultBox = document.getElementById("resultBox");
const labelEl = document.getElementById("label");
const confidenceEl = document.getElementById("confidence");
const roastEl = document.getElementById("roast");

const allowedImages = [
    "png", "jpg", "jpeg", "jfif", "webp"
  ];

classifyBtn.addEventListener("click", () => {
  if (!imageInput.files.length) {
    alert("Upload an image first 🤡");
    return;
  }

  // 🤡 FAKE BACKEND RESPONSE
  const file = imageInput.files[0];
  const formData = new FormData();
  formData.append("file", file);
  
  fetch("http://127.0.0.1:8000/classify", {
    method: "POST",
    body: formData
  })
    .then(res => {
      if (!res.ok) throw new Error("Backend rejected image");
      return res.json();
    })
    .then(data => {
      showResult(data.label, data.confidence, data.raw_prob);
    })
    .catch(err => {
      roastEl.textContent = "💥 Backend exploded. CNN rage quit.";
      resultBox.classList.remove("hidden");
    });
});

imageInput.addEventListener("change", () => {
    if (!imageInput.files.length) return;
  
    const file = imageInput.files[0];
    const name = file.name;
    const ext = name.split(".").pop().toLowerCase();
  
    fileNameEl.textContent = name;
    fileNameEl.classList.add("uploaded");
  
    if (!allowedImages.includes(ext)) {
      handleInvalidFile(ext);
    } else {
      // valid image, restore normal flow
      resultBox.classList.add("hidden");
      classifyBtn.style.display = "inline-block";
    }
  });

function handleInvalidFile(ext) {
    classifyBtn.style.display = "none";
    resultBox.classList.remove("hidden");

    roastEl.textContent = getFileRoast(ext);
}

function showResult(label, confidence, raw_prob) {
  labelEl.textContent = label;
  confidenceEl.textContent = confidence.toFixed(2);

  roastEl.textContent = getRoast(label, confidence);

  resultBox.classList.remove("hidden");

  // Extra chaos
  resultBox.classList.remove("shake");
  void resultBox.offsetWidth; // force reflow

  console.log(raw_prob)

  if (confidence > 0.85) {
    resultBox.classList.add("shake");
  }
}

function getFileRoast(ext) {
    if (ext === "svg")
      return "🤡 SVG detected. You uploaded math. Literal math.";
  
    if (ext === "gif")
      return "🎞️ GIF uploaded. Pick a frame and come back.";
  
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext))
      return "📄 Office file detected. This is not your presentation defense.";
  
    if (["h5", "pt", "pth", "onnx", "ckpt"].includes(ext))
      return "🧠 Model file detected. Reverse this and you deserve a PhD.";
  
    if (["c", "py", "cs", "java", "js", "cpp", "rs", "go", "asm"].includes(ext))
      return "💻 Code detected. The CNN cannot compile this.";

    if (["mp3", "wav", "flac", "aac", "ogg", "m4a", "mid"].includes(ext))
      return "🎧 Audio detected. The CNN does not have ears.";    
    
    if (["mp4", "mov", "avi", "mkv", "flv"].includes(ext))
     return "🎬 Video detected. The CNN is not watching this.";

    return "💀 Unknown file type. What were you trying to do.";
  }

  function getRoast(label, confidence) {
    if (label === "FURRY") {
      if (confidence >= 0.9)
        return "🚨🚨 ABSOLUTE FURRY. THE MODEL DID NOT BLINK. THE GPU KNEW INSTANTLY.";
      if (confidence >= 0.75)
        return "🦊 Strong furry energy detected. This was not subtle.";
      if (confidence >= 0.55)
        return "🤔 Leaning furry. The model squinted… and sighed.";
      if (confidence >= 0.3)
        return "😬 Borderline furry. This image caused internal debate.";
      return "😵 The model is confused, but concerned. Nobody is confident here.";
    }
  
    // NOT_FURRY branch
    if (confidence >= 0.9)
      return "✅ Certified not furry. The model relaxed immediately.";
    if (confidence >= 0.75)
      return "😌 Not furry. The CNN feels safe.";
    if (confidence >= 0.55)
      return "👀 Probably not furry… but the model kept looking.";
    if (confidence >= 0.3)
      return "🤨 Not furry, but something is *off*. The model took notes.";
    return "💀 This broke the classifier. Reality is unclear.";
  }
  