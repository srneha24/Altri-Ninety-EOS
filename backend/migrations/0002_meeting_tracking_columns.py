from tortoise import migrations
from tortoise.migrations import operations as ops
import models.traction
from tortoise import fields
from tortoise.migrations.constraints import UniqueConstraint

class Migration(migrations.Migration):
    dependencies = [('models', '0001_initial')]

    initial = False

    operations = [
        ops.AlterField(
            model_name='Meeting',
            name='ended_at',
            field=fields.DatetimeField(null=True, db_index=True, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Meeting',
            name='started_at',
            field=fields.DatetimeField(db_index=True, auto_now=False, auto_now_add=False),
        ),
        ops.AddField(
            model_name='Meeting',
            name='conclude_started_at',
            field=fields.DatetimeField(null=True, db_index=True, auto_now=False, auto_now_add=False),
        ),
        ops.AddField(
            model_name='Meeting',
            name='ids_started_at',
            field=fields.DatetimeField(null=True, db_index=True, auto_now=False, auto_now_add=False),
        ),
        ops.AddField(
            model_name='MeetingAttendee',
            name='joined_at',
            field=fields.DatetimeField(null=True, db_index=True, auto_now=False, auto_now_add=False),
        ),
        ops.AddConstraint(
            model_name='MeetingAttendee',
            constraint=UniqueConstraint(fields=('user_id', 'meeting_id'), name=None),
        ),
        ops.AlterField(
            model_name='Rock',
            name='status',
            field=fields.CharEnumField(default=models.traction.Rock.Status.ON_TRACK, db_index=True, description='ON_TRACK: on_track\nOFF_TRACK: off_track\nCOMPLETE: complete', enum_type=models.traction.Rock.Status, max_length=9),
        ),
    ]
