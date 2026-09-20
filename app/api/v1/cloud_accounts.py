from uuid import UUID
from fastapi import APIRouter, Body, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require
from app.core.errors import ApiError
from app.core.security import encrypt_credentials
from app.core.util import iso
from app.db.models import CloudAccount, Resource, User
from app.ports import use

router = APIRouter(tags=["cloud-accounts"])

_PROVIDERS = {"AWS", "AZURE", "GCP"}
_MODES = {"MOCK", "LIVE"}
_ALLOWED = {"provider", "name", "externalAccountId", "regions", "mode", "credentials"}


def _error(message: str, field: str | None = None) -> None:
    raise ApiError(400, "VALIDATION_ERROR", message, [{"field": field, "reason": "invalid"}] if field else [])


def _credentials(value: object, provider: str) -> dict:
    if not isinstance(value, dict):
        _error("credentials must be an object.", "credentials")
    assert isinstance(value, dict)
    required: dict[str, set[str]] = {
        "AWS": {"authType"},
        "AZURE": {"tenantId", "clientId", "clientSecret", "subscriptionId"},
        "GCP": {"projectId", "serviceAccountJson"},
    }
    if provider == "AWS":
        auth = value.get("authType")
        if auth not in {"ACCESS_KEY", "ASSUME_ROLE"}:
            _error("Invalid AWS authType.", "credentials.authType")
        required_fields = {"authType", "accessKeyId", "secretAccessKey"} if auth == "ACCESS_KEY" else {"authType", "roleArn", "externalId"}
    else:
        required_fields = required[provider]
    missing = sorted(x for x in required_fields if not isinstance(value.get(x), str) or not value.get(x))
    if missing:
        raise ApiError(400, "VALIDATION_ERROR", "Missing or invalid credential fields.", [{"field": f"credentials.{x}", "reason": "required"} for x in missing])
    return value


def _validate(body: dict) -> tuple[str, str, list[str], str, dict | None]:
    if not isinstance(body, dict):
        _error("Request body must be an object.")
    unknown = set(body) - _ALLOWED
    if unknown:
        raise ApiError(400, "VALIDATION_ERROR", "Unknown field(s).", [{"field": x, "reason": "unsupported"} for x in sorted(unknown)])
    required = {"provider", "name", "externalAccountId", "regions", "mode"}
    missing = sorted(required - set(body))
    if missing:
        raise ApiError(400, "VALIDATION_ERROR", "Missing required fields.", [{"field": x, "reason": "required"} for x in missing])
    provider, name, external_id, regions, mode = body["provider"], body["name"], body["externalAccountId"], body["regions"], body["mode"]
    if provider not in _PROVIDERS:
        _error("Invalid provider.", "provider")
    if not isinstance(name, str) or not name.strip():
        _error("name must be a non-empty string.", "name")
    if not isinstance(external_id, str) or not external_id.strip():
        _error("externalAccountId must be a non-empty string.", "externalAccountId")
    if not isinstance(regions, list) or not all(isinstance(x, str) for x in regions):
        _error("regions must be a non-empty array of strings.", "regions")
    regions = [x.strip() for x in regions]
    if not regions or any(not x for x in regions):
        _error("regions must be a non-empty array of non-empty strings.", "regions")
    if mode not in _MODES:
        _error("Invalid mode.", "mode")
    creds = body.get("credentials")
    if mode == "LIVE" and creds is None:
        _error("credentials are required when mode=LIVE.", "credentials")
    if creds is not None:
        creds = _credentials(creds, provider)
    return provider, name.strip(), [x.strip() for x in regions], mode, creds


def _out(obj: CloudAccount, count: int) -> dict:
    return {
        "id": str(obj.id),
        "provider": obj.provider,
        "name": obj.name,
        "externalAccountId": obj.external_account_id,
        "regions": list(obj.regions or []),
        "mode": obj.mode,
        "status": obj.status,
        "lastSyncedAt": iso(obj.last_synced_at),
        "resourceCount": count,
    }


async def _resource_count(db: AsyncSession, account_id: UUID) -> int:
    return int((await db.execute(select(func.count(Resource.id)).where(Resource.cloud_account_id == account_id))).scalar_one())


@router.get("/cloud-accounts")
async def list_cloud_accounts(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require("resources.read")),
):
    rows = (await db.execute(select(CloudAccount).order_by(CloudAccount.name.asc()))).scalars().all()
    data = [_out(x, await _resource_count(db, x.id)) for x in rows]
    return {"success": True, "data": data}


@router.post("/cloud-accounts", status_code=201)
async def create_cloud_account(
    body: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require("accounts.manage")),
):
    provider, name, regions, mode, creds = _validate(body)
    obj = CloudAccount(
        provider=provider,
        name=name,
        external_account_id=body["externalAccountId"].strip(),
        regions=regions,
        credentials_encrypted=encrypt_credentials(creds) if creds is not None else None,
        mode=mode,
        status="SYNCING",
        last_synced_at=None,
    )
    db.add(obj)
    await db.flush()

    if mode == "LIVE":
        try:
            outcome = await use("adapters").get(obj).validate_credentials(obj)
        except Exception as exc:
            await db.rollback()
            raise ApiError(502, "PROVIDER_ERROR", "Cloud provider credential validation failed.") from exc
        if not outcome.ok:
            await db.rollback()
            raise ApiError(400, "VALIDATION_ERROR", outcome.message or "Cloud provider credentials are invalid.")

    try:
        await use("ingestion").sync_account(obj.id)
    except Exception as exc:
        await db.rollback()
        raise ApiError(502, "PROVIDER_ERROR", "Initial cloud account sync failed.") from exc

    after = _out(obj, 0)
    await use("audit").write(
        db, actor_id=actor.id, action="CREATE_CLOUD_ACCOUNT", entity_type="CLOUD_ACCOUNT", entity_id=obj.id,
        before=None, after=after,
    )
    await db.commit()
    return {"success": True, "data": after}


@router.post("/cloud-accounts/{account_id}/sync")
async def sync_cloud_account(
    account_id: UUID,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require("accounts.manage")),
):
    obj = (await db.execute(select(CloudAccount).where(CloudAccount.id == account_id))).scalar_one_or_none()
    if not obj:
        raise ApiError(404, "NOT_FOUND", "Cloud account not found.")
    try:
        await use("ingestion").sync_account(obj.id)
    except Exception as exc:
        raise ApiError(502, "PROVIDER_ERROR", "Cloud account sync failed.") from exc
    await use("audit").write(
        db, actor_id=actor.id, action="SYNC_CLOUD_ACCOUNT", entity_type="CLOUD_ACCOUNT", entity_id=obj.id,
        before=_out(obj, await _resource_count(db, obj.id)), after={"status": "SYNCING"},
    )
    await db.commit()
    return {"success": True, "data": {"status": "SYNCING"}}


@router.delete("/cloud-accounts/{account_id}")
async def delete_cloud_account(
    account_id: UUID,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require("accounts.manage")),
):
    obj = (await db.execute(select(CloudAccount).where(CloudAccount.id == account_id))).scalar_one_or_none()
    if not obj:
        raise ApiError(404, "NOT_FOUND", "Cloud account not found.")
    before = _out(obj, await _resource_count(db, obj.id))
    await db.delete(obj)
    await db.flush()
    await use("audit").write(
        db, actor_id=actor.id, action="DELETE_CLOUD_ACCOUNT", entity_type="CLOUD_ACCOUNT", entity_id=account_id,
        before=before, after=None,
    )
    await db.commit()
    return {"success": True, "data": {"deleted": True}}
