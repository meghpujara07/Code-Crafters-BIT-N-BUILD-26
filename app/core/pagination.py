from dataclasses import dataclass
from fastapi import Query
from sqlalchemy import select, func
from app.core.errors import ApiError
from app.schemas.base import PageMeta
@dataclass
class PageParams:
    page:int=1; page_size:int=20
async def paginate(db, stmt, p:PageParams):
    if p.page<1 or p.page_size<1 or p.page_size>100: raise ApiError(400,'VALIDATION_ERROR','Invalid pagination')
    count_stmt=select(func.count()).select_from(stmt.order_by(None).subquery())
    total=(await db.execute(count_stmt)).scalar_one()
    rows=(await db.execute(stmt.offset((p.page-1)*p.page_size).limit(p.page_size))).scalars().all()
    meta=PageMeta(page=p.page,page_size=p.page_size,total=total,total_pages=(total+p.page_size-1)//p.page_size)
    return rows,meta
def apply_sort(stmt, model, sort, allowed, default):
    value=sort or default; field,direction=(value.split(',',1)+['asc'])[:2] if ',' in value else (value,'asc')
    if field not in allowed or direction not in ('asc','desc'): raise ApiError(400,'VALIDATION_ERROR','Unknown sort field')
    col=getattr(model,field); return stmt.order_by(col.desc() if direction=='desc' else col.asc())

def page_params(page:int=Query(1,ge=1),page_size:int=Query(20,alias='pageSize',ge=1,le=100)): return PageParams(page,page_size)
