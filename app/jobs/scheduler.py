from apscheduler.schedulers.asyncio import AsyncIOScheduler
import importlib,pkgutil

def register_jobs(scheduler):
    try: pkg=importlib.import_module('app.jobs')
    except ModuleNotFoundError:return
    for m in pkgutil.iter_modules(pkg.__path__):
        if m.name in ('scheduler','__init__'): continue
        mod=importlib.import_module(f'app.jobs.{m.name}')
        if hasattr(mod,'register'): mod.register(scheduler)
