import json
from pathlib import Path
from app.main import app
Path('contracts').mkdir(exist_ok=True)
Path('contracts/openapi.json').write_text(json.dumps(app.openapi(),indent=2),encoding='utf-8')
