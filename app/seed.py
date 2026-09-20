import asyncio
from app.db.session import async_session
from app.bootstrap import import_all
from app.seeds.core import run
async def main():
    import_all()
    async with async_session() as db: await run(db)
if __name__=='__main__': asyncio.run(main())
