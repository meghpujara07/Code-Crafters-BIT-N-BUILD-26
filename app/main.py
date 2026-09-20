import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.errors import ApiError
from app.bootstrap import import_all
from app.api.v1 import api_router
from app.db.session import get_engine
log=logging.getLogger(__name__)
@asynccontextmanager
async def lifespan(app:FastAPI):
    import_all()
    if settings.seed_on_start:
        try:
            from app.seed import main as seed_main
            await seed_main()
        except Exception:
            log.exception('seed_on_start failed')
    try:
        from app.jobs.recovery_jobs import recover_executing_actions
        await recover_executing_actions()
    except Exception:
        log.exception('action recovery failed')
    yield
    if get_engine:
        await get_engine().dispose()
app=FastAPI(title='CloudOps Platform',version=settings.app_version,docs_url='/api/docs',openapi_url='/api/openapi.json',redirect_slashes=False,lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=settings.cors_origin_list,allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
@app.exception_handler(ApiError)
async def api_error(_,exc:ApiError): return JSONResponse({'success':False,'error':{'code':exc.code,'message':exc.message,'details':exc.details}},exc.status)
@app.exception_handler(RequestValidationError)
async def validation(_,exc): return JSONResponse({'success':False,'error':{'code':'VALIDATION_ERROR','message':'Request validation failed','details':[{'field':'.'.join(str(x) for x in e['loc']),'reason':e['msg']} for e in exc.errors()]}},400)
@app.exception_handler(StarletteHTTPException)
async def http_error(_,exc):
    code='NOT_FOUND' if exc.status_code==404 else ('FORBIDDEN' if exc.status_code==403 else 'UNAUTHENTICATED' if exc.status_code==401 else 'VALIDATION_ERROR' if exc.status_code==400 else 'INTERNAL_ERROR')
    return JSONResponse({'success':False,'error':{'code':code,'message':str(exc.detail),'details':[]}},exc.status_code)
@app.exception_handler(Exception)
async def unhandled(_,exc):
    log.exception('unhandled exception',exc_info=exc)
    return JSONResponse({'success':False,'error':{'code':'INTERNAL_ERROR','message':'Internal server error','details':[]}},500)
app.include_router(api_router,prefix='/api/v1')
try:
    from app.realtime.ws import router as ws_router
    app.include_router(ws_router)
except ModuleNotFoundError:
    pass
