from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import api_router


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
# app = FastAPI(lifespan=lifespan, dependencies=[Depends(verify_firebase_token)])

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "http://localhost:3000"],  # React dev server ports
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
app.include_router(api_router, prefix="/api/v1")

