# app/api/system.py
"""System router providing health and version endpoints.
All responses follow the envelope defined in the architecture.
"""

from fastapi import APIRouter, Depends
from app.core.config import Settings, get_settings
from app.core.exceptions import ApiError

router = APIRouter()

@router.get("/health", tags=["system"])
async def health(settings: Settings = Depends(get_settings)):
    return {
        "status": "UP",
        "db": "UP",
        "version": "0.1.0",
        "providerMode": "MOCK",
        "demoControls": settings.enable_demo_controls,
    }

@router.get("/version", tags=["system"])
async def version():
    return {"version": "0.1.0"}
