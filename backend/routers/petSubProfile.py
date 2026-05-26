from pydantic import BaseModel
from firebase_service import db
from fastapi import APIRouter, Request, HTTPException, Depends
from firebase_admin import auth
from utils.authCheck import auth_check

router = APIRouter(tags=["Pet Sub Profile"], dependencies= [Depends(auth_check)])

class PetCreate(BaseModel):
    name: str
    breed: str
    birthday: str
    favouriteToy: str
    favouriteTreat: str


@router.post("/pet/create")
async def create_subprofile(pet: PetCreate, user = Depends(auth_check)):
    """
    Create a new pet profile for the authenticated user
    """
    try:
        user_id = user["user_id"]

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

@router.get("/pet")
async def get_pets(user = Depends(auth_check)):
    """
    Retrieve all pets for the authenticated user
    """
    try:
        # Verify session and get user ID
        user_id = user["user_id"]

        # Query pets collection filtered by userId
        docs = db.collection('pets').where('userId', '==', user_id).stream()

        results = []
        for doc in docs:
            pet_data = doc.to_dict()
            pet_data['id'] = doc.id
            results.append(pet_data)

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pet/{pet_id}")
#fix class use if location stored as JSON instead of string
async def get_pet(pet_id: str, user = Depends(auth_check)):

    try:
        pet = db.collection('pets').document(pet_id).get().to_dict()
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")

        return pet

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching pet: {str(e)}")


@router.get("/pet/{pet_id}/last-image")
async def get_last_pet_image(pet_id: str, user = Depends(auth_check)):
    """
    Retrieve the most recent post image URL for a specific pet
    Returns the imageUrl of the most recent post, or empty string if no posts exist
    """
    try:
        # Query posts collection filtered by petId
        posts_query = db.collection('posts').where('petId', '==', pet_id)
        docs = list(posts_query.stream())

        # If no posts found, return empty string
        if not docs:
            return {"imageUrl": ''}

        # Sort posts by createdAt in Python (to avoid needing a Firestore index)
        sorted_posts = sorted(
            docs,
            key=lambda doc: doc.to_dict().get('createdAt', ''),
            reverse=True
        )

        # Return the imageUrl of the most recent post
        post_data = sorted_posts[0].to_dict()
        return {"imageUrl": post_data.get('imageUrl', '')}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching pet image: {str(e)}")


@router.get("/pet/{pet_id}/images")
async def get_pet_images(pet_id: str, user = Depends(auth_check)):
    """
    Retrieve all post image URLs for a specific pet
    Returns a list of image URLs sorted by createdAt (most recent first)
    """
    try:
        # Query posts collection filtered by petId
        posts_query = db.collection('posts').where('petId', '==', pet_id)
        docs = list(posts_query.stream())

        # If no posts found, return empty list
        if not docs:
            return {"images": []}

        # Sort posts by createdAt (most recent first)
        sorted_posts = sorted(
            docs,
            key=lambda doc: doc.to_dict().get('createdAt', ''),
            reverse=True
        )

        # Return list of image URLs with comments
        images = []
        for doc in sorted_posts:
            post_data = doc.to_dict()
            if post_data.get('imageUrl'):
                images.append({
                    "id": doc.id,
                    "imageUrl": post_data.get('imageUrl', ''),
                    "caption": post_data.get('caption', ''),
                    "createdAt": post_data.get('createdAt', ''),
                    "comments": post_data.get('comments', [])
                })

        return {"images": images}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching pet images: {str(e)}")


@router.patch("/pet/update/{pet_id}")
#update pet info
#accepts a dict of fields with new values, not all fields need to be provided, just the ones that are changing
async def update_pet(pet_id: str, updated_fields: dict, user = Depends(auth_check)):

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

@router.delete("/pet/delete/{pet_id}")
#delete pet subprofile
async def delete_pet(pet_id: str, user = Depends(auth_check)):

    try:
        #reference to pet in db
        doc_ref = db.collection('pets').document(pet_id)
        #actual pet object
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Pet not found")

        #delete the pet
        doc_ref.delete()

        return {"message": "Pet deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting pet: {str(e)}")