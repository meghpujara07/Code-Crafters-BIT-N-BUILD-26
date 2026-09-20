from .base import CamelModel
from .enums import Severity
class AlertOut(CamelModel):
    id:str; severity:Severity; title:str; message:str; source:str; resource_id:str|None; status:str; created_at:str
