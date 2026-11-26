from datetime import datetime
from enum import Enum

from models import Meeting, MeetingAttendee, User
from pydantic import BaseModel, Field, model_validator
from tortoise.contrib.pydantic import pydantic_model_creator

_UserResponse = pydantic_model_creator(
    User, name="UserResponse", include=("id", "name")
)


class MeetingState(str, Enum):
    START = "start"
    IDS = "ids"
    CONCLUDE = "conclude"
    END = "end"


class MeetingStatePayload(BaseModel):
    state: MeetingState = Field(...)
    meeting_id: str | None = Field(None)

    @model_validator(mode="after")
    def check_meeting_id_with_state(self) -> "MeetingStatePayload":
        if self.state != MeetingState.START and not self.meeting_id:
            raise ValueError(f"meeting_id Required for {self.state.value} state")
        return self


_MeetingAttendeeResponseBase = pydantic_model_creator(
    MeetingAttendee,
    name="MeetingAttendeeResponseBase",
    exclude=("meeting", "meeting_id"),
)


class MeetingAttendeeResponse(_MeetingAttendeeResponseBase):
    user: _UserResponse  # type: ignore


_MeetingResponseBase = pydantic_model_creator(
    Meeting, name="MeetingResponseBase", exclude=("team", "team_id", "attendees")
)


class MeetingResponse(_MeetingResponseBase):
    summary: dict | None
    state: MeetingState
    server_now: datetime
    facilitator: _UserResponse  # type: ignore
    attendees: list[MeetingAttendeeResponse]


class MeetingRatingPayload(BaseModel):
    rating: int = Field(..., ge=1, le=10)
