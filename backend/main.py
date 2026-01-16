from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision.models import resnet18
from torchvision import transforms
from PIL import Image
import io

DEVICE = "cpu"

# ---------- Model ----------
def load_model():
    model = resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 1)
    model.load_state_dict(
        torch.load("furry_detector.pt", map_location=DEVICE)
    )
    model.eval()
    return model

model = load_model()

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

@app.head("/")
async def wake():
    return Response(status_code=200)

@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Not an image"
        )

    image_bytes = await file.read()

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except:
        raise HTTPException(
            status_code=400,
            detail="Corrupted image"
        )

    img_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        logits = model(img_tensor)
        prob = torch.sigmoid(logits).item()

        label = "FURRY" if prob >= 0.5 else "NOT_FURRY"
        confidence = abs(prob - 0.5) * 2

    return {
        "label": label,
        "confidence": round(confidence, 3),
        "raw_prob": round(prob, 3)  # optional but useful
    }
