import importlib,pkgutil
from fastapi import APIRouter
api_router=APIRouter()
for m in pkgutil.iter_modules(__path__):
    mod=importlib.import_module(f'{__name__}.{m.name}')
    if hasattr(mod,'router'): api_router.include_router(mod.router)
