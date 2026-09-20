from .base import CamelModel
class SystemHealth(CamelModel):
    status:str; db:str; version:str; provider_mode:str; demo_controls:bool
