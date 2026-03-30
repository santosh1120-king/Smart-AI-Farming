from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class WeatherRisk(BaseModel):
    level: str  # "none" | "low" | "medium" | "high"
    type: Optional[str] = None  # "rain" | "heatwave" | "storm" | "frost"
    message: Optional[str] = None
    advice: Optional[str] = None


class WeatherData(BaseModel):
    temperature: float
    feels_like: float
    humidity: int
    condition: str
    condition_icon: str
    wind_speed: float
    visibility: float
    city: str
    country: str
    risk: WeatherRisk


class WeatherDataCreate(BaseModel):
    user_id: str
    lat: float
    lon: float
    data: WeatherData
    timestamp: datetime = Field(default_factory=datetime.utcnow)
