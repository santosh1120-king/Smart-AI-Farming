import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from bson import ObjectId
from datetime import datetime

from ..database import get_collection
from ..utils.auth import get_current_user
from ..services import ai_service, cloudinary_service
from ..services.notification_service import send_push_notification
from ..models.crop import CropAnalysisResponse, CropAnalysisResult

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/analyze")
async def analyze_crop(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload a crop image and get AI-powered analysis."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WEBP images are allowed")
    
    image_data = await file.read()
    if len(image_data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB allowed")
    
    # Upload to Cloudinary
    unique_name = f"{current_user['id']}_{uuid.uuid4().hex[:8]}_{file.filename}"
    try:
        cloud_result = await cloudinary_service.upload_image(image_data, unique_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
    
    # AI Analysis
    try:
        analysis_dict = await ai_service.analyze_crop_image(image_data, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")
    
    # Save to database
    analysis_doc = {
        "user_id": current_user["id"],
        "image_url": cloud_result["url"],
        "public_id": cloud_result["public_id"],
        "analysis": analysis_dict,
        "created_at": datetime.utcnow(),
    }
    crops = get_collection("crop_analyses")
    result = await crops.insert_one(analysis_doc)
    
    # Send push notification if crop is at risk
    health_status = analysis_dict.get("health_status", "Healthy")
    if health_status in ["Risk", "Diseased"] and current_user.get("fcm_token"):
        title = "⚠️ Crop Alert!" if health_status == "Risk" else "🚨 Crop Disease Detected!"
        body = analysis_dict.get("recommendations", ["Take action immediately."])[0]
        send_push_notification(current_user["fcm_token"], title, body, {"type": "crop_risk"})
        
        # Save notification
        notifs = get_collection("notifications")
        await notifs.insert_one({
            "user_id": current_user["id"],
            "title": title,
            "body": body,
            "type": "crop_risk",
            "read": False,
            "sent_at": datetime.utcnow(),
        })
    
    return {
        "id": str(result.inserted_id),
        "image_url": cloud_result["url"],
        "analysis": analysis_dict,
        "created_at": analysis_doc["created_at"].isoformat(),
    }


@router.get("/history")
async def get_crop_history(
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    """Get user's crop analysis history."""
    crops = get_collection("crop_analyses")
    cursor = crops.find({"user_id": current_user["id"]}).sort("created_at", -1).skip(skip).limit(limit)
    history = []
    async for doc in cursor:
        history.append({
            "id": str(doc["_id"]),
            "image_url": doc["image_url"],
            "analysis": doc["analysis"],
            "created_at": doc["created_at"].isoformat(),
        })
    return {"history": history, "count": len(history)}


@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a crop analysis record."""
    crops = get_collection("crop_analyses")
    doc = await crops.find_one({"_id": ObjectId(analysis_id), "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    await cloudinary_service.delete_image(doc["public_id"])
    await crops.delete_one({"_id": ObjectId(analysis_id)})
    return {"message": "Analysis deleted"}
