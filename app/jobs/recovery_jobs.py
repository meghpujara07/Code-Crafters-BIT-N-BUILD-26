from __future__ import annotations
import asyncio
import logging
from sqlalchemy import select
from app.db.models import Action
from app.db.session import async_session
from app.schemas.enums import ActionStatus
from app.services.orchestrator import _execute_action

log=logging.getLogger(__name__)

async def recover_executing_actions() -> int:
    async with async_session() as db:
        ids=[x.id for x in (await db.execute(select(Action.id).where(Action.status==ActionStatus.EXECUTING.value))).scalars().all()]
    for action_id in ids:
        asyncio.create_task(_execute_action(action_id))
    if ids: log.info("recovered %s executing actions",len(ids))
    return len(ids)
