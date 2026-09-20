import asyncio
import importlib
import pkgutil
import logging
from app.db.session import async_session
from app.bootstrap import import_all
log=logging.getLogger(__name__)
def _discover_seed_modules():
    import app.seeds as seeds_pkg
    mods=[]
    for m in pkgutil.iter_modules(seeds_pkg.__path__):
        mod=importlib.import_module(f'app.seeds.{m.name}')
        if hasattr(mod,'run') and hasattr(mod,'ORDER'):
            mods.append(mod)
    return sorted(mods,key=lambda m:m.ORDER)
async def main():
    import_all()
    async with async_session() as db:
        for mod in _discover_seed_modules():
            log.info('running seed module %s (ORDER=%s)',mod.__name__,mod.ORDER)
            await mod.run(db)
if __name__=='__main__': asyncio.run(main())
