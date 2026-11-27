from datetime import UTC, date, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Any
from zoneinfo import ZoneInfo

from utils.clock import DEFAULT_TZ


def round_half_up_int(value: float | Decimal) -> int:
    """Round a numeric value to the nearest integer using half-up rounding."""
    return int(Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))  # noqa: FURB157


def round_half_up_1dp(value: float | Decimal) -> float:
    """Round a numeric value to 1 decimal place using half-up rounding."""
    return float(Decimal(str(value)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))


def get_company_week_bounds(
    day: date, tz_name: str = DEFAULT_TZ
) -> tuple[date, datetime]:
    """Return (week_start_monday, next_week_start_utc) for the week containing `day`."""
    tz = ZoneInfo(tz_name)
    week_start = day - timedelta(days=day.weekday())
    next_week_start = week_start + timedelta(days=7)
    next_week_start_local = datetime(
        next_week_start.year,
        next_week_start.month,
        next_week_start.day,
        0,
        0,
        0,
        tzinfo=tz,
    )
    return week_start, next_week_start_local.astimezone(UTC)


def compute_measurable_status(
    goal: dict[str, Any],
    score_value: float | None,
    week_start: date,
    current_week_start: date,
) -> str:
    """Compute Measurable status ('on_track', 'off_track', or 'pending')."""
    if score_value is None:
        return "pending" if week_start >= current_week_start else "off_track"

    goal_type = goal.get("type")
    if goal_type == "at_least":
        on_track = score_value >= goal["value"]
    elif goal_type == "at_most":
        on_track = score_value <= goal["value"]
    elif goal_type == "between":
        on_track = goal["min"] <= score_value <= goal["max"]
    elif goal_type == "exactly":
        on_track = score_value == goal["value"]
    else:
        raise ValueError(f"Unknown goal type: {goal_type!r}")
    return "on_track" if on_track else "off_track"


def compute_todo_completion(
    todos: list[dict[str, Any]],
    week_start: date,
    week_end_utc: datetime,
    tz_name: str = DEFAULT_TZ,
) -> dict[str, Any] | None:
    """Compute To-Do completion metrics for a given week, or None if 0 due."""
    tz = ZoneInfo(tz_name)
    due_in_week = [
        todo
        for todo in todos
        if (todo["due_date"] - timedelta(days=todo["due_date"].weekday())) == week_start
    ]
    if not due_in_week:
        return None

    done_on_time = 0
    for todo in due_in_week:
        done_at: datetime | None = todo.get("done_at")
        if done_at is not None and done_at.astimezone(tz) < week_end_utc.astimezone(
            tz
        ):
            done_on_time += 1

    due_count = len(due_in_week)
    rate_percent = round_half_up_int(
        (Decimal(done_on_time) / Decimal(due_count)) * Decimal(100)
    )
    meets_target = Decimal(done_on_time) * Decimal(10) >= Decimal(due_count) * Decimal(
        9
    )
    return {
        "due": due_count,
        "done": done_on_time,
        "rate_percent": rate_percent,
        "meets_target": meets_target,
    }


def compute_rock_status(
    seeded_status: str,
    milestones: list[dict[str, Any]],
    today: date,
) -> str:
    """Compute Rock status ('complete', 'off_track', or 'on_track')."""
    if seeded_status == "complete":
        return "complete"
    if seeded_status == "off_track":
        return "off_track"
    for milestone in milestones:
        if not milestone.get("done") and milestone["due_date"] < today:
            return "off_track"
    return "on_track"


def compute_rock_progress(
    seeded_status: str,
    milestones: list[dict[str, Any]],
) -> int:
    """Compute Rock progress percentage (whole percent, rounded half up)."""
    if not milestones:
        return 100 if seeded_status == "complete" else 0
    completed = sum(1 for milestone in milestones if milestone.get("done"))
    return round_half_up_int(
        (Decimal(completed) / Decimal(len(milestones))) * Decimal(100)
    )


def sort_issues(issues: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Sort issues by priority 5..1 (None last), then oldest created_at first."""
    return sorted(
        issues,
        key=lambda issue: (
            issue.get("priority") is None,
            -(issue.get("priority") or 0),
            issue["created_at"],
        ),
    )


def compute_meeting_rating(ratings: list[int | None]) -> float | None:
    """Compute average meeting rating rounded half-up to 1 decimal, or None."""
    submitted = [rating for rating in ratings if rating is not None]
    if not submitted:
        return None
    avg = Decimal(sum(submitted)) / Decimal(len(submitted))
    return round_half_up_1dp(avg)
