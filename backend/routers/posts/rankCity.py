from firebase_service import db
from fastapi import FastAPI, HTTPException, APIRouter
from classes.location import Location

router = APIRouter()

@router.get("/posts/rank/city/{location}")
#fix class use if location stored as JSON instead of string
async def rank_city(location: str):
        
    try:
        #convert user's location to Location object
        user_location = Location.from_string(location)

        # Get all documents from 'posts' collection
        docs = db.collection('posts').stream()

        # Convert documents to dictionary format
        results = []
        for doc in docs:
           
            #get post's (other user's) location and convert to Location object
            doc_data = doc.to_dict()
            post_user_id = doc_data.get('userId')
            user_doc = db.collection('users').document(post_user_id).get()
            post_user = user_doc.to_dict()

            #skip missing/empty user docs
            if not post_user:
                continue

            #skip if user has not entered a location
            post_loc_str = post_user.get('location')
            if not post_loc_str:
                continue

            #get the location as object
            post_location = post_user['location']
            post_location = Location.from_string(post_location)
        
            #match 'location' to user's 'location' 
            if post_location.city == user_location.city:
                doc_data['id'] = doc.id  # Include document ID
                results.append(doc_data)
            
        #sort from highest to lowest number of votes
        results.sort(key=lambda x: x.get('voteCount', 0), reverse=True)

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching posts: {str(e)}")
    




