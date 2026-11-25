from typing import Annotated

from conf.permissions import HasAccessToTeam
from fastapi import APIRouter, Depends, Path, Query, Request

from .schemas import IssuesParams, RockParams, ScorecardParams, TodoParams
from .views import (
    get_issues_view,
    get_quarterly_rocks_view,
    get_scorecard_view,
    get_todos_view,
)

router = APIRouter(
    prefix="/traction",
    tags=["traction"],
    responses={404: {"description": "Not found"}},
    dependencies=[Depends(HasAccessToTeam())],
)


@router.get("/teams/{team_id}/scorecard")
async def get_scorecard(
    _reqeust: Request,
    params: Annotated[ScorecardParams, Query()],
    team_id: str = Path(...),
):
    return await get_scorecard_view(team_id=team_id, params=params)


@router.get("/teams/{team_id}/issues")
async def get_issues(
    _request: Request,
    params: Annotated[IssuesParams, Query()],
    team_id: str = Path(...),
):
    return await get_issues_view(team_id=team_id, params=params)


@router.get("/teams/{team_id}/todos")
async def get_todos(
    _request: Request,
    params: Annotated[TodoParams, Query()],
    team_id: str = Path(...),
):
    return await get_todos_view(team_id=team_id, params=params)


@router.get("/teams/{team_id}/quarterly-rocks")
async def get_quarterly_rocks(
    _request: Request, params: Annotated[RockParams, Query()], team_id: str = Path(...)
):
    return await get_quarterly_rocks_view(team_id=team_id, params=params)
