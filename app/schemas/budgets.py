from .base import CamelModel
class BudgetOut(CamelModel):
    id:str; name:str; scope:str; scope_value:str|None; amount_usd:float; period:str; alert_thresholds:list[int]; hard_limit:bool; used_usd:float; used_percent:float; forecast_usd:float
