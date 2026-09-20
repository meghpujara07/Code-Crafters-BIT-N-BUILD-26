from fastapi import APIRouter,WebSocket,WebSocketDisconnect
from app.db.session import async_session
from app.core.deps import current_user_ws
from app.realtime.hub import hub
router=APIRouter()
ALLOWED={'dashboard','alerts','actions','recommendations','system','user'}
def valid_channel(ch): return ch in ALLOWED or ch.startswith('resource:')
@router.websocket('/ws')
async def websocket_endpoint(ws:WebSocket):
    token=ws.query_params.get('token','')
    async with async_session() as db:
        user=await current_user_ws(token,db)
        if not user:
            await ws.close(code=4401); return
        await hub.connect(ws,user.id)
        try:
            while True:
                msg=await ws.receive_json(); action=msg.get('action')
                if action=='ping': await hub.publish_user(user.id,'pong',{})
                elif action in ('subscribe','unsubscribe'):
                    channels=msg.get('channels') or []
                    clean=[]
                    for ch in channels:
                        if not isinstance(ch,str) or not valid_channel(ch): continue
                        if ch=='user' or (ch.startswith('user:') and ch!='user:'+str(user.id)): continue
                        if ch.startswith('resource:'):
                            try: __import__('uuid').UUID(ch.split(':',1)[1])
                            except Exception: continue
                        clean.append(ch)
                    (hub.subscribe if action=='subscribe' else hub.unsubscribe)(ws,clean)
        except WebSocketDisconnect: pass
        finally: await hub.disconnect(ws)
