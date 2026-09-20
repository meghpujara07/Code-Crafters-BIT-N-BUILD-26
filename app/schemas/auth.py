from pydantic import EmailStr
from .base import CamelModel
from .enums import Role
from .common import ActorRef
class LoginRequest(CamelModel): email:EmailStr; password:str
class RefreshRequest(CamelModel): refresh_token:str
class LogoutRequest(CamelModel): refresh_token:str
class UserOut(CamelModel):
    id:str; email:str; name:str; role:Role; active:bool; permissions:list[str]
class LoginResponse(CamelModel): access_token:str; refresh_token:str; expires_in:int; user:UserOut
