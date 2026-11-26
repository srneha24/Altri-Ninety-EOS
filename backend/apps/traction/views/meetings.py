import asyncio
import json

from conf.responses import CustomJSONResponse
from fastapi import BackgroundTasks, HTTPException, Request
from fastapi.responses import StreamingResponse
from models import Meeting, MeetingAttendee
from tortoise.exceptions import DoesNotExist, IntegrityError
from tortoise.transactions import in_transaction
from utils.clock import get_app_now
from utils.json_actions import simplify_json

from ..schemas import (
    MeetingAttendeeResponse,
    MeetingRatingPayload,
    MeetingResponse,
    MeetingState,
    MeetingStatePayload,
)
from ..utils import save_meeting_summary


async def meeting_state_view(
    user_id: str,
    team_id: str,
    payload: MeetingStatePayload,
    background_tasks: BackgroundTasks,
):
    if payload.state == MeetingState.START:
        if await Meeting.filter(team_id=team_id, ended_at__isnull=True).exists():
            raise HTTPException(detail="Team Is Already In A Meeting", status_code=400)

        async with in_transaction():
            meeting = await Meeting.create(
                started_at=get_app_now(), facilitator_id=user_id, team_id=team_id
            )
            await MeetingAttendee.create(
                user_id=user_id, meeting=meeting, joined_at=meeting.started_at
            )

        await meeting.fetch_related("facilitator", "attendees", "attendees__user")
    else:
        state_to_datetime_field_mapping = {
            MeetingState.IDS: "ids_started_at",
            MeetingState.CONCLUDE: "conclude_started_at",
            MeetingState.END: "ended_at",
        }

        try:
            meeting = (
                await Meeting.get(id=payload.meeting_id)
                .select_related("facilitator")
                .prefetch_related("attendees", "attendees__user")
            )
        except DoesNotExist:
            raise HTTPException(detail="meeting Does Not Exist", status_code=400)

        if meeting.facilitator_id != user_id:
            raise HTTPException(
                detail="Only facilitator Can Update Meeting State", status_code=403
            )

        meeting.update_from_dict(
            {state_to_datetime_field_mapping.get(payload.state): get_app_now()}
        )
        await meeting.save()
        if payload.state == MeetingState.END:
            background_tasks.add_task(save_meeting_summary, meeting.id)

    meeting.state = payload.state.value
    return CustomJSONResponse(
        content={
            "data": simplify_json(MeetingResponse.model_validate(meeting).model_dump())
        }
    )


async def get_meeting_view(meeting_id: str):
    try:
        meeting = (
            await Meeting.get(id=meeting_id)
            .select_related("facilitator")
            .prefetch_related("attendees", "attendees__user")
        )

        if meeting.ended_at:
            meeting.state = MeetingState.END.value
        elif meeting.conclude_started_at:
            meeting.state = MeetingState.CONCLUDE.value
        elif meeting.ids_started_at:
            meeting.state = MeetingState.IDS.value
        else:
            meeting.state = MeetingState.START.value

        return CustomJSONResponse(
            content={
                "data": simplify_json(
                    MeetingResponse.model_validate(meeting).model_dump()
                )
            }
        )
    except DoesNotExist:
        raise HTTPException(detail="meeting Not Found", status_code=404)


async def join_meeting_view(user_id: str, meeting_id: str):
    try:
        try:
            meeting = await Meeting.get(id=meeting_id)
        except DoesNotExist:
            raise HTTPException(detail="meeting Not Found", status_code=404)

        if meeting.ended_at:
            raise HTTPException(detail="Meeting Has Already Ended", status_code=400)

        await MeetingAttendee.create(
            user_id=user_id, meeting=meeting, joined_at=get_app_now()
        )
        return CustomJSONResponse(message="Meeting Joined", content={})
    except IntegrityError:
        attendee = await MeetingAttendee.get(user_id=user_id, meeting=meeting)
        attendee.joined_at = get_app_now()
        await attendee.save()

        return CustomJSONResponse(message="Meeting Joined", content={})


async def get_meeting_attendees_view(meeting_id: str):
    attendees = (
        await MeetingAttendee.filter(meeting_id=meeting_id)
        .select_related("user")
        .order_by("joined_at")
    )
    if len(attendees) == 0:
        raise HTTPException(detail="meeting Not Found", status_code=404)

    return CustomJSONResponse(
        content={
            "data": [
                simplify_json(
                    MeetingAttendeeResponse.model_validate(attendee).model_dump()
                )
                for attendee in attendees
            ]
        }
    )


async def rate_meeting_view(
    user_id: str, meeting_id: str, payload: MeetingRatingPayload
):
    try:
        meeting = await Meeting.get(id=meeting_id)
    except DoesNotExist:
        raise HTTPException(detail="meeting Not Found", status_code=404)

    if not meeting.conclude_started_at or meeting.ended_at:
        raise HTTPException(
            detail="Meeting Can Already Rated During Conclusion", status_code=400
        )

    try:
        meeting_attendee = await MeetingAttendee.get(user_id=user_id, meeting=meeting)
        meeting_attendee.rating = payload.rating
        await meeting_attendee.save()

        return CustomJSONResponse(message="Rating Recorded", content={})
    except DoesNotExist:
        raise HTTPException(detail="User Has Not Joined Meeting", status_code=400)


async def get_meeting_summary_view(team_id: str, meeting_id: str):
    try:
        meeting = await Meeting.get(id=meeting_id, team_id=team_id).only(
            "id", "ended_at", "summary"
        )
    except DoesNotExist:
        raise HTTPException(detail="meeting Not Found", status_code=404)

    if not meeting.ended_at:
        raise HTTPException(
            detail="Summary Is Not Available For Ongoing Meetings", status_code=400
        )
    if not meeting.summary:
        raise HTTPException(
            detail="Summary Is Still Being Generated",
            status_code=503,
            headers={"Retry-After": "1"},
        )

    return CustomJSONResponse(content={"data": meeting.summary})


async def list_meeting_summaries_view(team_id: str):
    meetings = (
        await Meeting.filter(team_id=team_id, ended_at__isnull=False)
        .order_by("-ended_at")
        .only("id", "ended_at", "summary")
    )
    summaries = [meeting.summary for meeting in meetings if meeting.summary]
    return CustomJSONResponse(content={"data": summaries})


async def get_active_meeting_view(team_id: str):
    meeting = (
        await Meeting.filter(team_id=team_id, ended_at__isnull=True)
        .select_related("facilitator")
        .prefetch_related("attendees", "attendees__user")
        .first()
    )

    if not meeting:
        raise HTTPException(detail="No Active Meeting", status_code=400)

    if meeting.conclude_started_at:
        meeting.state = MeetingState.CONCLUDE.value
    elif meeting.ids_started_at:
        meeting.state = MeetingState.IDS.value
    else:
        meeting.state = MeetingState.START.value

    return CustomJSONResponse(
        content={
            "data": simplify_json(MeetingResponse.model_validate(meeting).model_dump())
        }
    )


async def get_meeting_events_view(request: Request, team_id: str, meeting_id: str):
    try:
        meeting = (
            await Meeting.get(id=meeting_id, team_id=team_id)
            .select_related("facilitator")
            .prefetch_related("attendees", "attendees__user")
        )
    except DoesNotExist:
        raise HTTPException(detail="meeting Not Found", status_code=404)

    def serialize_meeting(current_meeting: Meeting) -> dict[str, object]:
        if current_meeting.ended_at:
            current_meeting.state = MeetingState.END.value
        elif current_meeting.conclude_started_at:
            current_meeting.state = MeetingState.CONCLUDE.value
        elif current_meeting.ids_started_at:
            current_meeting.state = MeetingState.IDS.value
        else:
            current_meeting.state = MeetingState.START.value

        return simplify_json(
            MeetingResponse.model_validate(current_meeting).model_dump()
        )

    initial_data = json.dumps(
        serialize_meeting(meeting), separators=(",", ":"), sort_keys=True
    )

    async def stream_events():
        yield f"event: meeting_state\ndata: {initial_data}\n\n"
        if meeting.ended_at:
            return

        last_data = initial_data
        last_heartbeat = asyncio.get_running_loop().time()

        while not await request.is_disconnected():
            await asyncio.sleep(0.5)
            if await request.is_disconnected():
                return

            try:
                current_meeting = (
                    await Meeting.get(id=meeting_id, team_id=team_id)
                    .select_related("facilitator")
                    .prefetch_related("attendees", "attendees__user")
                )
            except DoesNotExist:
                yield 'event: meeting_unavailable\ndata: {"detail":"meeting Not Found"}\n\n'
                return

            data = json.dumps(
                serialize_meeting(current_meeting),
                separators=(",", ":"),
                sort_keys=True,
            )
            if data != last_data:
                yield f"event: meeting_state\ndata: {data}\n\n"
                last_data = data
                if current_meeting.ended_at:
                    return
            elif asyncio.get_running_loop().time() - last_heartbeat >= 15:
                yield ": keep-alive\n\n"
                last_heartbeat = asyncio.get_running_loop().time()

    return StreamingResponse(
        stream_events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
