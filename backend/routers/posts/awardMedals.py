from firebase_service import db
from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from google.cloud import firestore

router = APIRouter()

@router.post("/admin/award-medals")
async def award_medals():
    """
    Award gold, silver, and bronze medals to top posts based on voteCount.
    Clears all users' votedPosts subcollections for the new day.
    """
    try:
        # Get all posts
        posts_ref = db.collection('posts')
        posts = await run_in_threadpool(posts_ref.stream)

        posts_list = []
        for post in posts:
            post_data = post.to_dict()
            post_data['id'] = post.id
            posts_list.append(post_data)

        if len(posts_list) == 0:
            return {"message": "No posts to award medals"}

        # Sort by voteCount
        posts_list.sort(key=lambda x: x.get('voteCount', 0), reverse=True)

        # Group posts by vote count
        vote_groups = []
        i = 0
        while i < len(posts_list):
            current_votes = posts_list[i].get('voteCount', 0)
            group = []

            while i < len(posts_list) and posts_list[i].get('voteCount', 0) == current_votes:
                group.append(posts_list[i].get('userId'))
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
            user_ref = db.collection('users').document(user_id)
            await run_in_threadpool(user_ref.update, {"totalGold": firestore.Increment(1)})

        for user_id in silver_users:
            user_ref = db.collection('users').document(user_id)
            await run_in_threadpool(user_ref.update, {"totalSilver": firestore.Increment(1)})

        for user_id in bronze_users:
            user_ref = db.collection('users').document(user_id)
            await run_in_threadpool(user_ref.update, {"totalBronze": firestore.Increment(1)})

        # Clear votedPosts
        users_ref = db.collection('users')
        users = await run_in_threadpool(users_ref.stream)

        cleared_count = 0
        for user in users:
            voted_posts_ref = user.reference.collection('votedPosts')
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
            "voted_posts_cleared": cleared_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error awarding medals: {str(e)}")
