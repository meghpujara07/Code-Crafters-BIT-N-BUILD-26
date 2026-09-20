from .base import CamelModel
from .enums import Channel, NotificationEvent
class NotificationOut(CamelModel):
    id:str; channel:Channel; title:str; body:str; entity_type:str|None; entity_id:str|None; read_at:str|None; created_at:str
class NotificationSettingOut(CamelModel):
    channel:Channel; enabled:bool; events:list[NotificationEvent]; destination:str|None
class NotificationSettingsBody(CamelModel):
    settings:list[NotificationSettingOut]
class NotificationTest(CamelModel): channel:Channel
