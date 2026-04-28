import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import insert_row, select_rows, utcnow_iso
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
    if risk.level in ["high", "medium"]:
        title = f"Weather Alert: {risk.type.title() if risk.type else 'Risk'}"
        notif_type = f"weather_{risk.type or 'risk'}"

        # Duplicate prevention: skip if same alert type was sent in last 3 hours
        cooldown = (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat()
        recent = await select_rows(
            "notifications",
            filters=[
                ("user_id", "eq", current_user["id"]),
                ("type", "eq", notif_type),
                ("sent_at", "gte", cooldown),
            ],
            limit=1,
        )
        if recent:
            return weather_dict

        # Always save notification to DB (works without Firebase)
        await insert_row(
            "notifications",
            {
                "id": uuid.uuid4().hex,
                "user_id": current_user["id"],
                "title": title,
                "body": risk.message,
                "type": notif_type,
                "read": False,
                "sent_at": utcnow_iso(),
            },
        )

        # Send push notification only if FCM token exists (requires Firebase)
        if current_user.get("fcm_token"):
            send_push_notification(
                current_user["fcm_token"],
                title,
                risk.message or "Check weather conditions",
                {"type": notif_type},
            )

    return weather_dict
