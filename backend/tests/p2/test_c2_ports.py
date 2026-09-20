import pytest
from app.ports import use
from app.schemas.common import ProposedAction, ActionParams
from app.schemas.enums import ActionType

@pytest.mark.asyncio
async def test_c1_stubs_keep_parallel_commits_runnable():
    result=await use('policy_engine').check_limits(None,None,ProposedAction(type=ActionType.START,params=ActionParams()),None)
    assert result.allowed is True
    assert use('hub').has_subscribers('alerts') is False
