from .base import CamelModel
class UserOut(CamelModel):
    id:str; email:str; name:str; role:str; active:bool; permissions:list[str]
