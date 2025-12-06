from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from firebase_admin import auth

router = APIRouter()

class PassUpdate(BaseModel):
    id_token: str
    new_password: str

@router.post("/user/update-password")
async def update_password(request: Request):
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
        raise HTTPException(status_code=400, detail="Invalid password")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
