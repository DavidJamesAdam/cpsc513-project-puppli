from firebase_service import db
from fastapi import APIRouter, HTTPException, Request, status, Depends
from fastapi.concurrency import run_in_threadpool
from firebase_admin import auth
import re
from pydantic import BaseModel, field_validator
from google.cloud import firestore as gcfirestore

router = APIRouter(tags=["User"])

COMMON_PASSWORDS = {"password", "12345678", "qwerty", "letmein"}

router = APIRouter()

class User(BaseModel):
    userName: str
    email: str
    password: str
    displayName: str | None = None
    provinceName: str
    cityName: str

    # Password Validation
    @field_validator("password")
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain a lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain a digit")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain a symbol")
        if v.lower() in COMMON_PASSWORDS:
            raise ValueError("Password is too common")
        return v

# tested
@router.post("/user")
async def create_user(user: User):
    user_dict = user.model_dump()
    email = user_dict["email"].strip().lower()
    password = user_dict["password"]
    username = user_dict["userName"].strip()
    province = user_dict["provinceName"]
    city = user_dict["cityName"]

    # 1) Create the Firebase Auth user (password stored/managed by Auth)
    try:
        # run blocking Admin SDK call off the event loop
        user_record = await run_in_threadpool(auth.create_user, email=email, password=password)
        uid = user_record.uid
    except Exception as e:
        # Map certain error messages to appropriate statuses if you want
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Error creating auth user: {e}")

    user_ref = db.collection("users").document(uid)

    # 2) Finalize: within a transaction confirm reservation matches and write profile + attach uid to username doc
    @gcfirestore.transactional
    def _finalize_txn(transaction, user_ref, uid, user_dict, email, username, city, province):
        transaction.set(
            user_ref,
            {
                "uid": uid,
                "avatarUrl": "",
                "bio": "",
                "email": email,
                "userName": username,
                "displayName": user_dict.get("displayName") or "",
                "createdAt": gcfirestore.SERVER_TIMESTAMP,
                "location": f"{city}, {province}",
                "role": "user",
                "totalBronze": 0,
                "totalSilver": 0,
                "totalGold": 0
            },
        )

    try:
        txn2 = db.transaction()
        await run_in_threadpool(_finalize_txn, txn2, user_ref, uid, user_dict, email, username, city, province)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error writing profile: {e}")

    # Success — do not return password or any sensitive info
    return {"id": uid, "userName": username, "email": email, "displayName": user_dict.get("displayName", "")}

# tested
# Gets all users
# TODO: Not sure if I want this accessible to average user
@router.get("/user")
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

# Tested
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

# tested
# TODO: Not sure if I want this avaialble to all users
#temp get user (move or remove later)
@router.get("/user/{user_id}")
async def get_user(user_id: str):

    try:
        #get user from db
        doc = db.collection('users').document(user_id).get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        print(doc.to_dict())
        return doc.to_dict()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")

# Tested
# TODO: Add authentication so that currently logged in user can only update their own bio
#update user info
#accepts a dict of fields with new values, not all fields need to be provided, just the ones that are changing
@router.patch("/user/update/{user_id}")
async def update_user(user_id: str, updated_fields: dict):
    try:
        #reference to user in db
        doc_ref = db.collection('users').document(user_id)
        #the actual user document object
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        #update user with provided fields
        doc_ref.update(updated_fields)

        return {"message": "User updated successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")

# tested
# TODO: Need to protect this route for admin only
# Deletes a user and all of their associated data (posts, profile, subprofile, Firestore document, Firesbase Auth record)
@router.delete("/user/{user_id}")
async def delete_user(user_id: str):

    try:
        # Make sure user exists
        user_ref = db.collection('users').document(user_id)
        user_doc = await run_in_threadpool(user_ref.get)

        print(user_ref)

        if not user_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"User with ID {user_id} not found"
            )

        user_data = user_doc.to_dict()
        user_name = user_data.get("displayName", "Unknown")

        deletion_summary = {
            "user_id": user_id,
            "user_name": user_name,
            "posts_deleted": 0,
            "pets_deleted": 0
        }

        # Delete posts
        posts_query = db.collection('posts').where('userId', '==', user_id)
        posts = await run_in_threadpool(posts_query.stream)

        for post in posts:
            await run_in_threadpool(post.reference.delete)
            deletion_summary["posts_deleted"] += 1

        # Delete pets
        pets_query = db.collection('pets').where('userId', '==', user_id)
        pets = await run_in_threadpool(pets_query.stream)

        for pet in pets:
            await run_in_threadpool(pet.reference.delete)
            deletion_summary["pets_deleted"] += 1

        # Firestore doesn't delete subcollections inside documents, so first
        # we must delete all documents in votedPosts subcollection first
        voted_posts_ref = user_ref.collection('votedPosts')
        voted_posts_docs = await run_in_threadpool(voted_posts_ref.stream)

        voted_posts_list = [doc for doc in voted_posts_docs]
        for voted_post_doc in voted_posts_list:
            await run_in_threadpool(voted_post_doc.reference.delete)

        # Delete user document
        await run_in_threadpool(user_ref.delete)

        # Delete from Firebase Auth
        try:
            await run_in_threadpool(auth.delete_user, user_id)
        except auth.UserNotFoundError:
            pass

        return {
            "message": f"User {user_id} and all associated data deleted successfully",
            "summary": deletion_summary
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}"
        )