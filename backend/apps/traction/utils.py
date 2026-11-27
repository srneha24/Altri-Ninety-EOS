from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from models import Issue, Measurable, Meeting, MeetingAttendee, Rock, Score, Todo
from tortoise.expressions import Q
from utils.clock import get_cached_tz
from utils.json_actions import simplify_json

from .rules import compute_measurable_status, compute_meeting_rating
from .schemas import (
    IssueResponse,
    MeetingAttendeeResponse,
    TodoResponse,
)


def _meeting_event_filter(
    windows: list[tuple[datetime, datetime]], timestamp_fields: tuple[str, ...]
) -> Q:
    event_filter: Q | None = None
    for started_at, ended_at in windows:
        for field in timestamp_fields:
            condition = Q(**{f"{field}__range": (started_at, ended_at)})
            event_filter = (
                condition if event_filter is None else event_filter | condition
            )

    if event_filter is None:
        raise ValueError("At least one ended meeting is required")
    return event_filter


async def build_meeting_summary(meeting: Meeting) -> dict[str, Any]:
    ended_at = meeting.ended_at
    if ended_at is None:
        raise ValueError(f"Cannot build a summary for ongoing meeting {meeting.id}")

    team_id = meeting.team_id
    started_at = meeting.started_at
    tz_name = get_cached_tz(team_id=team_id)
    started_local_date = started_at.astimezone(ZoneInfo(tz_name)).date()
    reviewed_week = started_local_date - timedelta(
        days=started_local_date.weekday() + 7
    )
    window = [(started_at, ended_at)]

    issues = (
        await Issue.filter(team_id=team_id)
        .filter(_meeting_event_filter(window, ("created_at", "solved_at")))
        .select_related("owner")
    )
    todos = (
        await Todo.filter(team_id=team_id)
        .filter(_meeting_event_filter(window, ("created_at", "done_at")))
        .select_related("owner", "source_issue")
    )
    attendees = (
        await MeetingAttendee.filter(meeting_id=meeting.id)
        .order_by("joined_at")
        .select_related("user")
    )
    measurables = await Measurable.filter(team_id=team_id).order_by("id")
    scores = await Score.filter(measurable__team_id=team_id, week_start=reviewed_week)

    rock_source_ids = []
    todo_source_ids = []
    for issue in issues:
        if issue.source:
            if "rock_id" in issue.source:
                rock_source_ids.append(issue.source["rock_id"])
            elif "todo_id" in issue.source:
                todo_source_ids.append(issue.source["todo_id"])

    rocks_by_id: dict[str, str] = {}
    if rock_source_ids:
        rocks_by_id = {
            rock.id: rock.title
            for rock in await Rock.filter(team_id=team_id, id__in=set(rock_source_ids))
        }
    source_todos_by_id: dict[str, str] = {}
    if todo_source_ids:
        source_todos_by_id = {
            todo.id: todo.title
            for todo in await Todo.filter(team_id=team_id, id__in=set(todo_source_ids))
        }
    measurables_by_id = {measurable.id: measurable.name for measurable in measurables}
    for issue in issues:
        if issue.source:
            if "measurable_id" in issue.source:
                issue.source["title"] = measurables_by_id.get(
                    issue.source.get("measurable_id")
                )
            elif "rock_id" in issue.source:
                issue.source["title"] = rocks_by_id.get(issue.source.get("rock_id"))
            elif "todo_id" in issue.source:
                issue.source["title"] = source_todos_by_id.get(
                    issue.source.get("todo_id")
                )

    meeting_issues_created = [
        issue for issue in issues if started_at <= issue.created_at <= ended_at
    ]
    meeting_issues_solved = [
        issue
        for issue in issues
        if issue.solved_at is not None and started_at <= issue.solved_at <= ended_at
    ]
    meeting_todos_created = [
        todo for todo in todos if started_at <= todo.created_at <= ended_at
    ]
    meeting_todos_done = [
        todo
        for todo in todos
        if todo.done_at is not None and started_at <= todo.done_at <= ended_at
    ]

    meeting_issues_created.sort(key=lambda issue: issue.created_at)
    meeting_issues_solved.sort(key=lambda issue: issue.solved_at or ended_at)
    meeting_todos_created.sort(key=lambda todo: todo.created_at)
    meeting_todos_done.sort(key=lambda todo: todo.done_at or ended_at)

    avg_rating = compute_meeting_rating([attendee.rating for attendee in attendees])

    current_local_date = started_local_date
    current_week_start = current_local_date - timedelta(days=current_local_date.weekday())
    scores_by_measurable_id = {score.measurable_id: score for score in scores}
    measurable_summaries = []
    for measurable in measurables:
        score = scores_by_measurable_id.get(measurable.id)
        status = compute_measurable_status(
            measurable.goal,
            score.value if score is not None else None,
            reviewed_week,
            current_week_start,
        )

        measurable_summaries.append(
            {
                "id": measurable.id,
                "name": measurable.name,
                "unit": measurable.unit,
                "goal": measurable.goal,
                "score": score.value if score is not None else None,
                "status": status,
            }
        )

    return {
        "id": meeting.id,
        "reviewed_week": reviewed_week.isoformat(),
        "started_at": started_at.isoformat(),
        "ids_started_at": (
            meeting.ids_started_at.isoformat() if meeting.ids_started_at else None
        ),
        "conclude_started_at": (
            meeting.conclude_started_at.isoformat()
            if meeting.conclude_started_at
            else None
        ),
        "ended_at": ended_at.isoformat(),
        "duration_seconds": int((ended_at - started_at).total_seconds()),
        "average_rating": avg_rating,
        "facilitator": {
            "id": meeting.facilitator.id,
            "name": meeting.facilitator.name,
        },
        "measurables": measurable_summaries,
        "issues": {
            "created": [
                simplify_json(IssueResponse.model_validate(issue).model_dump())
                for issue in meeting_issues_created
            ],
            "solved": [
                simplify_json(IssueResponse.model_validate(issue).model_dump())
                for issue in meeting_issues_solved
            ],
        },
        "todos": {
            "created": [
                simplify_json(TodoResponse.model_validate(todo).model_dump())
                for todo in meeting_todos_created
            ],
            "done": [
                simplify_json(TodoResponse.model_validate(todo).model_dump())
                for todo in meeting_todos_done
            ],
        },
        "attendees": [
            simplify_json(MeetingAttendeeResponse.model_validate(attendee).model_dump())
            for attendee in attendees
        ],
    }


async def save_meeting_summary(meeting_id: str) -> None:
    meeting = await Meeting.get(id=meeting_id).select_related("facilitator", "team")
    meeting.summary = await build_meeting_summary(meeting)
    await meeting.save(update_fields=["summary"])
