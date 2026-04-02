import uuid

from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import insert_row, utcnow_iso
from ..services.notification_service import send_push_notification
from ..services.weather_service import fetch_weather
from ..utils.auth import get_current_user

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
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Weather service error: {exc}") from exc

    weather_dict = weather.model_dump()

    await insert_row(
        "weather_data",
        {
            "id": uuid.uuid4().hex,
            "user_id": current_user["id"],
            "lat": lat,
            "lon": lon,
            "data": weather_dict,
            "timestamp": utcnow_iso(),
        },
    )

    risk = weather.risk
    if risk.level in ["high", "medium"] and current_user.get("fcm_token"):
        title = f"Weather Alert: {risk.type.title() if risk.type else 'Risk'}"
        send_push_notification(
            current_user["fcm_token"],
            title,
            risk.message or "Check weather conditions",
            {"type": "weather_risk"},
        )
        await insert_row(
            "notifications",
            {
                "id": uuid.uuid4().hex,
                "user_id": current_user["id"],
                "title": title,
                "body": risk.message,
                "type": "weather_risk",
                "read": False,
                "sent_at": utcnow_iso(),
            },
        )

    return weather_dict
