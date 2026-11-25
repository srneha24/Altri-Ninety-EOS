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


class ScorecardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    unit: str
    goal: dict[str, Any]
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


_OwnerResponse = pydantic_model_creator(User, name="Owner", include=("id", "name"))

_IssueResponseBase = pydantic_model_creator(
    Issue, name="IssueResponseBase", exclude=("team", "team_id", "source", "todos")
)


class IssueResponse(_IssueResponseBase):
    source: dict[str, Any] | None = None
    owner: _OwnerResponse  # type: ignore


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


class TodoUpdatePayload(BaseModel):
    done: bool = Field(...)


class RockParams(BaseModel):
    quarter: str = Field(..., pattern=r"^\d{4}-Q[1-4]$")
    status: Rock.Status | None = Field(None)
    owner_id: str | None = Field(None)


_RockResponseBase = pydantic_model_creator(
    Rock, name="RockResponse", exclude=("team", "team_id")
)


class QuarterlyRockResponse(_RockResponseBase):
    owner: _OwnerResponse  # type: ignore
