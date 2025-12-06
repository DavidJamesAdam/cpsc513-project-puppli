from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from firebase_admin import auth
from firebase_service import db
from datetime import datetime
import firebase_admin.firestore as firestore

router = APIRouter()


class CommentCreate(BaseModel):
    text: str = Field(..., max_length=56)


@router.post("/posts/{post_id}/comment")
async def add_comment(post_id: str, comment: CommentCreate, request: Request):
    """Add a comment to a post"""
    # Authenticate user
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Verify session
        auth.verify_session_cookie(session_cookie, check_revoked=True)

        # Validate comment text length
        if len(comment.text) > 56:
            raise HTTPException(
                status_code=400, detail="Comment exceeds 56 characters")

        if not comment.text.strip():
            raise HTTPException(
                status_code=400, detail="Comment cannot be empty")

        # Create comment object
        new_comment = {
            "text": comment.text,
            "createdAt": datetime.utcnow().isoformat() + "Z"
        }

        # Update post document using arrayUnion for atomic operation
        post_ref = db.collection('posts').document(post_id)

        # Check if post exists
        post = post_ref.get()
        if not post.exists:
            raise HTTPException(status_code=404, detail="Post not found")

        # Append comment to array using Firestore arrayUnion
        post_ref.update({
            "comments": firestore.ArrayUnion([new_comment])
        })

        return {"message": "Comment added successfully", "comment": new_comment}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error adding comment: {str(e)}")
