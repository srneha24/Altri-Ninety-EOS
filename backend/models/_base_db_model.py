from uuid import uuid4

from tortoise import fields
from tortoise.models import Model
from utils.clock import get_app_now


def generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:14]}"


class BaseModel(Model):
    id = fields.CharField(max_length=20, primary_key=True)

    created_at = fields.DatetimeField(default=get_app_now)
    updated_at = fields.DatetimeField(default=get_app_now)

    async def save(
        self, using_db=None, update_fields=None, force_create=False, force_update=False
    ):
        now = get_app_now()
        if not self._saved_in_db and self.created_at is None:
            self.created_at = now
        if update_fields is None or "updated_at" in update_fields:
            self.updated_at = now
        return await super().save(using_db, update_fields, force_create, force_update)
