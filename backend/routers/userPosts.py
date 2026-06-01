from firebase_service import db
from fastapi import APIRouter, Request, HTTPException, Depends, status, Query
from firebase_admin import auth
import firebase_admin.firestore as firestore
from fastapi.concurrency import run_in_threadpool
from datetime import datetime, timezone
import random
from typing import Optional, Literal
from classes.location import Location
from utils.authCheck import auth_check, require_owner_or_admin
from models import PostCreate, CommentCreate

router = APIRouter()


@router.post("/")
async def create_post(post: PostCreate, user=Depends(auth_check)):
  """
  Create a new post with an image URL, caption, and pet ID
  Requires authentication
  """
# TODO: Implement file verification (is the post actually a photo or a zip bomb, malware, etc)
# TODO: Separate photo upload logic and actual post/text field logic
  try:
    user_id = user["user_id"]
    user_ref = db.collection("users").document(user_id).get().to_dict()

    # Create post document
    post_data = {
        "userId": user_id,
        "petId": post.petId,
        "imageUrl": post.imageUrl,
        "caption": post.caption,
        "cityName": user_ref["cityName"],
        "provinceName": user_ref["provinceName"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "voteCount": 0,
        "favouriteCount": 0,
    }

    # Add document to posts collection
    doc_ref = db.collection("posts").document()
    doc_ref.set(post_data)

    return {
        "id": doc_ref.id,
        "message": "Post created successfully",
        "post": post_data,
    }

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@router.get("/user")
async def get_posts(user=Depends(auth_check)):
  """
  Retrieve all posts for the authenticated user
  """
  try:
    user_id = user["user_id"]

    # Query posts collection filtered by userId
    docs = db.collection("posts").where("userId", "==", user_id).stream()

    results = []
    for doc in docs:
      post_data = doc.to_dict()
      post_data["id"] = doc.id
      results.append(post_data)

    return results
  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@router.get("/{post_id}", dependencies=[Depends(auth_check)])
async def get_post_by_id(post_id: str):
  """
  Retrieve a single post by its ID
  Returns the post with its ID and comments
  """
  try:
    # Get the specific document from 'posts' collection
    doc_ref = db.collection("posts").document(post_id)
    doc = doc_ref.get()

    if not doc.exists:
      raise HTTPException(status_code=404, detail="Post not found")

    # Convert document to dictionary format
    doc_data = doc.to_dict()
    doc_data["id"] = doc.id  # Include document ID

    # Ensure comments field exists (initialize as empty array if missing)
    if "comments" not in doc_data:
      doc_data["comments"] = []

    return doc_data

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error fetching post: {str(e)}")


# TODO: Update and clarify this endpoint. Get all posts instead of "posts user voted".
# This endpoint retrieves two posts at random to be diplayed on voting page
@router.get("")
async def read_posts(user=Depends(auth_check)):
  """
  Retrieve all documents from the 'posts' collection
  Returns a list of all posts with their IDs and comments
  If user is authenticated, filters out posts the user voted on today
  """
  try:
    user_id = user["user_id"]
    # Get all documents from 'posts' collection
    docs = db.collection("posts").stream()

    # Convert documents to dictionary format
    results = []
    for doc in docs:
      doc_data = doc.to_dict()
      doc_data["id"] = doc.id  # Include document ID
      # Ensure comments field exists (initialize as empty array if missing)
      if "comments" not in doc_data:
        doc_data["comments"] = []
      results.append(doc_data)

    # If user authenticated, filter out posts voted on today
    if user_id:
      voted_posts_ref = (
          db.collection("users").document(user_id).collection("votedPosts")
      )
      voted_docs = await run_in_threadpool(voted_posts_ref.stream)

      voted_today = set()
      now = datetime.now(timezone.utc)
      today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

      for voted_doc in voted_docs:
        voted_data = voted_doc.to_dict()
        voted_at = voted_data.get("votedAt")

        if voted_at and voted_at >= today_start:
          voted_today.add(voted_doc.id)

      # Filter out posts voted on today
      results = [post for post in results if post["id"] not in voted_today]

    # Return 2 random posts from the filtered results
    if len(results) >= 2:
      return random.sample(results, 2)
    else:
      return results
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error fetching posts: {str(e)}")


@router.delete("/{post_id}", status_code=204)
async def delete_post(post_id: str, user=Depends(auth_check)):
  """Delete a post if the requester is the post owner or an admin.

  Verifies the post exists then checks
  the requesting user's role/ownership before deleting.
  """
  try:
    post_ref = db.collection("posts").document(post_id)
    post_doc = post_ref.get()
    if not post_doc.exists:
      raise HTTPException(
          status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    post = post_doc.to_dict() or {}

    await require_owner_or_admin(
        owner_id=post["userId"],
        user=user
    )

    post_ref.delete()

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error deleting post: {str(e)}")


@router.post("/{post_id}/comment/")
async def add_comment(post_id: str, comment: CommentCreate, user=Depends(auth_check)):
  """Add a comment to a post"""
  try:
    post_ref = db.collection("posts").document(post_id)
    post = post_ref.get()
    if not post.exists:
      raise HTTPException(
          status_code=status.HTTP_404_NOT_FOUND, detail=f"Post not found"
      )

    # Validate comment text length
    if len(comment.text) > 56:
      raise HTTPException(
          status_code=400, detail="Comment exceeds 56 characters")

    if not comment.text.strip():
      raise HTTPException(status_code=400, detail="Comment cannot be empty")

    # Create comment object
    new_comment = {
        "user": user["user_id"],
        "post_id": post_id,
        "text": comment.text,
        "createdAt": datetime.utcnow().isoformat() + "Z",
    }

    comment_collection = db.collection("comments")
    comment_ref = comment_collection.document()
    comment_ref.set(new_comment)

    return {"message": "Comment added successfully", "comment": new_comment}

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error adding comment: {str(e)}")


@router.delete("/{post_id}/comment/{comment_uid}", status_code=204)
async def delete_comment(post_id: str, comment_uid: str, user=Depends(auth_check)):
  """Delete a comment if the requester is the comment owner or an admin.

  Verifies the comment exists and belongs to the given post, then checks
  the requesting user's role/ownership before deleting.
  """
  try:
    comment_ref = db.collection("comments").document(comment_uid)
    comment_doc = comment_ref.get()
    if not comment_doc.exists:
      raise HTTPException(
          status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    comment = comment_doc.to_dict() or {}

    if comment.get("post_id") != post_id:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                          detail="Comment not found for this post")

    await require_owner_or_admin(
        owner_id=comment["userId"],
        user=user
    )

    # Delete the comment
    comment_ref.delete()

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error deleting comment: {str(e)}")


@router.get("/rank/")
async def rank_posts_by_location(
    scope: Literal["global", "province", "city"] = "global",
    province: Optional[str] = None,
    city: Optional[str] = None,
    user=Depends(auth_check)
):
  user_id = user["uid"]
  user_doc = db.collection("users").document(user_id).get()
  if not user_doc.exists:
    raise HTTPException(404, "User not found")

  profile = user_doc.to_dict()

  if province is None:
    province = profile.get("provinceName")
  if city is None:
    city = profile.get("cityName")

  try:
    if scope == "global":
      query = db.collection("posts").order_by(
          "voteCount",
          direction=firestore.Query.DESCENDING
      )

    elif scope == "province":
      if not province:
        raise HTTPException(400, "province is required")

      query = (
          db.collection("posts")
          .where("provinceName", "==", province)
          .order_by("voteCount", direction=firestore.Query.DESCENDING)
      )

    elif scope == "city":
      if not city or not province:
        raise HTTPException(400, "city and province required")

      query = (
          db.collection("posts")
          .where("provinceName", "==", province)
          .where("cityName", "==", city)
          .order_by("voteCount", direction=firestore.Query.DESCENDING)
      )

    docs = query.stream()

    return [
        {"id": doc.id, **doc.to_dict()}
        for doc in docs
    ]
  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


# TODO: This should be some sort of lambda function that runs at the end of each week... do we need an endpoint for that?
@router.post("/admin/award-medals")
async def award_medals():
  """
  Award gold, silver, and bronze medals to top posts based on voteCount.
  Clears all users' votedPosts subcollections for the new day.
  """
  try:
    # Get all posts
    posts_ref = db.collection("posts")
    posts = await run_in_threadpool(posts_ref.stream)

    posts_list = []
    for post in posts:
      post_data = post.to_dict()
      post_data["id"] = post.id
      posts_list.append(post_data)

    if len(posts_list) == 0:
      return {"message": "No posts to award medals"}

    # Sort by voteCount
    posts_list.sort(key=lambda x: x.get("voteCount", 0), reverse=True)

    # Group posts by vote count
    vote_groups = []
    i = 0
    while i < len(posts_list):
      current_votes = posts_list[i].get("voteCount", 0)
      group = []

      while (
          i < len(posts_list)
          and posts_list[i].get("voteCount", 0) == current_votes
      ):
        group.append(posts_list[i].get("userId"))
        i += 1

      vote_groups.append(group)

    # Award medals with Olympic tie rules
    gold_users = []
    silver_users = []
    bronze_users = []

    # First place gets gold
    if len(vote_groups) > 0:
      gold_users = vote_groups[0]

    # Second place gets silver or bronze depending on first place ties
    if len(vote_groups) > 1:
      # If only 1 gold, second place gets silver
      if len(gold_users) == 1:
        silver_users = vote_groups[1]
      # If multiple golds, second place gets bronze
      else:
        bronze_users = vote_groups[1]

    # Third place gets bronze if not already awarded
    if len(vote_groups) > 2:
      # 1 gold, 1 silver: third place gets bronze
      if len(gold_users) == 1 and len(silver_users) == 1:
        bronze_users = vote_groups[2]
      # 1 gold, multiple silvers: skip bronze
      elif len(gold_users) == 1 and len(silver_users) > 1:
        pass
      # Multiple golds, no bronze yet: third place gets bronze
      elif len(gold_users) > 1 and len(bronze_users) == 0:
        bronze_users = vote_groups[2]

    # Update user totals
    for user_id in gold_users:
      user_ref = db.collection("users").document(user_id)
      await run_in_threadpool(
          user_ref.update, {"totalGold": firestore.Increment(1)}
      )

    for user_id in silver_users:
      user_ref = db.collection("users").document(user_id)
      await run_in_threadpool(
          user_ref.update, {"totalSilver": firestore.Increment(1)}
      )

    for user_id in bronze_users:
      user_ref = db.collection("users").document(user_id)
      await run_in_threadpool(
          user_ref.update, {"totalBronze": firestore.Increment(1)}
      )

    # Clear votedPosts
    users_ref = db.collection("users")
    users = await run_in_threadpool(users_ref.stream)

    cleared_count = 0
    for user in users:
      voted_posts_ref = user.reference.collection("votedPosts")
      voted_docs = await run_in_threadpool(voted_posts_ref.stream)

      for voted_doc in voted_docs:
        await run_in_threadpool(voted_doc.reference.delete)
        cleared_count += 1

    # TODO: Reset voteCount for all posts to 0 for new day
    # Discuss with team before implementing
    # for post in posts_list:
    #     post_ref = db.collection('posts').document(post['id'])
    #     await run_in_threadpool(post_ref.update, {'voteCount': 0})

    return {
        "message": "Medals awarded successfully",
        "gold": len(gold_users),
        "silver": len(silver_users),
        "bronze": len(bronze_users),
        "voted_posts_cleared": cleared_count,
    }

  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error awarding medals: {str(e)}")


# TODO: Need to figure out what to do with this endpoint. IE have a gallery for user to view favs? Is there an easier way to increase/decrease fav count?
@router.post("/favourite/{postId}")
# favourite toggle (add or remove)
async def post_favourite(postId: str, request: Request):
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

    doc_ref = db.collection("posts").document(postId)
    doc = doc_ref.get()

    if not doc.exists:
      raise HTTPException(status_code=404, detail="Post not found")

    data = doc.to_dict()
    favourited_by = data.get("favouritedBy", [])

    # Toggle: if user already favorited, remove; otherwise add
    if user_id in favourited_by:
      # Remove favorite
      doc_ref.update(
          {
              "favouriteCount": firestore.Increment(-1),
              "favouritedBy": firestore.ArrayRemove([user_id]),
          }
      )
      return {"message": "Favourite removed", "favourited": False}
    else:
      # Add favorite
      doc_ref.update(
          {
              "favouriteCount": firestore.Increment(1),
              "favouritedBy": firestore.ArrayUnion([user_id]),
          }
      )
      return {"message": "Favourite added", "favourited": True}

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error toggling favourite: {str(e)}"
    )


# TODO: Similar to adding favourites, is there an easier way? Can we just use this as a "favourite gallery"? Do we even need a favourite function in that case?
@router.post("/vote/{postId}")
# vote count increase
async def post_vote(postId: str, request: Request):
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

    doc_ref = db.collection("posts").document(postId)
    doc = doc_ref.get()

    if not doc.exists:
      raise HTTPException(status_code=404, detail="Post not found")

    data = doc.to_dict()
    current_votes = data.get("votes", 0)

    # increment vote count
    doc_ref.update({"voteCount": firestore.Increment(1)})

    # Record that user voted on this post with timestamp
    user_voted_ref = (
        db.collection("users")
        .document(user_id)
        .collection("votedPosts")
        .document(postId)
    )
    user_voted_ref.set({"votedAt": datetime.now(timezone.utc)})

    return {"message": "Vote recorded successfully"}

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error recording vote: {str(e)}")
