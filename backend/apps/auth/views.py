from conf.responses import CustomJSONResponse
from fastapi import HTTPException
from jwt import InvalidTokenError
from models import Membership, Team, User
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


async def get_user_teams_view(user_id: str):
    user = await User.get(id=user_id)
    if user.role == User.Role.ADMIN:
        teams = await Team.all().values("id", "name")
    else:
        teams = await Membership.filter(user_id=user_id).values(
            id="team__id", name="team__name"
        )
    return CustomJSONResponse(content={"teams": teams})


async def get_current_user_view(user_id: str):
    try:
        user = await User.get(id=user_id)
    except DoesNotExist:
        raise HTTPException(detail="User not found", status_code=404)

    return CustomJSONResponse(
        content={
            "data": {
                "id": user.id,
                "name": user.name,
                "role": user.role.value,
            }
        }
    )
