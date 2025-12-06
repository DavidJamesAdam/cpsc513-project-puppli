from firebase_service import db
from fastapi import APIRouter, Request, HTTPException
from firebase_admin import auth

router = APIRouter()

@router.get("/user/posts")
async def get_posts(request: Request):
    """
    Retrieve all posts for the authenticated user
    """
    # Get session cookie and verify authentication
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Verify session and get user ID
        decoded = auth.verify_session_cookie(session_cookie, check_revoked=True)
        user_id = decoded.get("uid")

        # Query posts collection filtered by userId
        docs = db.collection('posts').where('userId', '==', user_id).stream()

        results = []
        for doc in docs:
            post_data = doc.to_dict()
            post_data['id'] = doc.id
            results.append(post_data)

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))