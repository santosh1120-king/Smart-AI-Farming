from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
import uuid
import httpx

from ..database import insert_row, select_one, update_rows, utcnow_iso
from ..models.user import GoogleAuthRequest, UserCreate, UserLogin, UserResponse, TokenResponse
from ..config import get_settings
from ..utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()
settings = get_settings()


def _user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["id"]),
        name=user["name"],
        email=user["email"],
        state=user.get("state"),
        phone=user.get("phone"),
        created_at=user.get("created_at", datetime.utcnow()),
    )


async def _fetch_supabase_user(access_token: str) -> dict:
    if not settings.supabase_url or not settings.supabase_key:
        raise HTTPException(status_code=500, detail="Supabase auth is not configured")

    headers = {
        "Authorization": f"Bearer {access_token}",
        "apikey": settings.supabase_key,
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(f"{settings.supabase_url.rstrip('/')}/auth/v1/user", headers=headers)

    if response.status_code == 200:
        return response.json()

    raise HTTPException(status_code=401, detail="Invalid Supabase session")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate):
    existing = await select_one("users", filters=[("email", "eq", data.email)])
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "id": uuid.uuid4().hex,
        "name": data.name,
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "state": data.state,
        "phone": data.phone,
        "fcm_token": None,
        "created_at": utcnow_iso(),
    }
    created_user = await insert_row("users", user_doc)

    token = create_access_token({"sub": created_user["id"]})
    return TokenResponse(access_token=token, user=_user_to_response(created_user))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await select_one("users", filters=[("email", "eq", data.email)])
    if not user or not verify_password(data.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token({"sub": str(user["id"])})
    return TokenResponse(access_token=token, user=_user_to_response(user))


@router.post("/google", response_model=TokenResponse)
async def google_auth(data: GoogleAuthRequest):
    supabase_user = await _fetch_supabase_user(data.access_token)

    email = supabase_user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account did not return an email")

    metadata = supabase_user.get("user_metadata") or {}
    name = metadata.get("full_name") or metadata.get("name") or email.split("@")[0]

    user = await select_one("users", filters=[("email", "eq", email)])

    if not user:
        user = await insert_row(
            "users",
            {
                "id": uuid.uuid4().hex,
                "name": name,
                "email": email,
                "hashed_password": "",
                "state": None,
                "phone": None,
                "fcm_token": None,
                "created_at": utcnow_iso(),
            },
        )
    elif not user.get("name") and name:
        updated_users = await update_rows(
            "users",
            {"name": name},
            filters=[("id", "eq", user["id"])],
        )
        if updated_users:
            user = updated_users[0]

    token = create_access_token({"sub": str(user["id"])})
    return TokenResponse(access_token=token, user=_user_to_response(user))


@router.put("/fcm-token")
async def update_fcm_token(
    token_data: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update the FCM token for push notifications."""
    await update_rows(
        "users",
        {"fcm_token": token_data.get("fcm_token")},
        filters=[("id", "eq", current_user["id"])],
    )
    return {"message": "FCM token updated"}
