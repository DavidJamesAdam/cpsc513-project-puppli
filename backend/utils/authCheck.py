from fastapi import HTTPException, Request, status, Depends
from firebase_admin import auth
from firebase_service import db

async def auth_check(request: Request):
  session_cookie = request.cookies.get("session")
  if not session_cookie:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

  try:
    decoded = auth.verify_session_cookie(session_cookie, check_revoked=True)
    return decoded
  except Exception:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


async def require_admin(user: dict = Depends(auth_check)):
  uid = user["uid"]
  profile_doc = db.collection("users").document(uid).get()

  if not profile_doc.exists:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authenticated user profile not found")

  if profile_doc.to_dict().get("role") != "admin":
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                        detail="Admin permission required")

  return user

async def require_owner_or_admin(
    owner_id: str,
    user: dict = Depends(auth_check)
):
    uid = user["uid"]

    user_doc = db.collection("users").document(uid).get()

    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user profile not found"
        )

    role = user_doc.to_dict().get("role")

    if role == "admin":
        return

    if owner_id != uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access"
        )