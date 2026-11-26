from tortoise import migrations
from tortoise.migrations import operations as ops
import functools
from json import dumps, loads
from tortoise import fields

class Migration(migrations.Migration):
    dependencies = [('models', '0002_meeting_tracking_columns')]

    initial = False

    operations = [
        ops.AddField(
            model_name='Meeting',
            name='summary',
            field=fields.JSONField(null=True, default=dict, encoder=functools.partial(dumps, separators=(',', ':')), decoder=loads),
        ),
    ]
