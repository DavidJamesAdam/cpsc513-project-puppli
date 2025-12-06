from firebase_service import db
from fastapi import APIRouter, FastAPI, HTTPException
from classes.location import Location

router = APIRouter()

@router.get("/pet/{pet_id}")
#fix class use if location stored as JSON instead of string
async def get_pet(pet_id: str):

    try:
        pet = db.collection('pets').document(pet_id).get().to_dict()
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")

        return pet

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching pet: {str(e)}")
