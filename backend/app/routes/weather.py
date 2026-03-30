from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime

from ..database import get_collection
from ..utils.auth import get_current_user
from ..services.weather_service import fetch_weather
from ..services.notification_service import send_push_notification

router = APIRouter()


@router.get("")
async def get_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    current_user: dict = Depends(get_current_user),
):
    """Fetch real-time weather data and detect risks."""
    try:
        weather = fetch_weather(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather service error: {str(e)}")
    
    weather_dict = weather.model_dump()
    
    # Save to DB
    weather_col = get_collection("weather_data")
    await weather_col.insert_one({
        "user_id": current_user["id"],
        "lat": lat,
        "lon": lon,
        "data": weather_dict,
        "timestamp": datetime.utcnow(),
    })
    
    # Send push notification if high risk
    risk = weather.risk
    if risk.level in ["high", "medium"] and current_user.get("fcm_token"):
        send_push_notification(
            current_user["fcm_token"],
            f"🌦️ Weather Alert: {risk.type.title() if risk.type else 'Risk'}",
            risk.message or "Check weather conditions",
            {"type": "weather_risk"},
        )
        notifs = get_collection("notifications")
        await notifs.insert_one({
            "user_id": current_user["id"],
            "title": f"Weather Alert: {risk.type.title() if risk.type else 'Risk'}",
            "body": risk.message,
            "type": "weather_risk",
            "read": False,
            "sent_at": datetime.utcnow(),
        })
    
    return weather_dict
