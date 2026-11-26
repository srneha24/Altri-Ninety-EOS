from datetime import date, datetime
from enum import Enum
from typing import Any

from models import Issue, Rock, Score, Todo, User
from pydantic import BaseModel, ConfigDict, Field, model_validator
from tortoise.contrib.pydantic import pydantic_model_creator


class ScorecardParams(BaseModel):
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_date_range(self) -> "ScorecardParams":
        if self.end_date < self.start_date:
            raise ValueError("start_date cannot be after end_date")
        return self


ScoreResponse = pydantic_model_creator(
    Score, name="ScoreResponse", exclude=("measurable", "mesurable_id")
)
_OwnerResponse = pydantic_model_creator(User, name="Owner", include=("id", "name"))


class ScorecardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    unit: str
    goal: dict[str, Any]
    owner: _OwnerResponse  # type: ignore
    scores: list[ScoreResponse]  # type: ignore
    created_at: datetime
    updated_at: datetime


class ScoreUpdatePayload(BaseModel):
    value: float = Field(...)


class IssuesParams(BaseModel):
    class Status(str, Enum):
        SOLVED = "solved"
        UNSOLVED = "unsolved"
        ALL = "all"

    class OrderBy(str, Enum):
        PRIORITY_ASC = "priority"
        PRIORITY_DESC = "-priority"
        CREATED_AT_ASC = "created_at"
        CREATED_AT_DESC = "-created_at"

    status: Status = Field(Status.ALL)
    priority: int | None = Field(None, ge=1, le=5)
    owner_id: str | None = Field(None)
    order_by: OrderBy = Field(OrderBy.PRIORITY_DESC)


_IssueResponseBase = pydantic_model_creator(
    Issue, name="IssueResponseBase", exclude=("team", "team_id", "source", "todos")
)


class IssueResponse(_IssueResponseBase):
    source: dict[str, Any] | None = None
    owner: _OwnerResponse  # type: ignore


class Source(BaseModel):
    measurable_id: str | None = Field(None)
    rock_id: str | None = Field(None)
    todo_id: str | None = Field(None)
    week_start: date | None = Field(None)

    @model_validator(mode="after")
    def check_at_least_one_id_is_set(self) -> "Source":
        source_ids = {"measurable_id", "todo_id", "rock_id"}
        if any(
            source_id is not None and not source_id.strip()
            for source_id in (self.measurable_id, self.todo_id, self.rock_id)
        ):
            raise ValueError("Source IDs must be non-empty strings")
        if not self.measurable_id and not self.rock_id and not self.todo_id:
            raise ValueError(
                "At least one of measurable_id, todo_id and rock_id needs to be set"
            )
        elif len(source_ids & self.model_fields_set) >= 2:
            raise ValueError("Exactly one of measurable_id/todo_id/rock_id is required")
        elif (self.rock_id or self.todo_id) and self.week_start:
            raise ValueError("week_start can only be set with measurable_id")
        elif (self.measurable_id and not self.week_start) or (
            self.week_start and not self.measurable_id
        ):
            raise ValueError("measurable_id and week_start both required")

        if self.week_start is not None and self.week_start.weekday() != 0:
            raise ValueError("week_start must be a Monday")
        return self


class IssueCreatePayload(BaseModel):
    title: str | None = Field(None)
    priority: int | None = Field(None)
    source: Source | None = Field(None)

    @model_validator(mode="after")
    def check_title_and_source_states(self) -> "IssueCreatePayload":
        if not self.title and not self.source:
            raise ValueError("title needs to be set if there is no source")
        return self


class IssueUpdatePayload(BaseModel):
    title: str | None = Field(None)
    priority: int | None = Field(None, ge=1, le=5)
    resolution_note: str | None = Field(None)


class TodoParams(BaseModel):
    class OrderBy(str, Enum):
        DUE_DATA_ASC = "due_date"
        DUE_DATE_DESC = "-due_date"
        CREATED_AT_ASC = "created_at"
        CREATED_AT_DESC = "-created_at"

    done: bool | None = Field(None)
    issue_id: str | None = Field(None)
    owner_id: str | None = Field(None)
    order_by: OrderBy = Field(OrderBy.DUE_DATA_ASC)


_IssueMinimalResponse = pydantic_model_creator(
    Issue, name="IssueMinimalResponse", include=("id", "title")
)

_TodoResponseBase = pydantic_model_creator(
    Todo,
    name="TodoBase",
    exclude=("team", "team_id", "source_issue", "source_issue_id"),
)


class TodoResponse(_TodoResponseBase):
    issue: _IssueMinimalResponse | None = Field(default=None, validation_alias="source_issue")  # type: ignore
    owner: _OwnerResponse  # type: ignore


class TodoCreatePayload(BaseModel):
    title: str = Field(...)
    source_issue_id: str | None = Field(None)
    owner_id: str = Field(...)


class TodoUpdatePayload(BaseModel):
    done: bool = Field(...)


class QuarterlyRockParams(BaseModel):
    quarter: str = Field(..., pattern=r"^\d{4}-Q[1-4]$")
    status: Rock.Status | None = Field(None)
    owner_id: str | None = Field(None)


_RockResponseBase = pydantic_model_creator(
    Rock, name="RockResponse", exclude=("team", "team_id")
)


class QuarterlyRockResponse(_RockResponseBase):
    owner: _OwnerResponse  # type: ignore
