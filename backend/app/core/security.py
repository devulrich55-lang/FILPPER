from datetime import datetime, timedelta
from typing import List, Optional, Tuple

import bcrypt
import jwt
from fastapi import HTTPException, status

from app.core.config import settings


def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _parse_scopes(scopes: str) -> List[str]:
    return [s.strip() for s in scopes.split(",") if s.strip()]


def create_access_token(user_id: int, scopes: str) -> str:
    now = datetime.utcnow()
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)

    payload = {
        "sub": str(user_id),
        "scopes": _parse_scopes(scopes),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> Tuple[int, List[str]]:
    try:
        decoded = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc

    user_id_raw: Optional[str] = decoded.get("sub")
    scopes: List[str] = decoded.get("scopes", [])

    if not user_id_raw:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return int(user_id_raw), scopes
