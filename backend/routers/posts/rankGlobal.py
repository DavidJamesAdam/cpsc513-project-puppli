from firebase_service import db
from fastapi import FastAPI, HTTPException, APIRouter

router = APIRouter()

@router.get("/posts/rank/global")
async def rank_global():
    
    try:
        # Get all documents from 'posts' collection
        docs = db.collection('posts').stream()

        # Convert documents to dictionary format
        results = []
        for doc in docs:
            doc_data = doc.to_dict()
            doc_data['id'] = doc.id  # Include document ID
            results.append(doc_data)
        
        #sort from highest to lowest number of votes
        results.sort(key=lambda x: x.get('voteCount', 0), reverse=True)

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching posts: {str(e)}")