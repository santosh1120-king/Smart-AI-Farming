from fastapi import APIRouter, Depends, Query
from typing import Optional

from ..database import get_collection
from ..utils.auth import get_current_user

router = APIRouter()


@router.get("")
async def get_schemes(
    state: Optional[str] = Query(None, description="Filter by state name"),
    crop: Optional[str] = Query(None, description="Filter by crop type"),
    current_user: dict = Depends(get_current_user),
):
    """Get government schemes filtered by state and crop."""
    schemes_col = get_collection("government_schemes")
    
    query = {}
    if state:
        query["$or"] = [
            {"state": {"$regex": state, "$options": "i"}},
            {"state": "All"},
        ]
    if crop:
        query["$or"] = query.get("$or", []) + [
            {"crop_type": {"$regex": crop, "$options": "i"}},
            {"crop_type": "All"},
        ]
    
    cursor = schemes_col.find(query).sort("name", 1)
    schemes = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        schemes.append(doc)
    
    return {"schemes": schemes, "count": len(schemes)}


@router.get("/{scheme_id}")
async def get_scheme(scheme_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single scheme by ID."""
    from bson import ObjectId
    schemes_col = get_collection("government_schemes")
    doc = await schemes_col.find_one({"_id": ObjectId(scheme_id)})
    if not doc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Scheme not found")
    doc["id"] = str(doc.pop("_id"))
    return doc
