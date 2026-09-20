from fastapi import APIRouter
from sqlalchemy import text
from app.core.config import settings
from app.core.deps import get_db
from app.schemas.base import ApiResponse
from app.schemas.system import SystemHealth
from fastapi import Depends
router=APIRouter(tags=['system'])
@router.get('/system/health',response_model=ApiResponse[SystemHealth])
async def health(db=Depends(get_db)):
    try:
        await db.execute(text('SELECT 1')); dbs='UP'; status='UP'
    except Exception: dbs='DOWN'; status='DEGRADED'
    return {'success':True,'data':SystemHealth(status=status,db=dbs,version=settings.app_version,provider_mode=settings.provider_mode.upper(),demo_controls=settings.enable_demo_controls)}
