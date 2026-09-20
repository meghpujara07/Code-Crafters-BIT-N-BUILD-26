from .base import CamelModel
class CloudAccountOut(CamelModel):
    id:str; provider:str; name:str; external_account_id:str; regions:list[str]; mode:str; status:str; last_synced_at:str|None; resource_count:int
