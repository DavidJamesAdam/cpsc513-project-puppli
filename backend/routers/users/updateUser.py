from firebase_service import db
from fastapi import APIRouter, HTTPException

router = APIRouter()

#temp get user (move or remove later)
@router.get("/user/{user_id}")
async def get_user(user_id: str):

    try:
        #get user from db
        doc = db.collection('users').document(user_id).get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        print(doc.to_dict())
        return doc.to_dict()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")
    
#update user info
#accepts a dict of fields with new values, not all fields need to be provided, just the ones that are changing
@router.patch("/user/update/{user_id}")
async def update_user(user_id: str, updated_fields: dict):
    try:
        #reference to user in db
        doc_ref = db.collection('users').document(user_id)
        #the actual user document object
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        #update user with provided fields
        doc_ref.update(updated_fields)

        return {"message": "User updated successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")