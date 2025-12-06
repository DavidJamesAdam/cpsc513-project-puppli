import re
import uuid
from fastapi import HTTPException, status, APIRouter
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, field_validator

from firebase_service import db
from firebase_admin import auth
from google.cloud import firestore as gcfirestore

COMMON_PASSWORDS = {"password", "12345678", "qwerty", "letmein"}

router = APIRouter()

class User(BaseModel):
    userName: str
    email: str
    password: str
    displayName: str | None = None
    provinceName: str
    cityName: str

    # Password Validation
    @field_validator("password")
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        # if not re.search(r"[A-Z]", v):
        #     raise ValueError("Password must contain an uppercase letter")
        # if not re.search(r"[a-z]", v):
        #     raise ValueError("Password must contain a lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain a digit")
        # if not re.search(r"[^A-Za-z0-9]", v):
        #     raise ValueError("Password must contain a symbol")
        if v.lower() in COMMON_PASSWORDS:
            raise ValueError("Password is too common")
        return v

@router.post("/users")
async def create_user(user: User):
    user_dict = user.model_dump()
    email = user_dict["email"].strip().lower()
    password = user_dict["password"]
    username = user_dict["userName"].strip()
    province = user_dict["provinceName"]
    city = user_dict["cityName"]

    # 1) Create the Firebase Auth user (password stored/managed by Auth)
    try:
        # run blocking Admin SDK call off the event loop
        user_record = await run_in_threadpool(auth.create_user, email=email, password=password)
        uid = user_record.uid
    except Exception as e:
        # Map certain error messages to appropriate statuses if you want
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Error creating auth user: {e}")

    user_ref = db.collection("users").document(uid)

    # 2) Finalize: within a transaction confirm reservation matches and write profile + attach uid to username doc
    @gcfirestore.transactional
    def _finalize_txn(transaction, user_ref, uid, user_dict, email, username, city, province):
        transaction.set(
            user_ref,
            {
                "uid": uid,
                "avatarUrl": "",
                "bio": "",
                "email": email,
                "userName": username,
                "displayName": user_dict.get("displayName") or "",
                "createdAt": gcfirestore.SERVER_TIMESTAMP,
                "location": f"{city}, {province}",
                "role": "user",
                "totalBronze": 0,
                "totalSilver": 0,
                "totalGold": 0
            },
        )

    try:
        txn2 = db.transaction()
        await run_in_threadpool(_finalize_txn, txn2, user_ref, uid, user_dict, email, username, city, province)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error writing profile: {e}")

    # Success — do not return password or any sensitive info
    return {"id": uid, "userName": username, "email": email, "displayName": user_dict.get("displayName", "")}
