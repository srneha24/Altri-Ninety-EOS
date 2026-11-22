from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
from conf.app_vars import ACCESS_TTL, JWT_ALGO, JWT_SECRET, REFRESH_TTL


def _create_token(sub: str, token_type: str, ttl: timedelta) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": sub,
        "type": token_type,
        "iat": now,
        "exp": now + ttl,
        "jti": uuid4().hex,  # needed for revocation / rotation tracking
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def _create_access_token(sub: str) -> str:
    return _create_token(sub, "access", ACCESS_TTL)


def _create_refresh_token(sub: str) -> str:
    return _create_token(sub, "refresh", REFRESH_TTL)


def decode_token(token: str, expected_type: str) -> dict:
    payload = jwt.decode(
        token,
        JWT_SECRET,
        algorithms=[JWT_ALGO],
        options={"require": ["exp", "sub", "type", "jti"]},
    )
    if payload["type"] != expected_type:
        raise jwt.InvalidTokenError
    return payload


def get_tokens(sub: str) -> dict:
    return {
        "access_token": _create_access_token(sub),
        "refresh_token": _create_refresh_token(sub),
        "token_type": "bearer",
    }
