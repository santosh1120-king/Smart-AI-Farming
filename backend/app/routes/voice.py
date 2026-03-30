from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from ..database import get_collection
from ..utils.auth import get_current_user
from ..services.ai_service import answer_farming_question
from ..models.misc import VoiceQueryRequest

router = APIRouter()


@router.post("/query")
async def voice_query(
    data: VoiceQueryRequest,
    current_user: dict = Depends(get_current_user),
):
    """Process a voice/text query and get an AI farming advisor response."""
    if not data.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        response = await answer_farming_question(data.query, data.context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    
    # Log to DB
    voice_col = get_collection("voice_logs")
    log_doc = {
        "user_id": current_user["id"],
        "query": data.query,
        "response": response,
        "created_at": datetime.utcnow(),
    }
    result = await voice_col.insert_one(log_doc)
    
    return {
        "id": str(result.inserted_id),
        "query": data.query,
        "response": response,
        "created_at": log_doc["created_at"].isoformat(),
    }


@router.get("/history")
async def get_voice_history(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    """Get user's voice query history."""
    voice_col = get_collection("voice_logs")
    cursor = voice_col.find({"user_id": current_user["id"]}).sort("created_at", -1).limit(limit)
    history = []
    async for doc in cursor:
        history.append({
            "id": str(doc["_id"]),
            "query": doc["query"],
            "response": doc["response"],
            "created_at": doc["created_at"].isoformat(),
        })
    return {"history": history}
