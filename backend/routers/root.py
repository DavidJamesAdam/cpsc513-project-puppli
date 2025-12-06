from fastapi import APIRouter
from handlers.posts.postVote import post_vote as p_vote
from handlers.posts.postFavourite import post_favourite
from handlers.posts.rankProvince import rank_province as rank_p

from fastapi import APIRouter, Request

router = APIRouter()

# Need to figure out why this one isn't working
@router.post("/posts/favourite/{postId}")
async def posts_favourite(postId: str, request: Request):
    return await post_favourite(postId, request)

# Need to figure out why this one isn't working
@router.post("/posts/vote/{postId}")
async def post_vote(postId: str, request: Request):
    return await p_vote(postId, request)

# Need to figure out why this one isn't working
@router.get("/posts/rank/province/{location}")
async def rank_prov(location: str):
    return await rank_p(location)