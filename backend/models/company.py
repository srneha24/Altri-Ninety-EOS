from tortoise import fields

from .base_db_model import BaseModel
from .custom_db_validators import IANATimezoneValidator


class Company(BaseModel):
    name = fields.CharField(max_length=100)
    timezone = fields.CharField(
        max_length=50,
        default="UTC",
        validators=[IANATimezoneValidator()],
    )


class Team(BaseModel):
    name = fields.CharField(max_length=10)
    company = fields.ForeignKeyField(
        "models.Company", related_name="teams", db_index=True
    )
