from typing import Union, List, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from firebase_service import db

# from routers.auth.login import router as auth_login_router
# from routers.auth.logout import router as auth_logout_router

from routers.auth import router as auth_router

from routers.posts.createPost import router as create_post_router
from routers.posts.getPosts import router as get_posts_router
from routers.posts.getUserPosts import router as get_user_posts_router
from routers.posts.addComment import router as add_comment_router
from routers.posts.awardMedals import router as award_medals_router
from routers.posts.postVote import router as post_vote_router
from routers.posts.postFavourite import router as post_favourite_router
from routers.posts.rankGlobal import router as rank_global_router
from routers.posts.rankProvince import router as rank_province_router
from routers.posts.rankCity import router as rank_city_router

from routers.users.getUser import router as get_user_router
from routers.users.updateUser import router as update_user_router
from routers.users.postUser import router as post_user_router
from routers.users.deleteUser import router as delete_user_router

from routers.pets.getPets import router as get_pets_router
from routers.pets.updatePet import router as update_pet_router
from routers.pets.createSubprofile import router as create_subprofile_router
from routers.pets.getPetByID import router as get_pet_by_id_router
from routers.pets.deleteSubprofile import router as delete_subprofile_router

# from routers.auth.updateEmail import router as update_email_router
# from routers.auth.updatePassword import router as update_password_router

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

app.include_router(get_posts_router)
app.include_router(get_user_posts_router)
app.include_router(create_post_router)

app.include_router(add_comment_router)
app.include_router(get_user_router)
app.include_router(post_user_router)
app.include_router(update_user_router)

app.include_router(get_pets_router)
app.include_router(update_pet_router)
app.include_router(delete_user_router)
app.include_router(award_medals_router)

app.include_router(rank_global_router)
app.include_router(rank_province_router)
app.include_router(rank_city_router)

app.include_router(auth_check_router)

app.include_router(post_vote_router)
app.include_router(post_favourite_router)
app.include_router(create_subprofile_router)

app.include_router(update_pet_router)
app.include_router(get_pet_by_id_router)
app.include_router(delete_subprofile_router)
