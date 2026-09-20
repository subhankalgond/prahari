"""Classifier implementation.

This module is the single integration point for a real model. The shipped
implementation is a clearly-marked placeholder heuristic so the service can be
run end to end before a trained model is connected.
"""

from app.models.schemas import PredictRequest, PredictResponse

# TODO: load a trained model (for example a CNN fine-tuned on PlantVillage)
# here and run inference on the image referenced by request.image_url.
# Keep the PredictResponse contract unchanged.

_PROFILE = {
    "tomato": ("Early Blight", "moderate", 0.84),
    "rice": ("Blast", "high", 0.81),
    "paddy": ("Blast", "high", 0.81),
    "chilli": ("Thrips damage", "moderate", 0.79),
    "cotton": ("Alternaria Leaf Spot", "moderate", 0.80),
}


def classify(request: PredictRequest) -> PredictResponse:
    crop_key = request.crop.strip().lower()
    condition, severity, confidence = _PROFILE.get(crop_key, ("Unknown condition", "moderate", 0.55))
    is_healthy = False
    return PredictResponse(
        crop=request.crop,
        condition=condition,
        confidence=confidence,
        severity=severity,
        is_healthy=is_healthy,
        symptoms=[
            "Placeholder response: connect a trained model in app/services/classifier.py",
        ],
        causes=["Integration point for a real model"],
        recommendations=["Verify this result with a local agricultural expert"],
        prevention=["Follow integrated pest management practices"],
    )
