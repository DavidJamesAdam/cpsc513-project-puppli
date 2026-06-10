from fastapi import APIRouter, Depends, Request, Response
from utils.authCheck import auth_check
from limiter import limiter

from routers.auth import router as auth_router
from routers.petSubProfile import router as pet_profile_router
from routers.user import router as user_router
from routers.userPosts import router as user_posts_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(pet_profile_router, prefix="/pet", tags=["Pet Sub Profile"], dependencies=[Depends(auth_check)])
api_router.include_router(user_router, prefix="/user", tags=["User"])
api_router.include_router(user_posts_router, prefix="/posts", tags=["User Posts"], dependencies=[Depends(auth_check)])

@api_router.get("/healthCheck")
@limiter.limit("100/minute")
async def health_check(request: Request, response: Response):
  return {"status": "healthy"}

