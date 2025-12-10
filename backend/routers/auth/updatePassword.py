from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ValidationError, field_validator
from firebase_admin import auth
import re

router = APIRouter()

COMMON_PASSWORDS = {"password", "12345678", "qwerty", "letmein"}

class PassUpdate(BaseModel):
    id_token: str
    new_password: str

    # Password Validation
    @field_validator("new_password")
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain a lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain a digit")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain a symbol")
        if v.lower() in COMMON_PASSWORDS:
            raise ValueError("Password is too common")
        return v

@router.post("/user/update-password")
async def update_password(request: Request, update: PassUpdate):
    try:
        data = await request.json()
        update = PassUpdate(**data)
        #verify user identity token, must be a new one!!! (not days old)
        decoded = auth.verify_id_token(update.id_token)
        uid = decoded["uid"]

        #update password in Firebase Auth
        auth.update_user(uid, password=update.new_password)

        return {"status": "success", "message": "Password updated successfully"}
    except auth.InvalidPasswordError:
        raise HTTPException(status_code=409, detail="Invalid password")
    except ValidationError as e:
        error_messages = []
        for error in e.errors():
            message = error["msg"]
            error_messages.append(f"{message}")
        raise HTTPException(status_code=422, detail=error_messages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e.errors))
