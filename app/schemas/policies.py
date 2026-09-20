from .base import CamelModel
class PolicyOut(CamelModel):
    id:str; name:str; type:str; enabled:bool; priority:int; scope:dict; rules:dict
