from enum import Enum

from tortoise import fields
from tortoise.validators import EmailValidator
from utils.base_db_model import BaseModel


class User(BaseModel):
    class Role(str, Enum):
        ADMIN = "admin"
        TEAM_MEMBER = "team_member"
        OBSERVER = "observer"

    name = fields.CharField(max_length=100)
    email = fields.CharField(max_length=100, unique=True, validators=[EmailValidator()])
    role = fields.CharEnumField(Role, max_length=20, db_index=True)


class Membership(BaseModel):
    user = fields.ForeignKeyField("models.User", related_name="teams")
    team = fields.ForeignKeyField("models.Team", related_name="users")

    class Meta:
        unique_together = (("user_id", "team_id"),)
