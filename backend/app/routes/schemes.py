from fastapi import APIRouter, Depends, Query
from typing import Optional

from ..database import select_one, select_rows
from ..utils.auth import get_current_user

router = APIRouter()


def _matches_filter(value: Optional[str], search: Optional[str]) -> bool:
    if not search:
        return True
    if not value:
        return False
    return search.lower() in value.lower()


@router.get("")
async def get_schemes(
    state: Optional[str] = Query(None, description="Filter by state name"),
    crop: Optional[str] = Query(None, description="Filter by crop type"),
    current_user: dict = Depends(get_current_user),
):
    """Get government schemes filtered by state and crop."""
    docs = await select_rows("government_schemes", order_by="name")
    schemes = []
    for doc in docs:
        state_match = doc.get("state") == "All" or _matches_filter(doc.get("state"), state)
        crop_match = doc.get("crop_type") == "All" or _matches_filter(doc.get("crop_type"), crop)
        if state_match and crop_match:
            schemes.append(doc)
    
    return {"schemes": schemes, "count": len(schemes)}


@router.get("/{scheme_id}")
async def get_scheme(scheme_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single scheme by ID."""
    doc = await select_one("government_schemes", filters=[("id", "eq", scheme_id)])
    if not doc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Scheme not found")
    return doc
