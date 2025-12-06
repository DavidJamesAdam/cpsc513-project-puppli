from firebase_service import db
from fastapi import APIRouter, HTTPException, Request
from google.cloud import firestore
from firebase_admin import auth
from datetime import datetime, timezone

router = APIRouter()

@router.post("/posts/vote/{postId}")
# vote count increase
async def post_vote(post_id: str, request: Request):
    try:
        # Get user ID from session cookie
        session_cookie = request.cookies.get("session")
        if not session_cookie:
            raise HTTPException(status_code=401, detail="Not authenticated")

        try:
            decoded = auth.verify_session_cookie(session_cookie, check_revoked=True)
            user_id = decoded.get("uid")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid session")

        doc_ref = db.collection("posts").document(post_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Post not found")

        data = doc.to_dict()
        current_votes = data.get("votes", 0)

        # increment vote count
        doc_ref.update({"voteCount": firestore.Increment(1)})

        # Record that user voted on this post with timestamp
        user_voted_ref = db.collection('users').document(user_id).collection('votedPosts').document(post_id)
        user_voted_ref.set({
            "votedAt": datetime.now(timezone.utc)
        })

        return {"message": "Vote recorded successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recording vote: {str(e)}")