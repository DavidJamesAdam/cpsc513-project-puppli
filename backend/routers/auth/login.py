from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.concurrency import run_in_threadpool
import firebase_admin
from firebase_admin import auth as admin_auth
from firebase_service import db
from google.cloud import firestore as gcfirestore

router = APIRouter(prefix="/auth", tags=["auth"])

SESSION_EXPIRES_DAYS = 5


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
        session_cookie = await run_in_threadpool(admin_auth.create_session_cookie, id_token, expires_in=expires_in)
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
