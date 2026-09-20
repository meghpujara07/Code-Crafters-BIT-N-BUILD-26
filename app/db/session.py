from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings
_engine=None
_session_factory=None
def get_engine():
    global _engine
    if _engine is None: _engine=create_async_engine(settings.normalized_database_url,pool_pre_ping=True)
    return _engine
def async_session():
    global _session_factory
    if _session_factory is None: _session_factory=async_sessionmaker(get_engine(),expire_on_commit=False,class_=AsyncSession)
    return _session_factory()
async def get_db():
    async with async_session() as session: yield session
