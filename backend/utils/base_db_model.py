from uuid import uuid4

from tortoise import fields
from tortoise.models import Model


def generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:14]}"


class BaseModel(Model):
    id = fields.CharField(max_length=20, primary_key=True)

    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
