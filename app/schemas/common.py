from typing import Literal
from uuid import UUID
from .base import CamelModel
from .enums import ActionType, Role
class BudgetImpact(CamelModel):
    name:str; limit_usd:float; used_usd:float; after_change_usd:float; within_budget:bool
class MoneyImpact(CamelModel):
    current_monthly_cost_usd:float; projected_monthly_cost_usd:float; delta_monthly_usd:float; delta_percent:float; budget:BudgetImpact|None
class ActionParams(CamelModel):
    target_instances:int|None=None; target_size:str|None=None; target_storage_gb:float|None=None
class ProposedAction(CamelModel):
    type:ActionType; params:ActionParams
class ValidationCheck(CamelModel):
    name:Literal['PERMISSION','POLICY','BUDGET','APPROVAL']; passed:bool; message:str
class ValidationResult(CamelModel):
    allowed:bool; requires_approval:bool; approver_role:Role|None; checks:list[ValidationCheck]
class ActorRef(CamelModel):
    id:UUID; name:str
