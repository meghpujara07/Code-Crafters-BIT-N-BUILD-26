from .base import CamelModel
from .common import ActionParams, ValidationResult, MoneyImpact
class ActionOut(CamelModel):
    id:str; resource_id:str|None; resource_name:str; recommendation_id:str|None; type:str; params:ActionParams; status:str; requested_by:dict; approved_by:dict|None; validation:ValidationResult; cost_impact:MoneyImpact; result:dict|None; error:str|None; created_at:str; executed_at:str|None
