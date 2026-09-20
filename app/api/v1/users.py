from uuid import UUID
from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require
from app.core.errors import ApiError
from app.core.rbac import ROLE_PERMISSIONS, permissions_for
from app.core.security import hash_password
from app.db.models import User
from app.ports import use

router = APIRouter(tags=["users"])

_ROLES = set(ROLE_PERMISSIONS)
_SORTABLE = {"email", "name", "role", "active"}
_ALLOWED_CREATE = {"email", "name", "role", "password"}
_ALLOWED_PATCH = {"name", "role", "active", "password"}


def _error(message: str, details: list[dict] | None = None) -> None:
    raise ApiError(400, "VALIDATION_ERROR", message, details or [])


def _require_keys(body: dict, required: set[str]) -> None:
    missing = sorted(required - body.keys())
    if missing:
        _error("Missing required fields.", [{"field": x, "reason": "required"} for x in missing])


def _reject_unknown(body: dict, allowed: set[str]) -> None:
    unknown = sorted(set(body) - allowed)
    if unknown:
        _error("Unknown field(s).", [{"field": x, "reason": "unsupported"} for x in unknown])


def _validate_create(body: dict) -> None:
    _require_keys(body, _ALLOWED_CREATE)
    _reject_unknown(body, _ALLOWED_CREATE)
    if not isinstance(body["email"], str) or not body["email"].strip():
        _error("email must be a non-empty string.", [{"field": "email", "reason": "invalid"}])
    if not isinstance(body["name"], str) or not body["name"].strip():
        _error("name must be a non-empty string.", [{"field": "name", "reason": "invalid"}])
    if body["role"] not in _ROLES:
        _error("Invalid role.", [{"field": "role", "reason": "unsupported role"}])
    if not isinstance(body["password"], str) or not body["password"]:
        _error("password must be a non-empty string.", [{"field": "password", "reason": "invalid"}])


def _validate_patch(body: dict) -> None:
    if not body:
        _error("At least one field is required.")
    _reject_unknown(body, _ALLOWED_PATCH)
    if "name" in body and (not isinstance(body["name"], str) or not body["name"].strip()):
        _error("name must be a non-empty string.", [{"field": "name", "reason": "invalid"}])
    if "role" in body and body["role"] not in _ROLES:
        _error("Invalid role.", [{"field": "role", "reason": "unsupported role"}])
    if "active" in body and not isinstance(body["active"], bool):
        _error("active must be a boolean.", [{"field": "active", "reason": "invalid"}])
    if "password" in body and (not isinstance(body["password"], str) or not body["password"]):
        _error("password must be a non-empty string.", [{"field": "password", "reason": "invalid"}])


def _out(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "active": user.active,
        "permissions": permissions_for(user.role),
    }


@router.get("/users")
async def list_users(
    sort: str | None = Query(None),
    page_size: int = Query(20, alias="pageSize", ge=1),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require("users.manage")),
):
    if page_size > 100:
        _error("pageSize must be at most 100.", [{"field": "pageSize", "reason": "max 100"}])
    stmt = select(User)
    if sort:
        parts = sort.split(",")
        if len(parts) not in (1, 2) or parts[0] not in _SORTABLE or (len(parts) == 2 and parts[1] not in ("asc", "desc")):
            _error("Unknown sort field.")
        col = getattr(User, parts[0])
        stmt = stmt.order_by(col.desc() if len(parts) == 2 and parts[1] == "desc" else col.asc())
    else:
        stmt = stmt.order_by(User.email.asc())
    rows = (await db.execute(stmt)).scalars().all()
    return {"success": True, "data": [_out(x) for x in rows]}


@router.post("/users", status_code=201)
async def create_user(
    body: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require("users.manage")),
):
    _validate_create(body)
    email = body["email"].strip().lower()
    existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        raise ApiError(409, "CONFLICT", "A user with this email already exists.")
    obj = User(email=email, name=body["name"].strip(), role=body["role"], active=True, password_hash=hash_password(body["password"]))
    db.add(obj)
    await db.flush()
    after = _out(obj)
    await use("audit").write(
        db, actor_id=actor.id, action="CREATE_USER", entity_type="USER", entity_id=obj.id,
        before=None, after=after,
    )
    await db.commit()
    return {"success": True, "data": after}


@router.patch("/users/{user_id}")
async def update_user(
    user_id: UUID,
    body: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require("users.manage")),
):
    _validate_patch(body)
    obj = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not obj:
        raise ApiError(404, "NOT_FOUND", "User not found.")
    before = _out(obj)
    if "name" in body:
        obj.name = body["name"].strip()
    if "role" in body:
        obj.role = body["role"]
    if "active" in body:
        obj.active = body["active"]
    if "password" in body:
        obj.password_hash = hash_password(body["password"])
    await db.flush()
    after = _out(obj)
    await use("audit").write(
        db, actor_id=actor.id, action="UPDATE_USER", entity_type="USER", entity_id=obj.id,
        before=before, after=after,
    )
    await db.commit()
    return {"success": True, "data": after}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require("users.manage")),
):
    if user_id == actor.id:
        raise ApiError(400, "VALIDATION_ERROR", "You cannot delete yourself.")
    obj = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not obj:
        raise ApiError(404, "NOT_FOUND", "User not found.")
    before = _out(obj)
    await db.delete(obj)
    await db.flush()
    await use("audit").write(
        db, actor_id=actor.id, action="DELETE_USER", entity_type="USER", entity_id=user_id,
        before=before, after=None,
    )
    await db.commit()
    return {"success": True, "data": {"deleted": True}}
