import logging
from datetime import timedelta
from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import ValidationError
from firebase_admin import auth
from firebase_service import db
from utils.authCheck import auth_check
from models import EmailUpdate, PassUpdate
from limiter import limiter
from logger import LoggedRoute

logger = logging.getLogger(__name__)

router = APIRouter(route_class=LoggedRoute)

SESSION_EXPIRES_DAYS = 5


@router.post("/sessionLogin")
@limiter.limit("5/minute")
async def session_login(request: Request):
  """
  Exchange a Firebase ID token for a long-lived session cookie stored as HttpOnly cookie.
  Client should call Firebase client SDK to sign in and obtain idToken, then POST it here.
  Body JSON: { "idToken": "..." }
  """
  body = await request.json()
  id_token = body.get("idToken")
  if not id_token:
    logger.exception("Missing ID token")
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Missing idToken in body"
    )

  expires_in = timedelta(days=SESSION_EXPIRES_DAYS)
  try:
    session_cookie = await run_in_threadpool(
        auth.create_session_cookie, id_token, expires_in=expires_in
    )
    # verify token to obtain uid for updating lastLogin
    # Not working, not sure why, but not crucial
    # decoded = await run_in_threadpool(admin_auth.verify_id_token, id_token, True)
    # uid = decoded.get("uid")
  except Exception:
    logger.exception("Failed to create session cookie")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Failed to create session cookie",
    )

  response = JSONResponse({"status": "success"})
  response.set_cookie(
      key="session",
      value=session_cookie,
      httponly=True,
      secure=False,
      samesite="Lax",
      max_age=int(expires_in.total_seconds()),
  )
  return response


# Alternative to redirecting on frontend
# @router.get("/require")
# async def require_auth(request: Request):
#     """
#     Endpoint intended for full-page navigations: if the incoming request
#     (from the browser) does not include a valid `session` cookie, this
#     will redirect the browser to the frontend login page. If authenticated,
#     returns a small JSON payload with the uid.
#     """
#     session_cookie = request.cookies.get("session")
#     if not session_cookie:
#         origin = request.headers.get("origin") or "http://localhost:5173"
#         login_url = origin.rstrip("/") + "/login"
#         return RedirectResponse(url=login_url, status_code=302)

#     try:
#         decoded = await run_in_threadpool(admin_auth.verify_session_cookie, session_cookie, True)
#         return {"status": "ok", "uid": decoded.get("uid")}
#     except Exception:
#         origin = request.headers.get("origin") or "http://localhost:5173"
#         login_url = origin.rstrip("/") + "/login"
#         return RedirectResponse(url=login_url, status_code=302)


@router.post("/logout")
@limiter.limit("5/minute")
async def session_logout(request: Request):
  # expect session cookie - read and verify it to get uid
  session_cookie = request.cookies.get("session")
  if not session_cookie:
    # Nothing to do client-side, but return success
    return JSONResponse({"status": "ok"})

  try:
    decoded = await run_in_threadpool(
        auth.verify_session_cookie, session_cookie, True
    )
    uid = decoded.get("uid")
    # revoke refresh tokens (prevents new ID tokens from being minted)
    await run_in_threadpool(auth.revoke_refresh_tokens, uid)
  except Exception:
    # ignore verification errors — clear cookie anyway
    pass

  response = JSONResponse({"status": "ok"})
  response.delete_cookie("session")
  return response


@router.get("/check")
async def check_auth(user: dict = Depends(auth_check)):
  logger.info("Test")
  return {"status": "ok", "uid": user["uid"]}


@router.post("/user/update-email")
@limiter.limit("5/minute")
async def update_email(request: Request, user: dict = Depends(auth_check)):
  try:
    data = await request.json()
    update = EmailUpdate(**data)

    # update email in Firebase Auth
    auth.update_user(user["uid"], email=update.new_email)

    # update profile document in firestore
    user_ref = db.collection("users").document(user["uid"])
    user_ref.update({"email": update.new_email})

    return {"status": "success", "message": "Email updated successfully"}

  except auth.EmailAlreadyExistsError:
    raise HTTPException(status_code=409, detail="Email already in use")
  except ValidationError as e:
    error_messages = []
    for error in e.errors():
      message = error["msg"]
      error_messages.append(f"{message}")
    raise HTTPException(status_code=422, detail=error_messages)
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@router.post("/user/update-password")
@limiter.limit("5/minute")
async def update_password(
    request: Request, update: PassUpdate, user: dict = Depends(auth_check)
):
  try:
    data = await request.json()
    update = PassUpdate(**data)

    auth.update_user(user["uid"], password=update.new_password)

    return {"status": "success", "message": "Password updated successfully"}
  except auth.InvalidPasswordError:
    raise HTTPException(status_code=409, detail="Invalid password")
  except ValidationError as e:
    error_messages = []
    for error in e.errors():
      message = error["msg"]
      error_messages.append(f"{message}")
    raise HTTPException(status_code=422, detail=error_messages)
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
