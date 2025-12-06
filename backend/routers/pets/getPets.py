from firebase_service import db
from fastapi import APIRouter, Request, HTTPException
from firebase_admin import auth

router = APIRouter()

@router.get("/pets")
async def get_pets(request: Request):
    """
    Retrieve all pets for the authenticated user
    """
    # Get session cookie and verify authentication
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Verify session and get user ID
        decoded = auth.verify_session_cookie(session_cookie, check_revoked=True)
        user_id = decoded.get("uid")

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

@router.get("/pet/{pet_id}/last-image")
async def get_last_pet_image(pet_id: str):
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
async def get_pet_images(pet_id: str):
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