import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from ..database import delete_rows, insert_row, select_one, select_rows, utcnow_iso
from ..services import ai_service, cloudinary_service
from ..services.notification_service import send_push_notification
from ..utils.auth import get_current_user

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/analyze")
async def analyze_crop(
    request: Request,
    file: UploadFile = File(...),
    notes: str | None = Form(default=None),
    current_user: dict = Depends(get_current_user),
):
    """Upload a crop image and get AI-powered analysis."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WEBP images are allowed")

    image_data = await file.read()
    if len(image_data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB allowed")

    unique_name = f"{current_user['id']}_{uuid.uuid4().hex[:8]}_{file.filename}"
    try:
        cloud_result = await cloudinary_service.upload_image(image_data, unique_name)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {exc}") from exc

    try:
        ai_result = await ai_service.analyze_crop_image(
            image_data=image_data,
            filename=file.filename,
            provider_keys=ai_service.build_provider_keys(request.headers),
            notes=notes,
        )
        analysis_dict = ai_result["analysis"]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {exc}") from exc

    analysis_doc = {
        "id": uuid.uuid4().hex,
        "user_id": current_user["id"],
        "image_url": cloud_result["url"],
        "public_id": cloud_result["public_id"],
        "analysis": analysis_dict,
        "created_at": utcnow_iso(),
    }
    created_analysis = await insert_row("crop_analyses", analysis_doc)

    health_status = analysis_dict.get("health_status", "Healthy")
    if health_status in ["Risk", "Diseased"] and current_user.get("fcm_token"):
        title = "Crop Alert" if health_status == "Risk" else "Crop Disease Detected"
        body = analysis_dict.get("recommendations", ["Take action immediately."])[0]
        send_push_notification(current_user["fcm_token"], title, body, {"type": "crop_risk"})

        await insert_row(
            "notifications",
            {
                "id": uuid.uuid4().hex,
                "user_id": current_user["id"],
                "title": title,
                "body": body,
                "type": "crop_risk",
                "read": False,
                "sent_at": utcnow_iso(),
            },
        )

    return {
        "id": created_analysis["id"],
        "image_url": cloud_result["url"],
        "analysis": analysis_dict,
        "provider": ai_result["provider"],
        "model": ai_result["model"],
        "created_at": analysis_doc["created_at"],
    }


@router.get("/history")
async def get_crop_history(
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    """Get user's crop analysis history."""
    docs = await select_rows(
        "crop_analyses",
        filters=[("user_id", "eq", current_user["id"])],
        order_by="created_at",
        desc=True,
        limit=limit,
        offset=skip,
    )
    history = [
        {
            "id": str(doc["id"]),
            "image_url": doc["image_url"],
            "analysis": doc["analysis"],
            "created_at": doc["created_at"],
        }
        for doc in docs
    ]
    return {"history": history, "count": len(history)}


@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a crop analysis record."""
    doc = await select_one(
        "crop_analyses",
        filters=[("id", "eq", analysis_id), ("user_id", "eq", current_user["id"])],
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")

    await cloudinary_service.delete_image(doc["public_id"])
    await delete_rows("crop_analyses", filters=[("id", "eq", analysis_id)])
    return {"message": "Analysis deleted"}
