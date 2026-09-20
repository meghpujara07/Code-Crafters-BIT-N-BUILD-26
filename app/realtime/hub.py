import logging
from datetime import timezone
from uuid import UUID
from fastapi import WebSocket
from app.core.util import utcnow
from app.ports import provide
log=logging.getLogger(__name__)
class Hub:
    def __init__(self): self.connections={}; self.user_channels={}
    async def connect(self,ws:WebSocket,user_id:UUID):
        await ws.accept(); key=id(ws); self.connections[key]={'ws':ws,'channels':set(['user']),'user_id':user_id}; self.user_channels.setdefault(user_id,set()).add(key)
    async def disconnect(self,ws:WebSocket):
        key=id(ws); item=self.connections.pop(key,None)
        if item:
            self.user_channels.get(item['user_id'],set()).discard(key)
    def subscribe(self,ws:WebSocket,channels:list[str]):
        item=self.connections.get(id(ws));
        if item: item['channels'].update(channels)
    def unsubscribe(self,ws:WebSocket,channels:list[str]):
        item=self.connections.get(id(ws));
        if item: item['channels'].difference_update(channels)
    def has_subscribers(self,channel:str)->bool:
        return any(channel in x['channels'] for x in self.connections.values())
    async def _send(self,item,event,channel,data):
        try: await item['ws'].send_json({'event':event,'channel':channel,'ts':utcnow().isoformat().replace('+00:00','Z'),'data':data})
        except Exception: await self.disconnect(item['ws'])
    async def publish(self,event:str,channel:str,data:dict):
        for item in list(self.connections.values()):
            if channel in item['channels']: await self._send(item,event,channel,data)
    async def publish_user(self,user_id:UUID,event:str,data:dict):
        for key in list(self.user_channels.get(user_id,set())):
            item=self.connections.get(key)
            if item: await self._send(item,event,'user',data)
hub=Hub(); provide('hub',hub)
