from datetime import UTC, datetime
from enum import Enum
from typing import Any

from tortoise import fields
from tortoise.exceptions import ValidationError
from tortoise.validators import MaxValueValidator, MinValueValidator

from ._base_db_model import BaseModel, generate_id
from ._custom_db_validators import IssueSourceValidator, WeekStartValidator


class Measurable(BaseModel):
    name = fields.CharField(max_length=100)
    unit = fields.CharField(max_length=50)
    goal: fields.JSONField[dict[str, Any]] = fields.JSONField(default=dict)

    owner = fields.ForeignKeyField(
        "models.User", related_name="measurables", db_index=True
    )
    team = fields.ForeignKeyField(
        "models.Team", related_name="measurables", db_index=True
    )

    class Meta:
        indexes = (("owner_id", "team_id"),)


class Score(BaseModel):
    id = fields.CharField(
        max_length=20, primary_key=True, default=lambda: generate_id("score")
    )

    week_start = fields.DateField(validators=[WeekStartValidator()])
    value = fields.FloatField()

    measurable = fields.ForeignKeyField(
        "models.Measurable", related_name="scores", db_index=True
    )

    class Meta:
        unique_together = (("week_start", "measurable_id"),)


class Rock(BaseModel):
    class Status(str, Enum):
        ON_TRACK = "on_track"
        OFF_TRACT = "off_track"
        COMPLETE = "complete"

    title = fields.CharField(max_length=100)
    quarter = fields.CharField(max_length=7, db_index=True)
    status = fields.CharEnumField(Status, default=Status.ON_TRACK, db_index=True)

    owner = fields.ForeignKeyField("models.User", related_name="rocks", db_index=True)
    team = fields.ForeignKeyField("models.Team", related_name="rocks", db_index=True)

    class Meta:
        indexes = (("quarter", "status"), ("owner_id", "team_id"))


class Milestone(BaseModel):
    title = fields.CharField(max_length=100)
    due_date = fields.DateField()
    done = fields.BooleanField(default=False, db_index=True)

    rock = fields.ForeignKeyField(
        "models.Rock", related_name="milestones", db_index=True
    )


class Issue(BaseModel):
    id = fields.CharField(
        max_length=20, primary_key=True, default=lambda: generate_id("i")
    )
    title = fields.CharField(max_length=100)
    priority = fields.SmallIntegerField(
        null=True,
        db_index=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    solved_at = fields.DateTimeField(null=True, default=None)
    resolution_note = fields.TextField(null=True, default=None)
    source: fields.JSONField[dict[str, Any]] = fields.JSONField(
        null=True, default=None, validators=[IssueSourceValidator()]
    )

    owner = fields.ForeignKeyField("models.User", related_name="issues", db_index=True)
    team = fields.ForeignKeyField("models.Team", related_name="issues", db_index=True)

    class Meta:
        indexes = (("owner_id", "team_id"),)

    async def save(
        self, using_db=None, update_fields=None, force_create=False, force_update=False
    ):
        if self.source:
            source_models: dict[str, BaseModel] = {
                "measurable_id": Measurable,
                "todo_id": Todo,
                "rock_id": Rock,
            }

            key = next(
                source_key
                for source_key in source_models
                if self.source.get(source_key) is not None
            )
            source_id = self.source[key]

            source_obj = source_models[key].filter(id=source_id, team_id=self.team_id)
            if not await source_obj.exists():
                raise ValidationError(f"{key} does not exist")
            source_obj = await source_obj.first()

            if key == "measurable_id":
                dupes = Issue.filter(
                    source__contains={
                        key: source_id,
                        "week_start": self.source.get("week_start"),
                    }
                )
            else:
                if key == "todo_id" and (
                    source_obj.done_at or datetime.now(UTC).date() < source_obj.due_date
                ):
                    raise ValidationError("Only overdue todos can become issues")
                elif key == "rock_id":
                    rock_milestones = await Milestone.filter(rock_id=source_id)
                    overdue_milestone_exists = False
                    for rock_milestone in rock_milestones:
                        if datetime.now(UTC).date() < rock_milestone.due_date:
                            overdue_milestone_exists = True
                            break
                    if not overdue_milestone_exists:
                        raise ValidationError("Only off-track rocks can become issues")

                dupes = Issue.filter(
                    source__contains={
                        key: source_id,
                    }
                )
            if self.pk is not None:
                dupes = dupes.exclude(pk=self.pk)
            if await dupes.exists():
                raise ValidationError(f"An issue for this {key} already exists")

        return await super().save(using_db, update_fields, force_create, force_update)


class Todo(BaseModel):
    id = fields.CharField(
        max_length=20, primary_key=True, default=lambda: generate_id("t")
    )
    title = fields.CharField(max_length=100)
    due_date = fields.DateField()
    done_at = fields.DateTimeField(null=True)

    source_issue = fields.ForeignKeyField(
        "models.Issue", related_name="todos", null=True, default=None, db_index=True
    )
    owner = fields.ForeignKeyField("models.User", related_name="todos", db_index=True)
    team = fields.ForeignKeyField("models.Team", related_name="todos", db_index=True)

    class Meta:
        indexes = (("owner_id", "team_id"),)


class Meeting(BaseModel):
    started_at = fields.DateTimeField()
    ended_at = fields.DateTimeField(null=True)

    facilitator = fields.ForeignKeyField(
        "models.User", related_name="meeting_facilitations", db_index=True
    )
    team = fields.ForeignKeyField("models.Team", related_name="meetings", db_index=True)

    class Meta:
        indexes = (("facilitator_id", "team_id"),)


class MeetingAttendee(BaseModel):
    id = fields.CharField(
        max_length=20, primary_key=True, default=lambda: generate_id("att")
    )

    rating = fields.SmallIntegerField(
        null=True, validators=[MinValueValidator(1), MaxValueValidator(10)]
    )

    user = fields.ForeignKeyField("models.User", related_name="meetings", db_index=True)
    meeting = fields.ForeignKeyField(
        "models.Meeting", related_name="attendees", db_index=True
    )
