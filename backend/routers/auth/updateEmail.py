from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, ValidationError
from firebase_admin import auth
from firebase_service import db

router = APIRouter()

class EmailUpdate(BaseModel):
    id_token: str
    new_email: EmailStr

@router.post("/user/update-email")
async def update_email(request: Request):
    try:
        data = await request.json()
        update = EmailUpdate(**data)
        #verify user identity token, must be a new one!!! (not days old)
        decoded = auth.verify_id_token(update.id_token)
        uid = decoded["uid"]

        #update email in Firebase Auth
        auth.update_user(uid, email=update.new_email)

        #update profile document in firestore
        user_ref = db.collection("users").document(uid)
        user_ref.update({"email": update.new_email})

        return {"status": "success", "message": "Email updated successfully"}

    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Email already in use")
    except ValidationError as e:
        error_messages = []
        for error in e.errors():
            message = error["msg"]
            error_messages.append(f"{message}")
        raise HTTPException(status_code=422, detail=error_messages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e.errors()))
