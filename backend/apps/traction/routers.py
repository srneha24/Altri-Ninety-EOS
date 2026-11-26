from typing import Annotated

from conf.permissions import HasAccessToTeam, IsAdminOrTeamMember
from fastapi import APIRouter, Depends, Path, Query, Request

from .schemas import (
    IssueCreatePayload,
    IssuesParams,
    IssueUpdatePayload,
    RockParams,
    ScorecardParams,
    ScoreUpdatePayload,
    TodoCreatePayload,
    TodoParams,
    TodoUpdatePayload,
)
from .views import (
    create_issue_view,
    create_todo_view,
    get_issues_view,
    get_quarterly_rocks_view,
    get_scorecard_view,
    get_todos_view,
    update_issue_view,
    update_measurable_score_view,
    update_todo_view,
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


@router.patch(
    "/teams/{team_id}/scores/{score_id}", dependencies=[Depends(IsAdminOrTeamMember())]
)
async def update_measurable_score(
    _request: Request,
    payload: ScoreUpdatePayload,
    team_id: str = Path(...),
    score_id: str = Path(...),
):
    return await update_measurable_score_view(score_id=score_id, payload=payload)


@router.get("/teams/{team_id}/issues")
async def get_issues(
    _request: Request,
    params: Annotated[IssuesParams, Query()],
    team_id: str = Path(...),
):
    return await get_issues_view(team_id=team_id, params=params)


@router.post("/teams/{team_id}/issues", dependencies=[Depends(IsAdminOrTeamMember())])
async def create_issue(
    request: Request, payload: IssueCreatePayload, team_id: str = Path(...)
):
    return await create_issue_view(
        team_id=team_id, user_id=request.state.user, payload=payload
    )


@router.patch(
    "/teams/{team_id}/issues/{issue_id}", dependencies=[Depends(IsAdminOrTeamMember())]
)
async def update_issue(
    _request: Request,
    payload: IssueUpdatePayload,
    team_id: str = Path(...),
    issue_id: str = Path(...),
):
    return await update_issue_view(issue_id=issue_id, payload=payload)


@router.get("/teams/{team_id}/todos")
async def get_todos(
    _request: Request,
    params: Annotated[TodoParams, Query()],
    team_id: str = Path(...),
):
    return await get_todos_view(team_id=team_id, params=params)


@router.post("/teams/{team_id}/todos", dependencies=[Depends(IsAdminOrTeamMember())])
async def create_todo(
    _request: Request, payload: TodoCreatePayload, team_id: str = Path(...)
):
    return await create_todo_view(team_id=team_id, payload=payload)


@router.patch(
    "/teams/{team_id}/todos/{todo_id}", dependencies=[Depends(IsAdminOrTeamMember())]
)
async def update_todo(
    _request: Request,
    payload: TodoUpdatePayload,
    team_id: str = Path(...),
    todo_id: str = Path(...),
):
    return await update_todo_view(todo_id=todo_id, payload=payload)


@router.get("/teams/{team_id}/quarterly-rocks")
async def get_quarterly_rocks(
    _request: Request, params: Annotated[RockParams, Query()], team_id: str = Path(...)
):
    return await get_quarterly_rocks_view(team_id=team_id, params=params)
