import logging
import sys
import os
import contextvars
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from logging.handlers import RotatingFileHandler
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from api import api_router
from limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from pythonjsonlogger import jsonlogger

# TODO: Right now, logs are written to myapp.log, but I would love to have the logs exported to an
# external service to be read (Cloudwatch, Grafana, etc)
# Handlers are a way to do this
# logging.basicConfig(
#                     # stream=sys.stdout,
#                     level=logging.INFO,
#                     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
#                     datefmt='%Y-%m-%d %H:%M:%S', # Custom date format,
#                     handlers=[RotatingFileHandler("../myapp.log", maxBytes=10*1024*1024, backupCount=5)]
#                     )

REQUEST_ID_CTX = contextvars.ContextVar("request_id", default=None)

class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = REQUEST_ID_CTX.get()
        return True

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

def configure_logging():
    root = logging.getLogger()
    if root.handlers:
        return
    root.setLevel(LOG_LEVEL)

    format = '%(asctime)s %(name)s %(levelname)s %(message)s %(request_id)s'
    json_formatter = jsonlogger.JsonFormatter(format)

    streamHandler = logging.StreamHandler(sys.stdout)
    streamHandler.setLevel(LOG_LEVEL)
    streamHandler.setFormatter(json_formatter)

    fileHandler = RotatingFileHandler("../myapp.log", maxBytes=10*1024*1024, backupCount=5)
    fileHandler.setLevel(LOG_LEVEL)
    fileHandler.setFormatter(json_formatter)

    requestIdFilter = RequestIdFilter()
    streamHandler.addFilter(requestIdFilter)
    fileHandler.addFilter(requestIdFilter)

    root.addHandler(streamHandler)
    root.addHandler(fileHandler)

# call at startup
configure_logging()

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        REQUEST_ID_CTX.set(rid)
        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        return response


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

# app.add_middleware(RequestIDMiddleware)
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

app.add_middleware(SlowAPIMiddleware)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
