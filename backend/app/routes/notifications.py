from fastapi import APIRouter, Depends

from ..database import count_rows, select_rows, update_rows
from ..utils.auth import get_current_user

router = APIRouter()


@router.get("")
async def get_notifications(
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    """Get user's notifications."""
    docs = await select_rows(
        "notifications",
        filters=[("user_id", "eq", current_user["id"])],
        order_by="sent_at",
        desc=True,
        limit=limit,
    )
    notifications = []
    for doc in docs:
        notifications.append({
            "id": str(doc["id"]),
            "title": doc["title"],
            "body": doc["body"],
            "type": doc["type"],
            "read": doc.get("read", False),
            "sent_at": doc["sent_at"],
        })
    return {"notifications": notifications}


@router.put("/{notification_id}/read")
async def mark_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a notification as read."""
    await update_rows(
        "notifications",
        {"read": True},
        filters=[("id", "eq", notification_id), ("user_id", "eq", current_user["id"])],
    )
    return {"message": "Notification marked as read"}


@router.put("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read."""
    await update_rows(
        "notifications",
        {"read": True},
        filters=[("user_id", "eq", current_user["id"]), ("read", "eq", False)],
    )
    return {"message": "All notifications marked as read"}


@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    count = await count_rows(
        "notifications",
        filters=[("user_id", "eq", current_user["id"]), ("read", "eq", False)],
    )
    return {"unread_count": count}
