from fastapi import HTTPException, Request
from models import User
from utils.log import Log


class IsAuthenticated:
    """Permission Class For Authencation of Users"""

    async def __call__(self, request: Request):
        if not request.state.is_authenticated:
            Log.warning(message=f"Authentication Failed | path: {request.url.path}")
            raise HTTPException(
                detail="Authentication Failed! Invalid Credentials!",
                status_code=401,
                headers={"WWW-Authenticate": "Bearer"},
            )


class IsAdmin:
    """Permission Class For Admin Users"""

    async def __call__(self, request: Request):
        if not request.state.is_authenticated:
            Log.warning(message=f"Authentication Failed | path: {request.url.path}")
            raise HTTPException(
                detail="Authentication Failed! Invalid Credentials!",
                status_code=401,
                headers={"WWW-Authenticate": "Bearer"},
            )
        elif request.state.user_role != User.Role.ADMIN:
            Log.warning(
                message=f"User role not allowed to access | path: {request.url.path}"
            )
            raise HTTPException(detail="User Not Allowed", status_code=403)


class IsAdminOrTeamMember:
    """Permission Class For Admin or Team Member Users"""

    async def __call__(self, request: Request):
        if not request.state.is_authenticated:
            Log.warning(message=f"Authentication Failed | path: {request.url.path}")
            raise HTTPException(
                detail="Authentication Failed! Invalid Credentials!",
                status_code=401,
                headers={"WWW-Authenticate": "Bearer"},
            )
        elif request.state.user_role not in (User.Role.ADMIN, User.Role.TEAM_MEMBER):
            Log.warning(
                message=f"User role not allowed to access | path: {request.url.path}"
            )
            raise HTTPException(detail="User Not Allowed", status_code=403)
