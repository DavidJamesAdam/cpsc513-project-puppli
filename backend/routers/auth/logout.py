from fastapi.concurrency import run_in_threadpool
from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import JSONResponse
from firebase_admin import auth as admin_auth

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/logout")
async def session_logout(request: Request):
    # expect session cookie - read and verify it to get uid
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        # Nothing to do client-side, but return success
        return JSONResponse({"status": "ok"})

    try:
        decoded = await run_in_threadpool(admin_auth.verify_session_cookie, session_cookie, True)
        uid = decoded.get("uid")
        # revoke refresh tokens (prevents new ID tokens from being minted)
        await run_in_threadpool(admin_auth.revoke_refresh_tokens, uid)
    except Exception:
        # ignore verification errors — clear cookie anyway
        pass

    response = JSONResponse({"status": "ok"})
    response.delete_cookie("session")
    return response