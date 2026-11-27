from conf.permissions import IsAuthenticated
from fastapi import APIRouter, Depends, Request

from .schemas import LoginPayload, RefreshPayload
from .views import (
    get_current_user_view,
    get_user_teams_view,
    login_view,
    refresh_session_view,
    server_now_view,
)

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={404: {"description": "Not found"}},
)


@router.post("/login")
async def login(_request: Request, payload: LoginPayload):
    return await login_view(payload=payload)


@router.post("/refresh")
async def refresh_session(_request: Request, payload: RefreshPayload):
    return await refresh_session_view(payload=payload)


@router.get("/me", dependencies=[Depends(IsAuthenticated())])
async def get_current_user(request: Request):
    return await get_current_user_view(user_id=request.state.user)


@router.get("/teams", dependencies=[Depends(IsAuthenticated())])
async def get_user_teams(request: Request):
    return await get_user_teams_view(user_id=request.state.user)


@router.get("/server-now")
async def server_now(_request: Request):
    return await server_now_view()
