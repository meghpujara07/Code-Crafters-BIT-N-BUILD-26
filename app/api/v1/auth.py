from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select, delete
from app.core.deps import get_db,current_user
from app.core.errors import ApiError
from app.core.security import hash_password,verify_password,create_access_token,create_refresh_token,decode_token
from app.core.rbac import permissions_for
from app.core.util import utcnow
from app.db.models import User,RefreshToken
from app.schemas.base import ApiResponse
from app.schemas.auth import LoginRequest,RefreshRequest,LogoutRequest,LoginResponse,UserOut
router=APIRouter(tags=['auth'])
def user_out(u): return UserOut(id=str(u.id),email=u.email,name=u.name,role=u.role,active=u.active,permissions=permissions_for(u.role))
@router.post('/auth/login',response_model=ApiResponse[LoginResponse])
async def login(body:LoginRequest,db=Depends(get_db)):
    u=(await db.execute(select(User).where(User.email==body.email))).scalar_one_or_none()
    if not u or not verify_password(body.password,u.password_hash): raise ApiError(401,'UNAUTHENTICATED','Invalid credentials')
    if not u.active: raise ApiError(403,'FORBIDDEN','User is inactive')
    access,expires=create_access_token(u.id,u.role); refresh,jti,exp=create_refresh_token(u.id)
    db.add(RefreshToken(user_id=u.id,jti=str(jti),expires_at=exp)); await db.commit()
    return {'success':True,'data':LoginResponse(access_token=access,refresh_token=refresh,expires_in=expires,user=user_out(u))}
@router.post('/auth/refresh',response_model=ApiResponse[dict])
async def refresh(body:RefreshRequest,db=Depends(get_db)):
    p=decode_token(body.refresh_token)
    if p.get('kind')!='refresh': raise ApiError(401,'UNAUTHENTICATED','Invalid refresh token')
    try: uid=UUID(p['sub'])
    except Exception: raise ApiError(401,'UNAUTHENTICATED','Invalid refresh token')
    rt=(await db.execute(select(RefreshToken).where(RefreshToken.jti==p.get('jti')))).scalar_one_or_none()
    u=(await db.execute(select(User).where(User.id==uid))).scalar_one_or_none()
    if not rt or rt.revoked_at or rt.expires_at<utcnow() or not u: raise ApiError(401,'UNAUTHENTICATED','Refresh token revoked or expired')
    access,expires=create_access_token(u.id,u.role)
    return {'success':True,'data':{'accessToken':access,'refreshToken':body.refresh_token,'expiresIn':expires}}
@router.post('/auth/logout',response_model=ApiResponse[dict])
async def logout(body:LogoutRequest,user=Depends(current_user),db=Depends(get_db)):
    p=decode_token(body.refresh_token); jti=p.get('jti')
    rt=(await db.execute(select(RefreshToken).where(RefreshToken.jti==jti,RefreshToken.user_id==user.id))).scalar_one_or_none()
    if rt: rt.revoked_at=utcnow(); await db.commit()
    return {'success':True,'data':{'loggedOut':True}}
@router.get('/auth/me',response_model=ApiResponse[UserOut])
async def me(user=Depends(current_user)): return {'success':True,'data':user_out(user)}
