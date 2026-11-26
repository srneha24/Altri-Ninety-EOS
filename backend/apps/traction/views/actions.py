import asyncio
from datetime import date, timedelta

from conf.responses import CustomJSONResponse
from fastapi import HTTPException
from models import Issue, Measurable, Membership, Rock, Score, Todo, User
from tortoise.exceptions import DoesNotExist, IntegrityError, ValidationError
from tortoise.models import Model
from tortoise.query_utils import Prefetch
from utils.clock import get_app_now, get_app_today
from utils.json_actions import simplify_json

from ..rules import compute_rock_status
from ..schemas import (
    IssueCreatePayload,
    IssueResponse,
    IssuesParams,
    IssueUpdatePayload,
    QuarterlyRockParams,
    QuarterlyRockResponse,
    ScorecardParams,
    ScorecardResponse,
    ScoreResponse,
    ScoreUpdatePayload,
    TodoCreatePayload,
    TodoParams,
    TodoResponse,
    TodoUpdatePayload,
)


async def get_scorecard_view(team_id: str, params: ScorecardParams):
    scores = Score.filter(
        week_start__gte=params.start_date,
        week_start__lte=params.end_date,
    ).order_by("week_start")

    query = (
        Measurable.filter(team_id=team_id)
        .prefetch_related(
            Prefetch(
                "scores",
                queryset=scores,
            )
        )
        .select_related("owner")
        .order_by("id")
    )

    results = await query
    return CustomJSONResponse(
        content={
            "data": [
                simplify_json(ScorecardResponse.model_validate(result).model_dump())
                for result in results
            ]
        }
    )


async def update_measurable_score_view(
    team_id: str, score_id: str, payload: ScoreUpdatePayload
):
    try:
        score = await Score.get(id=score_id, measurable__team_id=team_id)
        score.value = payload.value
        await score.save()

        return CustomJSONResponse(
            message="Score Updated",
            content={
                "data": simplify_json(ScoreResponse.model_validate(score).model_dump())
            },
        )
    except DoesNotExist:
        raise HTTPException(detail="Score Not found", status_code=404)


async def upsert_measurable_score_view(
    team_id: str,
    measurable_id: str,
    week_start: date,
    payload: ScoreUpdatePayload,
):
    if week_start.weekday() != 0:
        raise HTTPException(detail="week_start must be a Monday", status_code=400)

    if not await Measurable.filter(id=measurable_id, team_id=team_id).exists():
        raise HTTPException(detail="Measurable Not Found", status_code=404)

    score, created = await Score.get_or_create(
        measurable_id=measurable_id,
        week_start=week_start,
        defaults={"value": payload.value},
    )
    if not created:
        score.value = payload.value
        await score.save()

    return CustomJSONResponse(
        message="Score Saved",
        content={
            "data": simplify_json(ScoreResponse.model_validate(score).model_dump())
        },
        status_code=201 if created else 200,
    )


async def get_issues_view(team_id: str, params: IssuesParams):
    query = Issue.filter(team_id=team_id).select_related("owner")

    if params.status is IssuesParams.Status.SOLVED:
        query = query.filter(solved_at__isnull=False)
    elif params.status is IssuesParams.Status.UNSOLVED:
        query = query.filter(solved_at__isnull=True)

    if params.owner_id:
        query = query.filter(owner_id=params.owner_id)

    if params.priority is not None:
        query = query.filter(priority=params.priority)

    ordering = [params.order_by.value]
    if "priority" in ordering[0]:
        ordering.append("created_at")

    query_results = await IssueResponse.from_queryset(query.order_by(*ordering))

    measurable_ids = []
    rock_ids = []
    todo_ids = []
    for result in query_results:
        if result.source:
            if "measurable_id" in result.source:
                measurable_ids.append(result.source.get("measurable_id"))
            elif "rock_id" in result.source:
                rock_ids.append(result.source.get("rock_id"))
            else:
                todo_ids.append(result.source.get("todo_id"))

    measurabales = {
        measurable.id: measurable.name
        for measurable in await Measurable.filter(id__in=measurable_ids)
    }
    rocks = {rock.id: rock.title for rock in await Rock.filter(id__in=rock_ids)}
    todos = {todo.id: todo.title for todo in await Todo.filter(id__in=todo_ids)}

    results = []
    for result in query_results:
        if result.source:
            if "measurable_id" in result.source:
                result.source["title"] = measurabales.get(
                    result.source.get("measurable_id")
                )
            elif "rock_id" in result.source:
                result.source["title"] = rocks.get(result.source.get("rock_id"))
            else:
                result.source["title"] = todos.get(result.source.get("todo_id"))

        results.append(simplify_json(IssueResponse.model_validate(result).model_dump()))

    return CustomJSONResponse(content=results)


_source_issue_locks: dict[tuple, asyncio.Lock] = {}


async def create_issue_view(team_id: str, user_id: str, payload: IssueCreatePayload):
    if payload.source:
        source_model_mapping: dict[str, Model] = {
            "measurable_id": Measurable,
            "rock_id": Rock,
            "todo_id": Todo,
        }
        check_condition = {}
        issue_source_key = ""
        source_id = ""
        if payload.source.measurable_id:
            check_condition.update(
                {
                    "measurable_id": payload.source.measurable_id,
                    "week_start": payload.source.week_start.isoformat(),
                }
            )
            issue_source_key = "measurable_id"
            source_id = payload.source.measurable_id
        elif payload.source.rock_id:
            check_condition["rock_id"] = payload.source.rock_id
            issue_source_key = "rock_id"
            source_id = payload.source.rock_id
        else:
            check_condition["todo_id"] = payload.source.todo_id
            issue_source_key = "todo_id"
            source_id = payload.source.todo_id

        lock_key = (team_id, tuple(sorted(check_condition.items())))
        lock = _source_issue_locks.setdefault(lock_key, asyncio.Lock())
        async with lock:
            existing_issue = (
                await Issue.filter(
                    team_id=team_id,
                    solved_at__isnull=True,
                    source__contains=check_condition,
                )
                .select_related("owner")
                .first()
            )
            if existing_issue:
                return await _serialize_existing_source_issue(
                    existing_issue=existing_issue,
                    team_id=team_id,
                    source_model_mapping=source_model_mapping,
                    issue_source_key=issue_source_key,
                )
            try:
                return await _create_issue_record(
                    team_id=team_id,
                    user_id=user_id,
                    payload=payload,
                    source_model_mapping=source_model_mapping,
                    issue_source_key=issue_source_key,
                    source_id=source_id,
                )
            except IntegrityError:
                existing_issue = (
                    await Issue.filter(
                        team_id=team_id,
                        solved_at__isnull=True,
                        source__contains=check_condition,
                    )
                    .select_related("owner")
                    .first()
                )
                if existing_issue:
                    return await _serialize_existing_source_issue(
                        existing_issue=existing_issue,
                        team_id=team_id,
                        source_model_mapping=source_model_mapping,
                        issue_source_key=issue_source_key,
                    )
                raise
    return await _create_issue_record(
        team_id=team_id,
        user_id=user_id,
        payload=payload,
    )


async def _serialize_existing_source_issue(
    existing_issue: Issue,
    team_id: str,
    source_model_mapping: dict[str, Model],
    issue_source_key: str,
):
    source_model = source_model_mapping.get(issue_source_key)
    source = await source_model.get(id=existing_issue.source.get(issue_source_key))
    if source.team_id != team_id:
        raise HTTPException(detail="source Does Not Belong To Team", status_code=400)
    existing_issue.source["title"] = (
        source.name if issue_source_key == "measurable_id" else source.title
    )
    return CustomJSONResponse(
        content={
            "data": simplify_json(
                IssueResponse.model_validate(existing_issue).model_dump()
            )
        }
    )


async def _create_issue_record(
    team_id: str,
    user_id: str,
    payload: IssueCreatePayload,
    source_model_mapping: dict[str, Model] | None = None,
    issue_source_key: str = "",
    source_id: str = "",
):
    if payload.source and source_model_mapping:  # noqa: SIM102
        if True:
            source_model = source_model_mapping.get(issue_source_key)
            try:
                source = await source_model.get(id=source_id)
                payload.title = (
                    f"{source.name}, week of {payload.source.week_start.strftime('%b %d')}"
                    if issue_source_key == "measurable_id"
                    else source.title
                )
            except DoesNotExist:
                raise HTTPException(detail="source Does Not Exist", status_code=400)

    try:
        issue = await Issue.create(
            title=payload.title,
            priority=payload.priority,
            source=(
                payload.source.model_dump(exclude_none=True, exclude_unset=True)
                if payload.source
                else None
            ),
            owner_id=user_id,
            team_id=team_id,
        )
        await issue.fetch_related("owner")
        if issue.source:
            issue.source["title"] = issue.title

        return CustomJSONResponse(
            content={
                "data": simplify_json(IssueResponse.model_validate(issue).model_dump())
            },
            status_code=201,
        )
    except ValidationError as e:
        raise HTTPException(detail=str(e), status_code=400)


async def update_issue_view(team_id: str, issue_id: str, payload: IssueUpdatePayload):
    try:
        issue = await Issue.get(id=issue_id, team_id=team_id).select_related("owner")

        update_payload = payload.model_dump(exclude_unset=True)
        if payload.resolution_note and not issue.solved_at:
            update_payload["solved_at"] = get_app_now()
        elif (
            "resolution_note" in payload.model_fields_set
            and payload.resolution_note is None
            and issue.solved_at
        ):
            raise HTTPException(
                detail="Solved issue cannot have null resolution_note", status_code=400
            )

        issue.update_from_dict(update_payload)
        await issue.save()

        if issue.source:
            if "measurable_id" in issue.source:
                source = await Measurable.get(id=issue.source.get("measurable_id"))
                issue.source["title"] = source.name
            elif "rock_id" in issue.source:
                source = await Rock.get(id=issue.source.get("rock_id"))
                issue.source["title"] = source.title
            else:
                source = await Todo.get(id=issue.source.get("todo_id"))
                issue.source["title"] = source.title

        return CustomJSONResponse(
            content={
                "data": simplify_json(IssueResponse.model_validate(issue).model_dump())
            }
        )
    except DoesNotExist:
        raise HTTPException(detail="Issue Not Found", status_code=404)


async def get_todos_view(team_id: str, params: TodoParams):
    query = Todo.filter(team_id=team_id).select_related("source_issue", "owner")

    if params.done is not None:
        if params.done:
            query = query.filter(done_at__isnull=False)
        else:
            query = query.filter(done_at__isnull=True)

    if params.issue_id:
        query = query.filter(source_issue_id=params.issue_id)

    if params.owner_id:
        query = query.filter(owner_id=params.owner_id)

    results = await TodoResponse.from_queryset(query.order_by(params.order_by.value))
    return CustomJSONResponse(
        content={"data": [simplify_json(result.model_dump()) for result in results]}
    )


async def create_todo_view(team_id: str, payload: TodoCreatePayload):
    try:
        user = await User.get(id=payload.owner_id)
        if user.role == User.Role.OBSERVER:
            raise HTTPException(detail="Observer Cannot Be owner", status_code=400)
        elif (
            user.role == User.Role.TEAM_MEMBER
            and not await Membership.filter(user=user, team_id=team_id).exists()
        ):
            raise HTTPException(detail="owner Does Not Belong To Team", status_code=400)
    except DoesNotExist:
        raise HTTPException(detail="Owner Does Not Exist", status_code=400)

    if payload.source_issue_id:
        try:
            await Issue.get(id=payload.source_issue_id, team_id=team_id)
        except DoesNotExist:
            raise HTTPException(detail="Issue Does Not Exist", status_code=400)

    todo = await Todo.create(
        title=payload.title,
        due_date=(await get_app_today(team_id=team_id)) + timedelta(days=7),
        source_issue_id=payload.source_issue_id,
        owner_id=payload.owner_id,
        team_id=team_id,
    )
    await todo.fetch_related("owner", "source_issue")
    return CustomJSONResponse(
        content={"data": simplify_json(TodoResponse.model_validate(todo).model_dump())},
        status_code=201,
    )


async def update_todo_view(team_id: str, todo_id: str, payload: TodoUpdatePayload):
    try:
        todo = await Todo.get(id=todo_id, team_id=team_id).select_related(
            "owner", "source_issue"
        )

        if payload.done:
            if todo.done_at:
                return CustomJSONResponse(
                    content={
                        "data": simplify_json(
                            TodoResponse.model_validate(todo).model_dump()
                        )
                    }
                )

            todo.done_at = get_app_now()
        else:
            todo.done_at = None

        await todo.save()

        return CustomJSONResponse(
            content={
                "data": simplify_json(TodoResponse.model_validate(todo).model_dump())
            }
        )
    except DoesNotExist:
        raise HTTPException(detail="Todo Not Found", status_code=404)


async def get_quarterly_rocks_view(team_id: str, params: QuarterlyRockParams):
    query = (
        Rock.filter(team_id=team_id, quarter=params.quarter)
        .select_related("owner")
        .prefetch_related("milestones")
    )

    if params.owner_id:
        query = query.filter(owner_id=params.owner_id)

    results = await query.order_by("created_at")
    if params.status:
        today = await get_app_today(team_id=team_id)
        results = [
            rock
            for rock in results
            if compute_rock_status(
                rock.status.value,
                [{"done": m.done, "due_date": m.due_date} for m in rock.milestones],
                today,
            )
            == params.status.value
        ]
    return CustomJSONResponse(
        content={
            "data": [
                simplify_json(QuarterlyRockResponse.model_validate(result).model_dump())
                for result in results
            ]
        }
    )
