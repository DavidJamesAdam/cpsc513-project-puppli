from firebase_service import db
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from firebase_admin import auth

router = APIRouter()

# Deletes a user and all of their associated data (posts, profile, subprofile, Firestore document, Firesbase Auth record)
@router.delete("/users/{user_id}")
async def delete_user(user_id: str):

    try:
        # Make sure user exists
        user_ref = db.collection('users').document(user_id)
        user_doc = await run_in_threadpool(user_ref.get)

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