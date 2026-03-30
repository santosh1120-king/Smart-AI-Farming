from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class GovernmentScheme(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    benefits: str
    eligibility: str
    state: str  # "All" or specific state name
    crop_type: Optional[str] = "All"
    apply_link: str
    ministry: str
    deadline: Optional[str] = None


class Notification(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    body: str
    type: str  # "weather_risk" | "crop_risk" | "scheme" | "general"
    read: bool = False
    sent_at: datetime = Field(default_factory=datetime.utcnow)


class VoiceLog(BaseModel):
    id: Optional[str] = None
    user_id: str
    query: str
    response: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class VoiceQueryRequest(BaseModel):
    query: str
    context: Optional[str] = None
