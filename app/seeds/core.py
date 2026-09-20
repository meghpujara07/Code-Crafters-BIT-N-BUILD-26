from uuid import uuid5,NAMESPACE_URL
from sqlalchemy import select
from app.db.models import User,CloudAccount,Policy,Budget,NotificationSetting
from app.core.security import hash_password
ORDER=10
async def run(db):
    users=[('admin@cloudops.dev','Admin','ADMIN'),('manager@cloudops.dev','Manager','MANAGER'),('devops@cloudops.dev','DevOps','DEVOPS'),('viewer@cloudops.dev','Viewer','VIEWER')]
    for email,name,role in users:
        u=(await db.execute(select(User).where(User.email==email))).scalar_one_or_none()
        if not u:
            u=User(id=uuid5(NAMESPACE_URL,'cloudops:'+email),email=email,password_hash=hash_password('Passw0rd!'),name=name,role=role,active=True); db.add(u); await db.flush()
        for channel,enabled in [('IN_APP',True),('EMAIL',False),('WHATSAPP',False)]:
            exists=(await db.execute(select(NotificationSetting).where(NotificationSetting.user_id==u.id,NotificationSetting.channel==channel))).scalar_one_or_none()
            if not exists: db.add(NotificationSetting(user_id=u.id,channel=channel,enabled=enabled,events=['ALERT_CREATED','RECOMMENDATION_CREATED','APPROVAL_REQUESTED','ACTION_COMPLETED','ACTION_FAILED','BUDGET_THRESHOLD','COST_ANOMALY'],destination=None))
    if not (await db.execute(select(CloudAccount))).scalars().first():
        for i,(provider,name) in enumerate([('AWS','Demo AWS'),('AZURE','Demo Azure'),('GCP','Demo GCP')]): db.add(CloudAccount(id=uuid5(NAMESPACE_URL,'cloudops:account:'+provider),provider=provider,name=name,external_account_id='demo-'+provider.lower(),regions=['us-east-1'],credentials_encrypted=None,mode='MOCK',status='CONNECTED',last_synced_at=None))
    if not (await db.execute(select(Policy))).scalars().first():
        db.add_all([Policy(id=uuid5(NAMESPACE_URL,'cloudops:policy:safety'),name='Global safety limits',type='SAFETY_LIMIT',enabled=True,priority=10,scope={},rules={'maxInstances':10,'minInstances':1,'maxScaleStepPercent':100,'maxCostIncreasePerActionUsd':500}),Policy(id=uuid5(NAMESPACE_URL,'cloudops:policy:approval'),name='Large spend needs approval',type='APPROVAL_RULE',enabled=True,priority=20,scope={},rules={'requireApprovalWhen':{'costDeltaMonthlyUsdGt':100},'approverRole':'MANAGER'}),Policy(id=uuid5(NAMESPACE_URL,'cloudops:policy:admin'),name='Admin approval',type='APPROVAL_RULE',enabled=True,priority=30,scope={},rules={'requireApprovalWhen':{'actionTypeIn':['EXPAND_STORAGE']},'approverRole':'ADMIN'})])
    if not (await db.execute(select(Budget))).scalars().first():
        db.add_all([Budget(id=uuid5(NAMESPACE_URL,'cloudops:budget:global'),name='Global monthly budget',scope='GLOBAL',scope_value=None,amount_usd=3500,period='MONTHLY',alert_thresholds=[80,100],hard_limit=True),Budget(id=uuid5(NAMESPACE_URL,'cloudops:budget:aws'),name='AWS monthly budget',scope='PROVIDER',scope_value='AWS',amount_usd=1500,period='MONTHLY',alert_thresholds=[80,100],hard_limit=False)])
    await db.commit()
