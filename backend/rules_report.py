import argparse
import asyncio
import json
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from apps.traction.rules import (
    compute_measurable_status,
    compute_rock_progress,
    compute_rock_status,
    compute_todo_completion,
    get_company_week_bounds,
    sort_issues,
)
from apps.traction.utils import build_meeting_summary
from conf.database import TORTOISE_ORM
from models import (
    Issue,
    Measurable,
    Meeting,
    Milestone,
    Rock,
    Score,
    Team,
    Todo,
)
from tortoise import Tortoise
from utils.clock import freeze_app_now, get_app_now


def get_report_weeks(today: date) -> list[date]:
    """Return the 13 Mondays ending with the current week."""
    current_monday = today - timedelta(days=today.weekday())

    return [current_monday - timedelta(weeks=offset) for offset in reversed(range(13))]


async def build_team_report(team: Team, now) -> dict:
    """Build the rules report section for one team."""
    timezone = ZoneInfo(team.company.timezone)
    today = now.astimezone(timezone).date()
    current_week_start = today - timedelta(days=today.weekday())
    weeks = get_report_weeks(today)

    # ---------------------------------------------------------
    # Measurable statuses
    # ---------------------------------------------------------

    measurables = await Measurable.filter(team_id=team.id).order_by("id")

    scores = await Score.filter(measurable__team_id=team.id).order_by("week_start")

    scores_by_measurable = defaultdict(dict)

    for score in scores:
        scores_by_measurable[score.measurable_id][score.week_start] = score

    measurable_status = {}

    for measurable in measurables:
        weekly_status = {}

        for week_start in weeks:
            score = scores_by_measurable[measurable.id].get(week_start)

            status = compute_measurable_status(
                goal=measurable.goal,
                score_value=score.value if score else None,
                week_start=week_start,
                current_week_start=current_week_start,
            )

            weekly_status[week_start.isoformat()] = status

        measurable_status[measurable.id] = weekly_status

    # ---------------------------------------------------------
    # To-Do completion
    # ---------------------------------------------------------

    todos = await Todo.filter(team_id=team.id).values(
        "id",
        "due_date",
        "done_at",
    )

    todo_completion = {}

    for week_start in weeks:
        week_start, next_week_start_utc = get_company_week_bounds(
            week_start,
            team.company.timezone,
        )

        completion = compute_todo_completion(
            todos=todos,
            week_start=week_start,
            week_end_utc=next_week_start_utc,
            tz_name=team.company.timezone,
        )

        todo_completion[week_start.isoformat()] = completion

    # ---------------------------------------------------------
    # Overdue To-Dos
    # ---------------------------------------------------------

    overdue_todos = sorted(
        todo["id"]
        for todo in todos
        if todo["done_at"] is None and todo["due_date"] < today
    )

    # ---------------------------------------------------------
    # Rocks and milestone progress
    # ---------------------------------------------------------

    rocks = await Rock.filter(team_id=team.id).order_by("id")

    rock_ids = [rock.id for rock in rocks]

    milestones = []

    if rock_ids:
        milestones = await Milestone.filter(rock_id__in=rock_ids).values(
            "rock_id",
            "due_date",
            "done",
        )

    milestones_by_rock = defaultdict(list)

    for milestone in milestones:
        milestones_by_rock[milestone["rock_id"]].append(milestone)

    rocks_report = {}

    for rock in rocks:
        rock_milestones = milestones_by_rock[rock.id]

        rocks_report[rock.id] = {
            "status": compute_rock_status(
                seeded_status=rock.status.value,
                milestones=rock_milestones,
                today=today,
            ),
            "progress_percent": compute_rock_progress(
                seeded_status=rock.status.value,
                milestones=rock_milestones,
            ),
        }

    # ---------------------------------------------------------
    # Unsolved Issues, in Issue order
    # ---------------------------------------------------------

    unsolved_issues = await Issue.filter(
        team_id=team.id,
        solved_at__isnull=True,
    ).values(
        "id",
        "priority",
        "created_at",
    )

    ordered_issues = sort_issues(unsolved_issues)

    issue_order = [issue["id"] for issue in ordered_issues]

    # ---------------------------------------------------------
    # Ended meeting summaries
    # ---------------------------------------------------------

    meetings = (
        await Meeting.filter(
            team_id=team.id,
            ended_at__isnull=False,
        )
        .select_related("facilitator")
        .order_by("id")
    )

    meetings_report = {}

    for meeting in meetings:
        # Rebuild from the current database data instead of relying
        # on a potentially stale persisted summary.
        summary = await build_meeting_summary(meeting)

        meetings_report[meeting.id] = {
            "scorecard_week": summary["reviewed_week"],
            "measurable_status": {
                measurable["id"]: measurable["status"]
                for measurable in summary["measurables"]
            },
            "issues_solved": sorted(
                issue["id"] for issue in summary["issues"]["solved"]
            ),
            "todos_created": sorted(todo["id"] for todo in summary["todos"]["created"]),
            "attendee_ids": sorted(
                attendee["user"]["id"] for attendee in summary["attendees"]
            ),
            "rating": summary["average_rating"],
        }

    return {
        "measurable_status": measurable_status,
        "todo_completion": todo_completion,
        "overdue_todos": overdue_todos,
        "rocks": rocks_report,
        "issue_order": issue_order,
        "meetings": meetings_report,
    }


async def generate_rules_report() -> dict:
    """Generate the complete rules report for all teams."""
    now = get_app_now()

    teams = await Team.filter().select_related("company").order_by("id")

    teams_report = {}

    for team in teams:
        teams_report[team.id] = await build_team_report(
            team=team,
            now=now,
        )

    return {
        "now": now.isoformat(),
        "teams": teams_report,
    }


async def run_report() -> dict:
    """Initialize the database, generate the report, and close connections."""

    freeze_app_now()
    await Tortoise.init(config=TORTOISE_ORM)

    try:
        return await generate_rules_report()
    finally:
        await Tortoise.close_connections()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate the Ninety EOS rules report."
    )

    parser.add_argument(
        "--output",
        type=Path,
        help="Optional path to write the generated JSON report.",
    )

    args = parser.parse_args()

    report = asyncio.run(run_report())

    output = json.dumps(
        report,
        indent=2,
        sort_keys=True,
    )

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(output + "\n", encoding="utf-8")

    print(output)


if __name__ == "__main__":
    main()
