from typing import AsyncIterator
from uuid import UUID
from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session
from app.db.models import User
from app.core.security import decode_token
from app.core.errors import ApiError
from app.core.rbac import permissions_for
async def get_db()->AsyncIterator[AsyncSession]:
    async with async_session() as db: yield db
async def _token(authorization:str|None):
    if not authorization or not authorization.lower().startswith('bearer '): raise ApiError(401,'UNAUTHENTICATED','Missing bearer token')
    return authorization.split(' ',1)[1]
async def current_user(authorization:str|None=Header(None),db:AsyncSession=Depends(get_db)):
    token=await _token(authorization); payload=decode_token(token)
    try: uid=UUID(payload['sub'])
    except Exception as exc: raise ApiError(401,'UNAUTHENTICATED','Invalid token subject') from exc
    user=(await db.execute(select(User).where(User.id==uid))).scalar_one_or_none()
    if not user: raise ApiError(401,'UNAUTHENTICATED','User not found')
    if not user.active: raise ApiError(403,'FORBIDDEN','User is inactive')
    return user
def require(permission:str):
    async def guard(user=Depends(current_user)):
        if permission not in permissions_for(user.role): raise ApiError(403,'FORBIDDEN','Permission denied')
        return user
    return guard
async def current_user_ws(token:str,db:AsyncSession):
    try:
        payload=decode_token(token); uid=UUID(payload['sub'])
        user=(await db.execute(select(User).where(User.id==uid))).scalar_one_or_none()
        return user if user and user.active else None
    except Exception: return None
