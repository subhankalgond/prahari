"""Request and response schemas for the prediction contract."""

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    crop: str = Field(min_length=1, max_length=60)
    growth_stage: str | None = None
    symptoms: str | None = None
    image_url: str | None = None


class PredictResponse(BaseModel):
    crop: str
    condition: str
    confidence: float = Field(ge=0, le=1)
    severity: str
    is_healthy: bool
    symptoms: list[str]
    causes: list[str]
    recommendations: list[str]
    prevention: list[str]
