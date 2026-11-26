import jwt
from fastapi import Request
from models import User
from starlette.middleware.base import BaseHTTPMiddleware
from tortoise.exceptions import DoesNotExist
from utils.log import Log
from utils.tokens import decode_token

from conf.settings import PUBLIC_PATHS


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
            try:
                user_id = payload["sub"]
                user = await User.get(id=user_id)
                request.state.user = user_id
                request.state.user_role = user.role
                request.state.is_authenticated = True
            except DoesNotExist:
                Log.warning(message="User does not exist")
                request.state.is_authenticated = False
        except jwt.PyJWTError:
            Log.warning(message="Invalid or missing token")
            request.state.is_authenticated = False

        return await call_next(request)
