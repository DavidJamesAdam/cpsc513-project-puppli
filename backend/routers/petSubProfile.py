from datetime import datetime, timezone
from firebase_service import db
from fastapi import APIRouter, HTTPException, Depends, Request, Response
from utils.authCheck import auth_check, require_owner_or_admin
from models import PetCreate, PetInfo, UpdatePet
from limiter import limiter
from logger import LoggedRoute

router = APIRouter(route_class=LoggedRoute)


@router.post("/create", response_model=PetInfo)
@limiter.limit("5/minute")
async def create_subprofile(request: Request, response: Response, pet: PetCreate, user=Depends(auth_check)):
  """
  Create a new pet profile for the authenticated user
  """
  try:
    user_id = user["user_id"]

    pets_collection = db.collection("pets")
    pet_ref = pets_collection.document()

    pet_data = {
        "userId": user_id,
        "name": pet.name,
        "breed": pet.breed,
        "birthday": pet.birthday,
        "favouriteToy": pet.favouriteToy,
        "favouriteTreat": pet.favouriteTreat,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": None,
        "deleteAt": None
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


@router.get("", response_model=list[PetInfo])
async def get_pets(user=Depends(auth_check)):
  """
  Retrieve all pets for the authenticated user
  """
  try:
    user_id = user["user_id"]
    docs = db.collection("pets").where("userId", "==", user_id).stream()

    results = []
    for doc in docs:
      pet_data = doc.to_dict()
      pet_data["id"] = doc.id
      results.append(pet_data)

    return results
  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@router.get("/{pet_id}", response_model=PetInfo)
async def get_pet(pet_id: str, user=Depends(auth_check)):
  """Retrieves pet by ID

  Admin can retrieve any pet, users who own a pet may only access their own pets"""
  try:
    pet = db.collection("pets").document(pet_id).get().to_dict()
    if pet["deletedAt"]:
      raise HTTPException(status_code=404, detail="Pet not found")

    await require_owner_or_admin(
        owner_id=pet["userId"],
        user=user
    )

    return pet

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error fetching pet: {str(e)}")


@router.get("/{pet_id}/last-image")
async def get_last_pet_image(pet_id: str, user=Depends(auth_check)):
  """
  Retrieve the most recent post image URL for a specific pet
  Returns the imageUrl of the most recent post, or empty string if no posts exist
  """
  try:
    # Query posts collection filtered by petId
    posts_query = db.collection("posts").where("petId", "==", pet_id)
    docs = list(posts_query.stream())
    # If no posts found, return empty string
    if not docs:
      return {"imageUrl": ""}

    await require_owner_or_admin(
        owner_id=docs["userId"],
        user=user
    )

    # Sort posts by createdAt in Python (to avoid needing a Firestore index)
    sorted_posts = sorted(
        docs, key=lambda doc: doc.to_dict().get("createdAt", ""), reverse=True
    )

    # Return the imageUrl of the most recent post
    post_data = sorted_posts[0].to_dict()
    return {"imageUrl": post_data.get("imageUrl", "")}

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error fetching pet image: {str(e)}"
    )


@router.get("/{pet_id}/images")
async def get_pet_images(pet_id: str, user=Depends(auth_check)):
  """
  Retrieve all post image URLs for a specific pet
  Returns a list of image URLs sorted by createdAt (most recent first)
  """
  try:
    # Query posts collection filtered by petId
    posts_query = db.collection("posts").where("petId", "==", pet_id)
    docs = list(posts_query.stream())
    # If no posts found, return empty list
    if not docs:
      return {"images": []}

    await require_owner_or_admin(
        owner_id=docs["userId"],
        user=user
    )

    # Sort posts by createdAt (most recent first)
    sorted_posts = sorted(
        docs, key=lambda doc: doc.to_dict().get("createdAt", ""), reverse=True
    )

    # Return list of image URLs with comments
    images = []
    for doc in sorted_posts:
      post_data = doc.to_dict()
      if post_data.get("imageUrl"):
        images.append(
            {
                "id": doc.id,
                "imageUrl": post_data.get("imageUrl", ""),
                "caption": post_data.get("caption", ""),
                "createdAt": post_data.get("createdAt", ""),
                "comments": post_data.get("comments", []),
            }
        )

    return {"images": images}

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error fetching pet images: {str(e)}"
    )


@router.patch("/update/{pet_id}")
@limiter.limit("5/minute")
async def update_pet(request: Request, response: Response, pet_id: str, updated_fields: UpdatePet, user=Depends(auth_check)):

  try:
    doc_collection = db.collection("pets").document(pet_id)
    pet = doc_collection.get().to_dict()
    if pet["deletedAt"]:
      raise HTTPException(status_code=404, detail="Pet not found")

    await require_owner_or_admin(
        owner_id=pet["userId"],
        user=user
    )

    update_data = updated_fields.model_dump(exclude_none=True)
    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
    if not update_data:
      raise HTTPException(
          status_code=400,
          detail="No fields provided for update"
      )

    doc_collection.update(update_data)

    return {"message": "Pet updated successfully"}

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error updating pet: {str(e)}")


@router.delete("/delete/{pet_id}", status_code=204)
@limiter.limit("5/minute")
async def delete_pet(request: Request, response: Response, pet_id: str, user=Depends(auth_check)):

  try:
    doc_collection = db.collection("pets").document(pet_id)
    pet = doc_collection.get().to_dict()
    if pet["deletedAt"]:
      raise HTTPException(status_code=404, detail="Pet not found")

    await require_owner_or_admin(
        owner_id=pet["userId"],
        user=user
    )

    pet["deletedAt"] = datetime.now(timezone.utc).isoformat()

    doc_collection.update(pet)

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error deleting pet: {str(e)}")
