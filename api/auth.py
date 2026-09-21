import datetime
import secrets
import uuid
from typing import Optional
import argon2
import argon2.exceptions
import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from config import JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from database import get_db
from models import User

_ph = argon2.PasswordHasher()
_security = HTTPBearer()


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, plain)
    except (argon2.exceptions.VerificationError, argon2.exceptions.InvalidHashError):
        return False


def create_access_token(user_id: uuid.UUID, role: str) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    expire = now + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if "sub" not in payload:
            raise HTTPException(status_code=401, detail="Token missing sub claim")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user_any_status(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(credentials.credentials)
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_current_user(
    current_user: User = Depends(get_current_user_any_status),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="User inactive")
    return current_user



def require_roles(*roles: str):
    def dep(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Permission denied")
        return current_user
    return dep


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Permission denied")
    return current_user


_optional_security = HTTPBearer(auto_error=False)


def verify_internal_token(request: Request) -> bool:
    """
    Validate whether the incoming request contains an authentic internal service secret/token.
    Accepts X-Internal-Token, X-Internal-Secret, X-Internal-Key, or X-API-Key.
    """
    token_candidate = (
        request.headers.get("X-Internal-Token")
        or request.headers.get("X-Internal-Secret")
        or request.headers.get("X-Internal-Key")
        or request.headers.get("X-API-Key")
    )
    if not token_candidate:
        return False

    from config import INTERNAL_API_KEY, INTERNAL_TOKEN

    allowed_keys = [k for k in (INTERNAL_API_KEY, INTERNAL_TOKEN) if k and len(k) >= 16]
    for expected in allowed_keys:
        if secrets.compare_digest(token_candidate.strip(), expected.strip()):
            return True

    return False


def require_internal_token(request: Request) -> bool:
    """FastAPI dependency requiring a valid internal service token."""
    if not verify_internal_token(request):
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing internal service authorization token",
        )
    return True


def require_admin_or_internal(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    FastAPI dependency allowing access if either:
    1. A valid internal service token header is supplied, OR
    2. A valid Bearer token for an active ADMIN user is supplied.
    Returns the User object if authenticated as an Admin, or None if authorized as an internal caller.
    """
    if verify_internal_token(request):
        return None

    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication required: Admin token or internal token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User inactive")
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Permission denied")

    return user


require_internal_or_admin = require_admin_or_internal
