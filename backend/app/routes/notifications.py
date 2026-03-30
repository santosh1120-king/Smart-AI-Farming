from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime

from ..database import get_collection
from ..utils.auth import get_current_user

router = APIRouter()


@router.get("")
async def get_notifications(
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    """Get user's notifications."""
    notifs = get_collection("notifications")
    cursor = notifs.find({"user_id": current_user["id"]}).sort("sent_at", -1).limit(limit)
    notifications = []
    async for doc in cursor:
        notifications.append({
            "id": str(doc["_id"]),
            "title": doc["title"],
            "body": doc["body"],
            "type": doc["type"],
            "read": doc.get("read", False),
            "sent_at": doc["sent_at"].isoformat(),
        })
    return {"notifications": notifications}


@router.put("/{notification_id}/read")
async def mark_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a notification as read."""
    notifs = get_collection("notifications")
    await notifs.update_one(
        {"_id": ObjectId(notification_id), "user_id": current_user["id"]},
        {"$set": {"read": True}},
    )
    return {"message": "Notification marked as read"}


@router.put("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read."""
    notifs = get_collection("notifications")
    await notifs.update_many(
        {"user_id": current_user["id"], "read": False},
        {"$set": {"read": True}},
    )
    return {"message": "All notifications marked as read"}


@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    notifs = get_collection("notifications")
    count = await notifs.count_documents({"user_id": current_user["id"], "read": False})
    return {"unread_count": count}
