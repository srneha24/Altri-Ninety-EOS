from typing import Annotated

from conf.permissions import HasAccessToTeam, IsAdminOrTeamMember
from fastapi import APIRouter, BackgroundTasks, Depends, Path, Query, Request

from .schemas import (
    IssueCreatePayload,
    IssuesParams,
    IssueUpdatePayload,
    MeetingRatingPayload,
    MeetingStatePayload,
    QuarterlyRockParams,
    ScorecardParams,
    ScoreUpdatePayload,
    TodoCreatePayload,
    TodoParams,
    TodoUpdatePayload,
)
from .views import (
    create_issue_view,
    create_todo_view,
    get_active_meeting_view,
    get_issues_view,
    get_meeting_attendees_view,
    get_meeting_events_view,
    get_meeting_summary_view,
    get_meeting_view,
    get_quarterly_rocks_view,
    get_scorecard_view,
    get_todos_view,
    join_meeting_view,
    list_meeting_summaries_view,
    meeting_state_view,
    rate_meeting_view,
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
    _request: Request,
    params: Annotated[QuarterlyRockParams, Query()],
    team_id: str = Path(...),
):
    return await get_quarterly_rocks_view(team_id=team_id, params=params)


@router.post(
    "/teams/{team_id}/meetings/state", dependencies=[Depends(IsAdminOrTeamMember())]
)
async def meeting_state(
    request: Request,
    payload: MeetingStatePayload,
    background_tasks: BackgroundTasks,
    team_id: str = Path(...),
):
    return await meeting_state_view(
        user_id=request.state.user,
        team_id=team_id,
        payload=payload,
        background_tasks=background_tasks,
    )


@router.get("/teams/{team_id}/meetings/summaries")
async def list_meeting_summaries(_request: Request, team_id: str = Path(...)):
    return await list_meeting_summaries_view(team_id=team_id)


@router.get("/teams/{team_id}/meetings/active")
async def get_active_meeting(_request: Request, team_id: str = Path(...)):
    return await get_active_meeting_view(team_id=team_id)


@router.get("/teams/{team_id}/meetings/{meeting_id}")
async def get_meeting(_request: Request, meeting_id: str = Path(...)):
    return await get_meeting_view(meeting_id=meeting_id)


@router.post("/teams/{team_id}/meetings/{meeting_id}/attendees")
async def join_meeting(request: Request, meeting_id: str = Path(...)):
    return await join_meeting_view(user_id=request.state.user, meeting_id=meeting_id)


@router.get("/teams/{team_id}/meetings/{meeting_id}/attendees")
async def get_meeting_attendees(request: Request, meeting_id: str = Path(...)):
    return await get_meeting_attendees_view(meeting_id=meeting_id)


@router.post(
    "/teams/{team_id}/meetings/{meeting_id}/ratings",
    dependencies=[Depends(IsAdminOrTeamMember())],
)
async def rate_meeting(
    request: Request, payload: MeetingRatingPayload, meeting_id: str = Path(...)
):
    return await rate_meeting_view(
        user_id=request.state.user, meeting_id=meeting_id, payload=payload
    )


@router.get("/teams/{team_id}/meetings/{meeting_id}/summary")
async def get_meeting_summary(
    _request: Request, team_id: str = Path(...), meeting_id: str = Path(...)
):
    return await get_meeting_summary_view(team_id=team_id, meeting_id=meeting_id)


@router.get("/teams/{team_id}/meetings/{meeting_id}/sse")
async def get_meeting_events(
    request: Request,
    team_id: str = Path(...),
    meeting_id: str = Path(...),
):
    return await get_meeting_events_view(
        request=request, team_id=team_id, meeting_id=meeting_id
    )
