from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CropAnalysisResult(BaseModel):
    crop_type: str
    growth_stage: str
    growth_percentage: int
    health_status: str  # "Healthy" | "Risk" | "Diseased"
    confidence: float
    recommendations: List[str]
    next_steps: List[str]
    detected_issues: Optional[List[str]] = []


class CropAnalysisCreate(BaseModel):
    user_id: str
    image_url: str
    public_id: str
    analysis: CropAnalysisResult
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CropAnalysisResponse(BaseModel):
    id: str
    image_url: str
    analysis: CropAnalysisResult
    created_at: datetime
