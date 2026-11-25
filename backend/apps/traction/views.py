from datetime import UTC, datetime

from conf.responses import CustomJSONResponse
from fastapi import HTTPException
from models import Issue, Measurable, Rock, Score, Todo
from tortoise.exceptions import DoesNotExist
from tortoise.query_utils import Prefetch
from utils.json_actions import simplify_json

from .schemas import (
    IssueResponse,
    IssuesParams,
    IssueUpdatePayload,
    QuarterlyRockResponse,
    RockParams,
    ScorecardParams,
    ScorecardResponse,
    ScoreResponse,
    ScoreUpdatePayload,
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
        Measurable.filter(
            team_id=team_id,
            scores__week_start__gte=params.start_date,
            scores__week_start__lte=params.end_date,
        )
        .distinct()
        .prefetch_related(
            Prefetch(
                "scores",
                queryset=scores,
            )
        )
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


async def update_measurable_score_view(score_id: str, payload: ScoreUpdatePayload):
    try:
        score = await Score.get(id=score_id)
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


async def update_issue_view(issue_id: str, payload: IssueUpdatePayload):
    try:
        issue = await Issue.get(id=issue_id).select_related("owner")

        update_payload = payload.model_dump(exclude_unset=True)
        if payload.resolution_note and not issue.solved_at:
            update_payload["solved_at"] = datetime.now(UTC)
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


async def update_todo_view(todo_id: str, payload: TodoUpdatePayload):
    try:
        todo = await Todo.get(id=todo_id).select_related("owner", "source_issue")

        if payload.done:
            if todo.done_at:
                return CustomJSONResponse(
                    content={
                        "data": simplify_json(
                            TodoResponse.model_validate(todo).model_dump()
                        )
                    }
                )

            todo.done_at = datetime.now(UTC)
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


async def get_quarterly_rocks_view(team_id: str, params: RockParams):
    query = (
        Rock.filter(team_id=team_id, quarter=params.quarter)
        .select_related("owner")
        .prefetch_related("milestones")
    )

    if params.status:
        query = query.filter(status=params.status)

    if params.owner_id:
        query = query.filter(owner_id=params.owner_id)

    results = await query.order_by("created_at")
    return CustomJSONResponse(
        content={
            "data": [
                simplify_json(QuarterlyRockResponse.model_validate(result).model_dump())
                for result in results
            ]
        }
    )
