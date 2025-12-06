from firebase_service import db
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.patch("/pet/update/{pet_id}")
#update pet info
#accepts a dict of fields with new values, not all fields need to be provided, just the ones that are changing
@router.patch("/pet/update/{pet_id}")
async def update_pet(pet_id: str, updated_fields: dict):

    try:
        #reference to pet in db
        doc_ref = db.collection('pets').document(pet_id)
        #actual pet object
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        #update user with provided fields
        doc_ref.update(updated_fields)

        return {"message": "Pet updated successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating pet: {str(e)}")