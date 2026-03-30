from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from datetime import datetime

from ..database import get_collection
from ..models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from ..utils.auth import hash_password, verify_password, create_access_token

router = APIRouter()


def _user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        state=user.get("state"),
        phone=user.get("phone"),
        created_at=user.get("created_at", datetime.utcnow()),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate):
    users = get_collection("users")
    
    # Check duplicate email
    existing = await users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "name": data.name,
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "state": data.state,
        "phone": data.phone,
        "fcm_token": None,
        "created_at": datetime.utcnow(),
    }
    result = await users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    token = create_access_token({"sub": str(result.inserted_id)})
    return TokenResponse(access_token=token, user=_user_to_response(user_doc))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    users = get_collection("users")
    user = await users.find_one({"email": data.email})
    
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(access_token=token, user=_user_to_response(user))


@router.put("/fcm-token")
async def update_fcm_token(token_data: dict, current_user: dict = None):
    """Update the FCM token for push notifications."""
    from ..utils.auth import get_current_user
    from fastapi import Depends
    users = get_collection("users")
    await users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"fcm_token": token_data.get("fcm_token")}},
    )
    return {"message": "FCM token updated"}
