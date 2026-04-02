from fastapi import APIRouter, Depends, Query
from typing import Optional

from ..data.schemes_data import SCHEMES
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
    """Get hardcoded government schemes filtered by state and crop."""
    schemes = []
    for index, doc in enumerate(SCHEMES, start=1):
        state_match = doc.get("state") == "All" or _matches_filter(doc.get("state"), state)
        crop_match = doc.get("crop_type") == "All" or _matches_filter(doc.get("crop_type"), crop)
        if state_match and crop_match:
            schemes.append({
                "id": doc.get("id") or f"scheme-{index}",
                **doc,
            })

    return {"schemes": schemes, "count": len(schemes)}


@router.get("/{scheme_id}")
async def get_scheme(scheme_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single hardcoded scheme by ID."""
    for index, doc in enumerate(SCHEMES, start=1):
        hydrated = {
            "id": doc.get("id") or f"scheme-{index}",
            **doc,
        }
        if hydrated["id"] == scheme_id:
            return hydrated

    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Scheme not found")
