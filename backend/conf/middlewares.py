import jwt
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from utils.log import Log
from utils.tokens import decode_token

from conf.app_vars import PUBLIC_PATHS


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Middleware to handle OAuth2 authentication."""

    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS" or request.url.path in PUBLIC_PATHS:
            return await call_next(request)

        scheme, _, token = request.headers.get("authorization", "").partition(" ")
        try:
            if scheme.lower() != "bearer" or not token:
                raise jwt.InvalidTokenError
            payload = decode_token(token, "access")
            # Authenticate user
            request.state.user = payload["sub"]
            request.state.is_authenticated = True
        except jwt.PyJWTError:
            Log.warning(message="Invalid or missing token")
            request.state.is_authenticated = False

        return await call_next(request)
