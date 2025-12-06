from firebase_service import db
from fastapi import APIRouter, HTTPException, Request
from google.cloud import firestore
from firebase_admin import auth

router = APIRouter()

@router.post("/posts/favourite/{postId}")
# favourite toggle (add or remove)
async def post_favourite(post_id: str, request: Request):
    try:
        # Get user ID from session cookie for authentication
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
        favourited_by = data.get("favouritedBy", [])

        # Toggle: if user already favorited, remove; otherwise add
        if user_id in favourited_by:
            # Remove favorite
            doc_ref.update({
                "favouriteCount": firestore.Increment(-1),
                "favouritedBy": firestore.ArrayRemove([user_id])
            })
            return {"message": "Favourite removed", "favourited": False}
        else:
            # Add favorite
            doc_ref.update({
                "favouriteCount": firestore.Increment(1),
                "favouritedBy": firestore.ArrayUnion([user_id])
            })
            return {"message": "Favourite added", "favourited": True}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error toggling favourite: {str(e)}")
