from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from models import Membership, Team, User
from utils.log import Log

bearer_scheme = HTTPBearer(auto_error=False)


class IsAuthenticated:
    """Permission Class For Authencation of Users"""

    async def __call__(self, request: Request, _=Depends(bearer_scheme)):  # noqa: B008
        if not request.state.is_authenticated:
            Log.warning(message=f"Authentication Failed | path: {request.url.path}")
            raise HTTPException(
                detail="Authentication Failed! Invalid Credentials!",
                status_code=401,
                headers={"WWW-Authenticate": "Bearer"},
            )


class IsAdminOrTeamMember:
    """Permission Class For Admin or Team Member Users. MUST be used with HasAccessToTeam."""

    async def __call__(self, request: Request):
        if request.state.user_role not in (User.Role.ADMIN, User.Role.TEAM_MEMBER):
            raise HTTPException(detail="Access Denied", status_code=403)


class HasAccessToTeam(IsAuthenticated):
    async def __call__(self, request: Request, _=Depends(bearer_scheme)):  # noqa: B008
        await super().__call__(request, _)

        user_id = request.state.user
        team_id = request.path_params["team_id"]

        if not await Team.filter(id=team_id).exists():
            raise HTTPException(detail="Team not found", status_code=400)
        elif (
            request.state.user_role != User.Role.ADMIN
            and not await Membership.filter(user_id=user_id, team_id=team_id).exists()
        ):
            raise HTTPException(detail="Access Denied", status_code=403)
