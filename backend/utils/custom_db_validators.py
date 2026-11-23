from datetime import date
from zoneinfo import available_timezones

from tortoise.exceptions import ValidationError
from tortoise.validators import Validator


class IANATimezoneValidator(Validator):
    def __call__(self, value: str):
        if value not in available_timezones():
            raise ValidationError(f"Invalid IANA timezone: {value!r}")


class IssueSourceValidator(Validator):
    def __call__(self, value):
        if value is None:
            return
        if not isinstance(value, dict):
            raise ValidationError("source must be a dict")

        id_keys = ("measurable_id", "todo_id", "rock_id")

        ids = {k: value[k] for k in id_keys if value.get(k) is not None}
        if len(ids) != 1:
            raise ValidationError(
                "exactly one of measurable_id/todo_id/rock_id is required"
            )
        if not all(isinstance(v, str) for v in ids.values()):
            raise ValidationError("source ID must be a string")

        week_start = value.get("week_start")
        if not isinstance(week_start, str):
            raise ValidationError("week_start is required and must be a string")
        try:
            date.fromisoformat(week_start)
        except ValueError:
            raise ValidationError("week_start is not a valid date in ISO format")
