import importlib,pkgutil,logging
log=logging.getLogger(__name__)
def import_all(pkgs=('app.services','app.adapters','app.jobs','app.seeds','app.realtime')):
    for name in pkgs:
        try: pkg=importlib.import_module(name)
        except ModuleNotFoundError: continue
        for m in pkgutil.walk_packages(pkg.__path__,name+'.'):
            try: importlib.import_module(m.name)
            except ModuleNotFoundError as exc:
                if str(exc.name or '').startswith('app.adapters'): log.warning('optional module unavailable: %s',m.name)
                else: raise
