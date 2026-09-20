# app/api/auth.py
"""Authentication router.
Provides login, token refresh, logout, and current user endpoints.
"""

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import jwt

from app.core.config import Settings, get_settings
from app.core.security import verify_password, get_password_hash
from app.core.deps import get_current_user
from app.db.session import async_session
from app.db import models
from app.core.exceptions import ApiError

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    expiresIn: int
    user: dict

def create_access_token(data: dict, expires_delta: timedelta, secret: str) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret, algorithm="HS256")

def create_refresh_token(data: dict, expires_delta: timedelta, secret: str) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire, "jti": data.get("jti")})
    return jwt.encode(to_encode, secret, algorithm="HS256")

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(payload: LoginRequest, settings: Settings = Depends(get_settings)):
    async with async_session() as session:
        result = await session.execute(
            models.User.__table__.select().where(models.User.email == payload.email)
        )
        user = result.scalar_one_or_none()
        if not user or not verify_password(payload.password, user.hashed_password):
            raise ApiError(status.HTTP_401_UNAUTHORIZED, "UNAUTHENTICATED", "Invalid credentials")
        access_payload = {"sub": str(user.id), "role": user.role}
        refresh_payload = {"sub": str(user.id), "jti": str(user.id)}
        access_token = create_access_token(access_payload, timedelta(minutes=15), settings.jwt_secret_key)
        refresh_token = create_refresh_token(refresh_payload, timedelta(days=7), settings.jwt_secret_key)
        return TokenResponse(
            accessToken=access_token,
            refreshToken=refresh_token,
            expiresIn=15 * 60,
            user={"id": str(user.id), "email": user.email, "role": user.role},
        )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refreshToken: str, settings: Settings = Depends(get_settings)):
    try:
        payload = jwt.decode(refreshToken, settings.jwt_secret_key, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise ApiError(status.HTTP_401_UNAUTHORIZED, "UNAUTHENTICATED", "Invalid refresh token")
    user_id = payload.get("sub")
    async with async_session() as session:
        result = await session.execute(models.User.__table__.select().where(models.User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise ApiError(status.HTTP_401_UNAUTHORIZED, "UNAUTHENTICATED", "User not found")
        access_payload = {"sub": str(user.id), "role": user.role}
        access_token = create_access_token(access_payload, timedelta(minutes=15), settings.jwt_secret_key)
        return TokenResponse(
            accessToken=access_token,
            refreshToken=refreshToken,
            expiresIn=15 * 60,
            user={"id": str(user.id), "email": user.email, "role": user.role},
        )

@router.post("/logout")
async def logout(refreshToken: str, settings: Settings = Depends(get_settings)):
    # In a real implementation, we would store revoked jti in DB.
    # Here we simply return success.
    return {"loggedOut": True}

@router.get("/me")
async def me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }
