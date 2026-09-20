# Prahari AI service (optional)

FastAPI service that wraps a crop disease classification model.
Enabled by setting `AI_PROVIDER=model` and `AI_SERVICE_URL` in the root `.env`.
The Node.js API never contains model logic; it only speaks JSON to this service.

## Contract

POST /predict

Request:

```json
{
  "crop": "Tomato",
  "growth_stage": "FRUITING",
  "symptoms": "brown spots on lower leaves",
  "image_url": "/uploads/..."
}
```

Response (structured JSON):

```json
{
  "crop": "Tomato",
  "condition": "Early Blight",
  "confidence": 0.94,
  "severity": "moderate",
  "is_healthy": false,
  "symptoms": [],
  "causes": [],
  "recommendations": [],
  "prevention": []
}
```

Confidence may be 0-1 or 0-100; the backend normalizes it. The backend clamps
confidence to 99 percent and labels every result as AI-assisted; a diagnosis is
never presented as guaranteed.

## Run locally

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Wire in a real model

Replace the heuristic in `app/services/classifier.py` with your trained model
(for example a CNN fine-tuned on the PlantVillage dataset). Keep the response
contract identical; nothing else in the stack needs to change.
