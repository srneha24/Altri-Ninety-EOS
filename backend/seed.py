"""Load and synchronize repository seed.json records in the configured database."""

import argparse
import asyncio
import json
from collections import defaultdict
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any
from uuid import NAMESPACE_URL, uuid5

from conf.database import TORTOISE_ORM
from models import (
    Company,
    Issue,
    Measurable,
    Meeting,
    MeetingAttendee,
    Membership,
    Milestone,
    Rock,
    Score,
    Team,
    Todo,
    User,
)
from tortoise import Tortoise
from tortoise.models import Model
from tortoise.transactions import atomic

DEFAULT_SEED_PATH = Path(__file__).resolve().parents[1] / "seed.json"
MAX_ID_LENGTH = 20


def parse_timestamp(value: str | None) -> datetime | None:
    if value is None:
        return None

    timestamp = datetime.fromisoformat(value)
    if timestamp.tzinfo is None:
        raise ValueError(f"Timestamp must include a timezone: {value!r}")
    return timestamp.astimezone(UTC)


def derived_id(prefix: str, *parts: str) -> str:
    source = ":".join((prefix, *parts))
    identifier = f"{prefix}_{uuid5(NAMESPACE_URL, source).hex[:14]}"
    if len(identifier) > MAX_ID_LENGTH:
        raise ValueError(
            f"Generated ID exceeds {MAX_ID_LENGTH} characters: {identifier}"
        )
    return identifier


async def seed_record(
    model: type[Model],
    identifier: str,
    defaults: dict[str, Any],
    stats: dict[str, dict[str, int]],
) -> None:
    if len(identifier) > MAX_ID_LENGTH:
        raise ValueError(f"ID exceeds {MAX_ID_LENGTH} characters: {identifier}")

    record, created = await model.get_or_create(id=identifier, defaults=defaults)
    if created:
        stats[model.__name__]["created"] += 1
        return

    for field_name, value in defaults.items():
        setattr(record, field_name, value)
    await record.save()
    stats[model.__name__]["updated"] += 1


async def seed_keyed_record(
    model: type[Model],
    identifier: str,
    identity: dict[str, Any],
    defaults: dict[str, Any],
    stats: dict[str, dict[str, int]],
) -> None:
    if len(identifier) > MAX_ID_LENGTH:
        raise ValueError(f"ID exceeds {MAX_ID_LENGTH} characters: {identifier}")

    record = await model.filter(id=identifier).first()
    if record is not None:
        if any(getattr(record, key) != value for key, value in identity.items()):
            raise ValueError(
                f"Generated ID collision for {model.__name__}: {identifier}"
            )
        for field_name, value in defaults.items():
            setattr(record, field_name, value)
        await record.save()
        stats[model.__name__]["updated"] += 1
        return

    matches = await model.filter(**identity).all()
    if len(matches) > 1:
        raise ValueError(f"Multiple {model.__name__} rows match {identity}")
    if matches:
        previous_id = matches[0].id
        updated = await model.filter(id=previous_id).update(
            id=identifier, **defaults, updated_at=datetime.now(UTC)
        )
        if updated != 1:
            raise RuntimeError(
                f"Failed to re-key {model.__name__} row {previous_id!r}"
            )
        stats[model.__name__]["updated"] += 1
        return

    await model.create(id=identifier, **defaults)
    stats[model.__name__]["created"] += 1


@atomic()
async def seed_records(seed: dict[str, Any], stats: dict[str, dict[str, int]]) -> None:
    company_data = seed["company"]
    await seed_record(
        Company,
        company_data["id"],
        {
            "name": company_data["name"],
            "timezone": company_data["timezone"],
        },
        stats,
    )

    for team in seed["teams"]:
        await seed_record(
            Team,
            team["id"],
            {"name": team["name"], "company_id": company_data["id"]},
            stats,
        )

    for user in seed["users"]:
        await seed_record(
            User,
            user["id"],
            {
                "name": user["name"],
                "email": user["email"],
                "role": User.Role(user["role"]),
            },
            stats,
        )

    for membership in seed["memberships"]:
        identifier = derived_id("mem", membership["user_id"], membership["team_id"])
        await seed_keyed_record(
            Membership,
            identifier,
            {
                "user_id": membership["user_id"],
                "team_id": membership["team_id"],
            },
            {
                "user_id": membership["user_id"],
                "team_id": membership["team_id"],
            },
            stats,
        )

    for measurable in seed["measurables"]:
        await seed_record(
            Measurable,
            measurable["id"],
            {
                "team_id": measurable["team_id"],
                "name": measurable["name"],
                "owner_id": measurable["owner_id"],
                "unit": measurable["unit"],
                "goal": measurable["goal"],
            },
            stats,
        )

    for score in seed["scores"]:
        week_start = date.fromisoformat(score["week_start"])
        identifier = derived_id("score", score["measurable_id"], week_start.isoformat())
        await seed_keyed_record(
            Score,
            identifier,
            {
                "measurable_id": score["measurable_id"],
                "week_start": week_start,
            },
            {
                "measurable_id": score["measurable_id"],
                "week_start": week_start,
                "value": score["value"],
            },
            stats,
        )

    for rock in seed["rocks"]:
        await seed_record(
            Rock,
            rock["id"],
            {
                "team_id": rock["team_id"],
                "title": rock["title"],
                "owner_id": rock["owner_id"],
                "quarter": rock["quarter"],
                "status": Rock.Status(rock["status"]),
            },
            stats,
        )

    for milestone in seed["milestones"]:
        await seed_record(
            Milestone,
            milestone["id"],
            {
                "rock_id": milestone["rock_id"],
                "title": milestone["title"],
                "due_date": date.fromisoformat(milestone["due_date"]),
                "done": milestone["done"],
            },
            stats,
        )

    for issue in seed["issues"]:
        await seed_record(
            Issue,
            issue["id"],
            {
                "team_id": issue["team_id"],
                "title": issue["title"],
                "owner_id": issue["owner_id"],
                "priority": issue["priority"],
                "created_at": parse_timestamp(issue["created_at"]),
                "solved_at": parse_timestamp(issue["solved_at"]),
                "resolution_note": issue["resolution_note"],
                "source": issue["source"],
            },
            stats,
        )

    for todo in seed["todos"]:
        await seed_record(
            Todo,
            todo["id"],
            {
                "team_id": todo["team_id"],
                "title": todo["title"],
                "owner_id": todo["owner_id"],
                "due_date": date.fromisoformat(todo["due_date"]),
                "done_at": parse_timestamp(todo["done_at"]),
                "source_issue_id": todo["source_issue_id"],
                "created_at": parse_timestamp(todo["created_at"]),
            },
            stats,
        )

    for meeting in seed["meetings"]:
        await seed_record(
            Meeting,
            meeting["id"],
            {
                "team_id": meeting["team_id"],
                "facilitator_id": meeting["facilitator_id"],
                "started_at": parse_timestamp(meeting["started_at"]),
                "ended_at": parse_timestamp(meeting["ended_at"]),
            },
            stats,
        )

        attendee_ids = meeting["attendee_ids"]
        ratings = {rating["user_id"]: rating["rating"] for rating in meeting["ratings"]}
        if len(attendee_ids) != len(set(attendee_ids)):
            raise ValueError(f"Meeting {meeting['id']} has duplicate attendees")
        if not set(ratings).issubset(attendee_ids):
            raise ValueError(
                f"Meeting {meeting['id']} has a rating from a non-attendee"
            )

        for user_id in attendee_ids:
            await seed_keyed_record(
                MeetingAttendee,
                derived_id("att", meeting["id"], user_id),
                {"meeting_id": meeting["id"], "user_id": user_id},
                {
                    "meeting_id": meeting["id"],
                    "user_id": user_id,
                    "rating": ratings.get(user_id),
                },
                stats,
            )


async def seed_database(seed_path: Path) -> None:
    with seed_path.open(encoding="utf-8") as seed_file:
        seed = json.load(seed_file)

    company_data = seed["company"]
    if seed["meta"]["timezone"] != company_data["timezone"]:
        raise ValueError("Seed metadata timezone does not match the company timezone")

    stats: dict[str, dict[str, int]] = defaultdict(lambda: {"created": 0, "updated": 0})
    await Tortoise.init(config=TORTOISE_ORM)
    try:
        await seed_records(seed, stats)
    finally:
        await Tortoise.close_connections()

    for model_name, counts in stats.items():
        print(
            f"{model_name}: {counts['created']} created, "
            f"{counts['updated']} updated"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--seed-file",
        type=Path,
        default=DEFAULT_SEED_PATH,
        help=f"Seed JSON file (default: {DEFAULT_SEED_PATH})",
    )
    args = parser.parse_args()
    asyncio.run(seed_database(args.seed_file))


if __name__ == "__main__":
    main()
