from .base import CamelModel
class AuditActor(CamelModel): id:str; name:str
class AuditOut(CamelModel):
    id:str; actor:AuditActor|None; action:str; entity_type:str; entity_id:str|None; before:dict|None; after:dict|None; ts:str
