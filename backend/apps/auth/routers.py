from fastapi import APIRouter, Request

from .schemas import LoginPayload, RefreshPayload
from .views import login_view, refresh_session_view

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
