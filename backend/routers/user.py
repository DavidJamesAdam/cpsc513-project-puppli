from firebase_service import db
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.concurrency import run_in_threadpool
from firebase_admin import auth
from google.cloud import firestore as gcfirestore
from utils.authCheck import auth_check, require_admin, require_owner_or_admin
from models import User, UpdateUser

router = APIRouter()


@router.post("/")
async def create_user(user: User):
  """
  Creates user in Firebase database.
  """
  user_dict = user.model_dump()
  email = user_dict["email"].strip().lower()
  password = user_dict["password"]
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
  def _finalize_txn(transaction, user_ref, uid, user_dict, email, city, province):
    transaction.set(
        user_ref,
        {
            "uid": uid,
            "avatarUrl": "",
            "bio": "",
            "email": email,
            "displayName": user_dict.get("displayName") or "",
            "createdAt": gcfirestore.SERVER_TIMESTAMP,
            "cityName": city,
            "provinceName": province,
            "role": "user",
            "totalBronze": 0,
            "totalSilver": 0,
            "totalGold": 0
        },
    )

  try:
    txn2 = db.transaction()
    await run_in_threadpool(_finalize_txn, txn2, user_ref, uid, user_dict, email, city, province)
  except ValueError as ve:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT, detail=str(ve))
  except Exception as e:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error writing profile: {e}")

  # Success — do not return password or any sensitive info
  return {"id": uid, "email": email, "displayName": user_dict.get("displayName", "")}


@router.get("/", dependencies=[Depends(require_admin)])
def read_users():
  """
  Gets all users. Admin only function.
  """
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
  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error fetching data: {str(e)}")

# Get current user


@router.get("/me")
async def get_current_user(user=Depends(auth_check)):
  """
  Retrieve the current authenticated user's profile data
  """
  try:
    user_id = user["uid"]

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


@router.get("/{user_id}")
async def get_user(user_id: str, user=Depends(auth_check)):
  """
  Get specific user using Firebase UID. Only Admin can get any user.
  """
  current_user_id = user["uid"]

  try:
    auth_doc = db.collection('users').document(current_user_id).get()
    if not auth_doc.exists:
      raise HTTPException(
          status_code=401, detail="Authenticated user profile not found")

    role = auth_doc.to_dict().get("role")
    target_user_id = user_id if role == "admin" else current_user_id

    doc = db.collection('users').document(target_user_id).get()
    if not doc.exists:
      raise HTTPException(status_code=404, detail="User not found")

    return doc.to_dict()
  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error fetching user: {str(e)}")


@router.patch("/update/{user_id}")
async def update_user(user_id: str, updated_fields: UpdateUser, user=Depends(auth_check)):
  """
  Update user info.
  Accepts a dict of fields with new values, not all fields need to be provided, just the ones that are changing.
  """
  try:
    # reference to user in db
    doc_ref = db.collection('users').document(user_id)
    # the actual user document object
    doc = doc_ref.get()

    if not doc.exists:
      raise HTTPException(status_code=404, detail="User not found")

    user_data = doc.to_dict()

    await require_owner_or_admin(
        owner_id=user_data["uid"],
        user=user
    )

    # Convert Pydantic model to a plain dict before updating Firestore
    update_data = updated_fields.model_dump(exclude_none=True)
    if not update_data:
      raise HTTPException(
          status_code=status.HTTP_400_BAD_REQUEST,
          detail="No fields provided for update"
      )

    doc_ref.update(update_data)

    return {"message": "User updated successfully"}

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error updating user: {str(e)}")


# Deletes a user and all of their associated data (posts, profile, subprofile, Firestore document, Firesbase Auth record)
@router.delete("/{user_id}", dependencies=[Depends(require_admin)], status_code=204)
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

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Error deleting user: {str(e)}"
    )
