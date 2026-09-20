from datetime import timedelta
from uuid import UUID, uuid4
import jwt
from argon2 import PasswordHasher
from cryptography.fernet import Fernet
from app.core.config import settings
from app.core.errors import ApiError
from app.core.util import utcnow

_hasher = PasswordHasher()

def hash_password(raw: str) -> str:
    return _hasher.hash(raw)

def verify_password(raw: str, hashed: str) -> bool:
    try:
        return _hasher.verify(hashed, raw)
    except Exception:
        return False

def create_access_token(user_id: UUID, role: str) -> tuple[str, int]:
    expires = utcnow() + timedelta(minutes=settings.access_token_ttl_minutes)
    token = jwt.encode({'sub': str(user_id), 'role': role, 'exp': expires, 'jti': str(uuid4())}, settings.jwt_secret, algorithm='HS256')
    return token, int((expires - utcnow()).total_seconds())

def create_refresh_token(user_id: UUID) -> tuple[str, UUID, object]:
    jti = uuid4(); expires = utcnow() + timedelta(days=settings.refresh_token_ttl_days)
    token = jwt.encode({'sub': str(user_id), 'exp': expires, 'jti': str(jti), 'kind': 'refresh'}, settings.jwt_secret, algorithm='HS256')
    return token, jti, expires

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=['HS256'])
    except Exception as exc:
        raise ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired token') from exc

def encrypt_credentials(data: dict) -> str:
    return Fernet(settings.encryption_key.encode()).encrypt(__import__('json').dumps(data).encode()).decode()

def decrypt_credentials(blob: str) -> dict:
    import json
    return json.loads(Fernet(settings.encryption_key.encode()).decrypt(blob.encode()).decode())
