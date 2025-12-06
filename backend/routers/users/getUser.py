from firebase_service import db
from fastapi import APIRouter, HTTPException, Depends, Request
from utils.authCheck import check_auth
from firebase_admin import auth

router = APIRouter()

@router.get("/users")
# def read_users(user=Depends(check_auth)): Use this to protect route
def read_users():
    try:
        # Get all documents from 'users' collection
        docs = db.collection('users').stream()

        # Convert documents to dictionary format
        results = []
        for doc in docs:
            doc_data = doc.to_dict()
            doc_data['id'] = doc.id  # Include document ID
            results.append(doc_data)

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

@router.get("/user/me")
async def get_current_user(request: Request):
    """
    Retrieve the current authenticated user's profile data
    """
    # Get session cookie and verify authentication
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Verify session and get user ID
        decoded = auth.verify_session_cookie(session_cookie, check_revoked=True)
        user_id = decoded.get("uid")

        # Get user document by ID
        doc = db.collection('users').document(user_id).get()

        if doc.exists:
            user_data = doc.to_dict()
            user_data['id'] = doc.id
            return user_data
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
