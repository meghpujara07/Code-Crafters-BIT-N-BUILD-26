import logging
from datetime import datetime, timezone
from uuid import uuid4
from app.ports import BudgetUsage, ProviderOperation, ValidationOutcome
from app.schemas.common import MoneyImpact, BudgetImpact, ValidationResult
log=logging.getLogger(__name__)
class CostStub:
 async def estimate_impact(self,db,resource_id,action): return MoneyImpact(current_monthly_cost_usd=100,projected_monthly_cost_usd=100,delta_monthly_usd=0,delta_percent=0,budget=None)
 async def budget_usage(self,db,budget_id): return BudgetUsage(0,0)
class IngestionStub:
 async def sync_account(self,account_id): log.debug('stub ingestion sync %s',account_id)
 async def refresh_resource(self,resource_id): log.debug('stub ingestion refresh %s',resource_id)
class FakeAdapter:
 provider='MOCK'
 async def validate_credentials(self,acc): return ValidationOutcome(True,'ok')
 async def list_resources(self,acc): return []
 async def get_metrics(self,*args,**kwargs): return []
 async def get_costs(self,*args,**kwargs): return []
 async def execute(self,*args,**kwargs): return ProviderOperation(str(uuid4()),'SUCCEEDED','ok')
 async def get_operation_status(self,*args,**kwargs): return ProviderOperation(str(uuid4()),'SUCCEEDED','ok')
class AdapterStub:
 def get(self,account): return FakeAdapter()
class PolicyStub:
 async def check_limits(self,db,resource_id,action,impact): return ValidationResult(allowed=True,requires_approval=False,approver_role=None,checks=[])
class AlertsStub:
 async def raise_alert(self,*args,**kwargs): return None
 async def resolve_alerts(self,*args,**kwargs): return 0
class NotifierStub:
 async def notify_event(self,*args,**kwargs): return None
class HubStub:
 def has_subscribers(self,channel): return False
 async def publish(self,*args,**kwargs): return None
 async def publish_user(self,*args,**kwargs): return None
class AuditStub:
 async def write(self,*args,**kwargs): return None
STUBS={'cost_engine':CostStub(),'ingestion':IngestionStub(),'adapters':AdapterStub(),'policy_engine':PolicyStub(),'alerts':AlertsStub(),'notifier':NotifierStub(),'hub':HubStub(),'audit':AuditStub()}
