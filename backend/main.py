from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from firebase_service import db

from routers.auth import router as auth_router
from routers.petSubProfile import router as pet_profile_router
from routers.user import router as user_router
from routers.userPosts import router as user_posts_router

from routers.posts.getPosts import router as get_posts_router
from routers.posts.getUserPosts import router as get_user_posts_router
from routers.posts.addComment import router as add_comment_router
from routers.posts.awardMedals import router as award_medals_router
from routers.posts.postVote import router as post_vote_router
from routers.posts.postFavourite import router as post_favourite_router
from routers.posts.rankGlobal import router as rank_global_router
from routers.posts.rankProvince import router as rank_province_router
from routers.posts.rankCity import router as rank_city_router

from utils.authCheck import router as auth_check_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    print("FastAPI application started")
    print("Firebase connection ready")
    yield
    # Shutdown (if needed in the future)
    print("Application shutting down")


app = FastAPI(lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "http://localhost:3000"],  # React dev server ports
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(auth_router)
app.include_router(pet_profile_router)
app.include_router(user_router)
app.include_router(user_posts_router)

app.include_router(get_posts_router)
app.include_router(get_user_posts_router)

app.include_router(add_comment_router)

app.include_router(award_medals_router)

app.include_router(rank_global_router)
app.include_router(rank_province_router)
app.include_router(rank_city_router)

app.include_router(auth_check_router)

app.include_router(post_vote_router)
app.include_router(post_favourite_router)
