from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, EmailStr, ValidationError, field_validator
import re
from firebase_admin import auth
from firebase_service import db
from google.cloud import firestore as gcfirestore
from utils.authCheck import auth_check

router = APIRouter(prefix="/auth", tags=["Authentication"])

SESSION_EXPIRES_DAYS = 5

# TODO: Do I need to protect this route?
@router.post("/sessionLogin")
async def session_login(request: Request):
    """
    Exchange a Firebase ID token for a long-lived session cookie stored as HttpOnly cookie.
    Client should call Firebase client SDK to sign in and obtain idToken, then POST it here.
    Body JSON: { "idToken": "..." }
    """
    body = await request.json()
    id_token = body.get("idToken")
    print(id_token)
    if not id_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Missing idToken in body")

    expires_in = timedelta(days=SESSION_EXPIRES_DAYS)
    try:
        session_cookie = await run_in_threadpool(auth.create_session_cookie, id_token, expires_in=expires_in)
        # verify token to obtain uid for updating lastLogin
        # Not working, not sure why, but not crucial
        # decoded = await run_in_threadpool(admin_auth.verify_id_token, id_token, True)
        # print("test")
        # uid = decoded.get("uid")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Failed to create session cookie")

    # update lastLogin asynchronously
    # try:
    #     await run_in_threadpool(db.collection("users").document(uid).update, {"lastLogin": gcfirestore.SERVER_TIMESTAMP})
    # except Exception:
    #     # non-fatal; proceed but log in real app
    #     pass

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

# TODO: Do I need to protect this route?
@router.post("/logout")
async def session_logout(request: Request):
    # expect session cookie - read and verify it to get uid
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        # Nothing to do client-side, but return success
        return JSONResponse({"status": "ok"})

    try:
        decoded = await run_in_threadpool(auth.verify_session_cookie, session_cookie, True)
        uid = decoded.get("uid")
        # revoke refresh tokens (prevents new ID tokens from being minted)
        await run_in_threadpool(auth.revoke_refresh_tokens, uid)
    except Exception:
        # ignore verification errors — clear cookie anyway
        pass

    response = JSONResponse({"status": "ok"})
    response.delete_cookie("session")
    return response

# TODO: This already exists as a function, figure out a way to use this route and include user=Depends(auth_check)
@router.get("/check")
def check_auth(request: Request):
    session_cookie = request.cookies.get("session")
    # if not session_cookie:
    #     raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        decoded = auth.verify_session_cookie(session_cookie, check_revoked=True)
        return {"status": "ok", "uid": decoded["uid"]}
    except Exception:
        raise HTTPException(status_code=401, detail="Not authenticated")

class EmailUpdate(BaseModel):
    new_email: EmailStr


@router.post("/user/update-email")
async def update_email(request: Request, user: dict = Depends(auth_check)):
    try:
        data = await request.json()
        update = EmailUpdate(**data)

        #update email in Firebase Auth
        auth.update_user(user["uid"], email=update.new_email)

        #update profile document in firestore
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

COMMON_PASSWORDS = {"password", "12345678", "qwerty", "letmein"}

class PassUpdate(BaseModel):
    new_password: str

    # Password Validation
    @field_validator("new_password")
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain a lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain a digit")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain a symbol")
        if v.lower() in COMMON_PASSWORDS:
            raise ValueError("Password is too common")
        return v

@router.post("/user/update-password")
async def update_password(request: Request, update: PassUpdate, user: dict = Depends(auth_check)):
    try:
        data = await request.json()
        update = PassUpdate(**data)

        #update password in Firebase Auth
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
