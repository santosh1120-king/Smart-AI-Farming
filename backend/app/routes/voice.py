from fastapi import APIRouter, HTTPException, Depends
from fastapi import Request

from ..database import insert_row, select_rows, utcnow_iso
from ..utils.auth import get_current_user
from ..services.ai_service import answer_farming_question
from ..services import ai_service
from ..models.misc import VoiceQueryRequest
import uuid

router = APIRouter()


@router.post("/query")
async def voice_query(
    request: Request,
    data: VoiceQueryRequest,
    current_user: dict = Depends(get_current_user),
):
    """Process a voice/text query and get an AI farming advisor response."""
    if not data.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        ai_result = await answer_farming_question(
            query=data.query,
            context=data.context,
            provider_keys=ai_service.build_provider_keys(request.headers),
        )
        response = ai_result["response"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    
    # Log to DB
    log_doc = {
        "id": uuid.uuid4().hex,
        "user_id": current_user["id"],
        "query": data.query,
        "response": response,
        "created_at": utcnow_iso(),
    }
    created_log = await insert_row("voice_logs", log_doc)
    
    return {
        "id": created_log["id"],
        "query": data.query,
        "response": response,
        "provider": ai_result["provider"],
        "model": ai_result["model"],
        "created_at": log_doc["created_at"],
    }


@router.get("/history")
async def get_voice_history(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    """Get user's voice query history."""
    docs = await select_rows(
        "voice_logs",
        filters=[("user_id", "eq", current_user["id"])],
        order_by="created_at",
        desc=True,
        limit=limit,
    )
    history = []
    for doc in docs:
        history.append({
            "id": str(doc["id"]),
            "query": doc["query"],
            "response": doc["response"],
            "created_at": doc["created_at"],
        })
    return {"history": history}
