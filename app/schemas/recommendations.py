from .base import CamelModel
from .common import ProposedAction, MoneyImpact, ValidationResult
class RecommendationOut(CamelModel):
    id:str; resource_id:str; resource_name:str; provider:str; type:str; status:str; title:str; summary:str; confidence:int; severity:str; reason:list[dict]; proposed_action:ProposedAction; cost_impact:MoneyImpact; policy_check:ValidationResult; created_at:str; expires_at:str
