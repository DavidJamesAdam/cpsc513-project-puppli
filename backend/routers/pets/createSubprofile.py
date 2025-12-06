from pydantic import BaseModel
from firebase_service import db
from fastapi import APIRouter, Request, HTTPException
from firebase_admin import auth

router = APIRouter()

class PetCreate(BaseModel):
    name: str
    breed: str
    birthday: str
    favouriteToy: str
    favouriteTreat: str

@router.post("/pet/create")
async def create_subprofile(pet: PetCreate, request: Request):
    """
    Create a new pet profile for the authenticated user
    """
    # Get session cookie and verify authentication
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Verify session and get user ID
        decoded = auth.verify_session_cookie(session_cookie, check_revoked=True)
        user_id = decoded.get("uid")

        # Create a new document with auto-generated ID
        pets_collection = db.collection("pets")
        pet_ref = pets_collection.document()

        pet_data = {
            "userId": user_id,
            "name": pet.name,
            "breed": pet.breed,
            "birthday": pet.birthday,
            "favouriteToy": pet.favouriteToy,
            "favouriteTreat": pet.favouriteTreat,
        }

        # Save to Firestore
        pet_ref.set(pet_data)

        return {
            "id": pet_ref.id,
            **pet_data,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))