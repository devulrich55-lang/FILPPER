from typing import List, Tuple

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from app.core.security import decode_access_token
from app.db.models import User
from app.db.session import get_session

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_and_scopes(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> Tuple[User, List[str]]:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Bearer token",
        )

    token = credentials.credentials
    user_id, scopes = decode_access_token(token)

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user, scopes


def require_scopes(required: List[str]):
    def _checker(ctx: Tuple[User, List[str]] = Depends(get_current_user_and_scopes)) -> User:
        user, scopes = ctx

        # Super user shortcut.
        if "admin" in scopes:
            return user

        missing = [scope for scope in required if scope not in scopes]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required scopes: {', '.join(missing)}",
            )
        return user

    return Depends(_checker)

