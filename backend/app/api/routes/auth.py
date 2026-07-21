from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.api.deps import get_current_user_and_scopes
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.db.session import get_session

router = APIRouter()


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=6, max_length=256)
    email: Optional[str] = None
    # Comma separated scopes like: "dashboard:read,devices:write"
    scopes: str = "admin"


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, session: Session = Depends(get_session)) -> TokenResponse:
    existing = session.exec(select(User).where(User.username == payload.username)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        scopes=payload.scopes,
        created_at=datetime.utcnow(),
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(user.id, user.scopes)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_session)) -> TokenResponse:
    user = session.exec(select(User).where(User.username == payload.username)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user.id, user.scopes)
    return TokenResponse(access_token=token)


@router.get("/me")
def me(ctx=Depends(get_current_user_and_scopes)) -> dict:
    user, _scopes = ctx
    return {
        "id": user.id,
        "username": user.username,
        "scopes": user.scopes,
        "created_at": user.created_at.isoformat(),
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest) -> TokenResponse:
    # Pour simplifier: on réutilise la logique JWT et on considère refresh_token comme access_token.
    user_id, scopes = decode_refresh(payload.refresh_token)
    token = create_access_token(user_id, ",".join(scopes))
    return TokenResponse(access_token=token)


def decode_refresh(token: str):
    # Local import to keep file small.
    from app.core.security import decode_access_token

    return decode_access_token(token)

