import logging
import sys
import os
import contextvars
import uuid
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from pythonjsonlogger import jsonlogger
from logging.handlers import RotatingFileHandler

# TODO: Right now, logs are written to myapp.log, but I would love to have the logs exported to an
# external service to be read (Cloudwatch, Grafana, etc)
# Handlers are a way to do this

logger = logging.getLogger(__name__)

REQUEST_ID_CTX = contextvars.ContextVar("request_id", default=None)
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FILE_PATH = os.getenv("LOG_DIRECTORY")

class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = REQUEST_ID_CTX.get()
        return True


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

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        REQUEST_ID_CTX.set(rid)
        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        return response

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = time.time()
        response = await call_next(request)
        duration_ms = int((time.time()-start)*1000)
        logger.info("request.finished",
                    extra={"path": request.url.path, "method": request.method,
                           "status": response.status_code, "duration_ms": duration_ms})
        return response