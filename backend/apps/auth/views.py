from conf.responses import CustomJSONResponse
from fastapi import HTTPException
from jwt import InvalidTokenError
from models import User
from tortoise.exceptions import DoesNotExist
from utils.log import Log
from utils.tokens import decode_token, get_tokens

from .schemas import LoginPayload, RefreshPayload


async def login_view(payload: LoginPayload):
    try:
        user = await User.get(email=payload.email)
        tokens = get_tokens(sub=user.id)
        return CustomJSONResponse(content={"token": tokens})
    except DoesNotExist:
        raise HTTPException(detail="User not found", status_code=401)


async def refresh_session_view(payload: RefreshPayload):
    try:
        token_payload = decode_token(
            token=payload.refresh_token, expected_type="refresh"
        )
        sub = token_payload.get("sub")
        try:
            await User.get(id=sub)
            tokens = get_tokens(sub=sub)
            return CustomJSONResponse(content={"token": tokens})
        except DoesNotExist:
            Log.warning(
                message="Valid refresh token found with unknown sub", data={"sub": sub}
            )
            raise HTTPException(detail="Invalid token", status_code=400)
    except InvalidTokenError:
        raise HTTPException(detail="Invalid token", status_code=400)
