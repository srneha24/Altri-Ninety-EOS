from datetime import date
from zoneinfo import available_timezones

from tortoise.exceptions import ValidationError
from tortoise.validators import Validator


class IANATimezoneValidator(Validator):
    def __call__(self, value: str):
        if value not in available_timezones():
            raise ValidationError(f"Invalid IANA timezone: {value!r}")


class IssueSourceValidator(Validator):
    def __call__(self, value: dict | None):
        if value is None:
            return
        if not isinstance(value, dict):
            raise ValidationError("source must be a dict")

        id_keys = ("measurable_id", "todo_id", "rock_id")

        ids = {key: value[key] for key in id_keys if value.get(key) is not None}
        if len(ids) != 1:
            raise ValidationError(
                "exactly one of measurable_id/todo_id/rock_id is required"
            )
        if not all(
            isinstance(source_id, str) and source_id.strip()
            for source_id in ids.values()
        ):
            raise ValidationError("source ID must be a non-empty string")

        week_start = value.get("week_start")
        if "measurable_id" in ids:
            if (
                not isinstance(week_start, str) and not isinstance(week_start, date)
            ) or (isinstance(week_start, str) and not week_start.strip()):
                raise ValidationError(
                    "week_start is required if measurable_id is set and must be a ISO format date string"
                )
            if isinstance(week_start, str):
                try:
                    day = date.fromisoformat(week_start)
                except ValueError:
                    raise ValidationError(
                        "week_start is not a valid date in ISO format"
                    )
            else:
                day = week_start

            if day.weekday() != 0:
                raise ValidationError("week_start is not a Monday")

            value["week_start"] = day.isoformat()
        elif week_start is not None:
            raise ValidationError("week_start is invalid when source is a rock or todo")


class WeekStartValidator(Validator):
    def __call__(self, value: date):
        if value.weekday() != 0:
            raise ValidationError("week_start is not a Monday")
