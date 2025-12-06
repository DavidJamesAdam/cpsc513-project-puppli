from firebase_service import db
from fastapi import APIRouter, Request, HTTPException
from firebase_admin import auth
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class PostCreate(BaseModel):
    caption: str
    petId: str
    imageUrl: str

@router.post("/posts")
async def create_post(post: PostCreate, request: Request):
    """
    Create a new post with an image URL, caption, and pet ID
    Requires authentication
    """
    # Get session cookie and verify authentication
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Verify session and get user ID
        decoded = auth.verify_session_cookie(session_cookie, check_revoked=True)
        user_id = decoded.get("uid")

        # Create post document
        post_data = {
            "userId": user_id,
            "petId": post.petId,
            "imageUrl": post.imageUrl,
            "caption": post.caption,
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "voteCount": 0,
            "favouriteCount": 0
        }

        # Add document to posts collection
        doc_ref = db.collection("posts").document()
        doc_ref.set(post_data)

        return {
            "id": doc_ref.id,
            "message": "Post created successfully",
            "post": post_data
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
