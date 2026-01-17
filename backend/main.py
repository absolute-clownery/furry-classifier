from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision.models import resnet18
from torchvision import transforms
from PIL import Image
import io
import os

DEVICE = "cpu"

os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

# ---------- Model ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "furry_detector.pt")

def load_model():
    model = resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 1)
    model.load_state_dict(
        torch.load(MODEL_PATH, map_location=DEVICE)
    )
    model.eval()
    return model

model = load_model()

with torch.no_grad():
    dummy = torch.zeros(1, 3, 224, 224)
    model(dummy)

# ---------- Transform ----------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# ---------- App ----------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # chaos mode
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
async def ping():
    return {"status": "🤡 honk"}

@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Not an image")

        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        img_tensor = transform(image).unsqueeze(0)

        with torch.no_grad():
            logits = model(img_tensor)
            prob = torch.sigmoid(logits).item()

            label = "FURRY" if prob >= 0.5 else "NOT_FURRY"
            confidence = abs(prob - 0.5) * 2

        return {
            "label": label,
            "confidence": round(confidence, 3),
            "raw_prob": round(prob, 3)
        }

    except Exception as e:
        print("🤡 CLASSIFY CRASHED:", repr(e))
        raise HTTPException(status_code=500, detail="Classifier exploded")
