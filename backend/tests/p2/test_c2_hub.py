import pytest
from uuid import uuid4
from app.realtime.hub import Hub

class FakeSocket:
    def __init__(self): self.messages=[]
    async def send_json(self,data): self.messages.append(data)

@pytest.mark.asyncio
async def test_hub_publish_and_subscription():
    h=Hub(); ws=FakeSocket(); uid=uuid4(); h.connections[id(ws)]={'ws':ws,'channels':{'alerts'},'user_id':uid}
    assert h.has_subscribers('alerts')
    await h.publish('alert.created','alerts',{'id':'1'})
    assert ws.messages[0]['event']=='alert.created'
    assert ws.messages[0]['channel']=='alerts'
    assert ws.messages[0]['data']=={'id':'1'}

@pytest.mark.asyncio
async def test_hub_failed_send_drops_socket():
    class Broken:
        async def send_json(self,data): raise RuntimeError('broken')
    h=Hub(); ws=Broken(); uid=uuid4(); h.connections[id(ws)]={'ws':ws,'channels':{'alerts'},'user_id':uid}; h.user_channels[uid]={id(ws)}
    await h.publish('x','alerts',{})
    assert id(ws) not in h.connections
