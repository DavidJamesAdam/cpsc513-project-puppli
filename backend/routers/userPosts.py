from firebase_service import db
from fastapi import APIRouter, Request, HTTPException
from firebase_admin import auth
from pydantic import BaseModel
from fastapi.concurrency import run_in_threadpool
from datetime import datetime, timezone
import random

router = APIRouter(tags=["User Posts"])

class PostCreate(BaseModel):
    caption: str
    petId: str
    imageUrl: str

# Tested
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

@router.get("/posts/{post_id}")
async def get_post_by_id(post_id: str):
    """
    Retrieve a single post by its ID
    Returns the post with its ID and comments
    """
    try:
        # Get the specific document from 'posts' collection
        doc_ref = db.collection('posts').document(post_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Post not found")

        # Convert document to dictionary format
        doc_data = doc.to_dict()
        doc_data['id'] = doc.id  # Include document ID

        # Ensure comments field exists (initialize as empty array if missing)
        if 'comments' not in doc_data:
            doc_data['comments'] = []

        return doc_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching post: {str(e)}")

@router.get("/posts")
async def read_posts(request: Request):
    """
    Retrieve all documents from the 'posts' collection
    Returns a list of all posts with their IDs and comments
    If user is authenticated, filters out posts the user voted on today
    """
    try:
        # Get all documents from 'posts' collection
        docs = db.collection('posts').stream()

        # Convert documents to dictionary format
        results = []
        for doc in docs:
            doc_data = doc.to_dict()
            doc_data['id'] = doc.id  # Include document ID
            # Ensure comments field exists (initialize as empty array if missing)
            if 'comments' not in doc_data:
                doc_data['comments'] = []
            results.append(doc_data)

        # Try to get user_id from session cookie
        session_cookie = request.cookies.get("session")
        user_id = None

        if session_cookie:
            try:
                decoded = auth.verify_session_cookie(session_cookie, check_revoked=True)
                user_id = decoded.get("uid")
            except Exception:
                # If session invalid, just return all posts without filtering
                pass

        # If user authenticated, filter out posts voted on today
        if user_id:
            voted_posts_ref = db.collection('users').document(user_id).collection('votedPosts')
            voted_docs = await run_in_threadpool(voted_posts_ref.stream)

            voted_today = set()
            now = datetime.now(timezone.utc)
            today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

            for voted_doc in voted_docs:
                voted_data = voted_doc.to_dict()
                voted_at = voted_data.get('votedAt')

                if voted_at and voted_at >= today_start:
                    voted_today.add(voted_doc.id)

            # Filter out posts voted on today
            results = [post for post in results if post['id'] not in voted_today]

        # Return 2 random posts from the filtered results
        if len(results) >= 2:
            return random.sample(results, 2)
        else:
            return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching posts: {str(e)}")