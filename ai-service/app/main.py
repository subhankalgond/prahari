"""FastAPI entrypoint for the Prahari AI service."""

from fastapi import FastAPI

from app.models.schemas import PredictRequest, PredictResponse
from app.services.classifier import classify

app = FastAPI(title="Prahari AI Service", version="1.0.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "prahari-ai"}


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    return classify(payload)
