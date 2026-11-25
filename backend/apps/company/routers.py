from conf.permissions import HasAccessToTeam
from fastapi import APIRouter, Depends, Path, Request

from .views import get_team_members_view

router = APIRouter(
    prefix="/company",
    tags=["company"],
    responses={404: {"description": "Not found"}},
    dependencies=[Depends(HasAccessToTeam())],
)


@router.get("/teams/{team_id}/members")
async def get_team_members(_request: Request, team_id: str = Path(...)):
    return await get_team_members_view(team_id=team_id)
