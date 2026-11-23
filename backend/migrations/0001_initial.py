from tortoise import migrations
from tortoise.migrations import operations as ops
import functools
import models.auth
import models.traction
from json import dumps, loads
from tortoise.fields.base import OnDelete
from tortoise import fields
from tortoise.indexes import Index

class Migration(migrations.Migration):
    initial = True

    operations = [
        ops.CreateModel(
            name='Company',
            fields=[
                ('id', fields.CharField(primary_key=True, unique=True, db_index=True, max_length=20)),
                ('created_at', fields.DatetimeField(auto_now=False, auto_now_add=True)),
                ('updated_at', fields.DatetimeField(auto_now=True, auto_now_add=False)),
                ('name', fields.CharField(max_length=100)),
                ('timezone', fields.CharField(default='UTC', max_length=50)),
            ],
            options={'table': 'company', 'app': 'models', 'pk_attr': 'id'},
            bases=['BaseModel'],
        ),
        ops.CreateModel(
            name='Team',
            fields=[
                ('id', fields.CharField(primary_key=True, unique=True, db_index=True, max_length=20)),
                ('created_at', fields.DatetimeField(auto_now=False, auto_now_add=True)),
                ('updated_at', fields.DatetimeField(auto_now=True, auto_now_add=False)),
                ('name', fields.CharField(max_length=10)),
                ('company', fields.ForeignKeyField('models.Company', source_field='company_id', db_index=True, db_constraint=True, to_field='id', related_name='teams', on_delete=OnDelete.CASCADE)),
            ],
            options={'table': 'team', 'app': 'models', 'pk_attr': 'id'},
            bases=['BaseModel'],
        ),
        ops.CreateModel(
            name='User',
            fields=[
                ('id', fields.CharField(primary_key=True, unique=True, db_index=True, max_length=20)),
                ('created_at', fields.DatetimeField(auto_now=False, auto_now_add=True)),
                ('updated_at', fields.DatetimeField(auto_now=True, auto_now_add=False)),
                ('name', fields.CharField(max_length=100)),
                ('email', fields.CharField(unique=True, max_length=100)),
                ('role', fields.CharEnumField(db_index=True, description='ADMIN: admin\nTEAM_MEMBER: team_member\nOBSERVER: observer', enum_type=models.auth.User.Role, max_length=20)),
            ],
            options={'table': 'user', 'app': 'models', 'pk_attr': 'id'},
            bases=['BaseModel'],
        ),
        ops.CreateModel(
            name='Issue',
            fields=[
                ('id', fields.CharField(primary_key=True, unique=True, db_index=True, max_length=20)),
                ('created_at', fields.DatetimeField(auto_now=False, auto_now_add=True)),
                ('updated_at', fields.DatetimeField(auto_now=True, auto_now_add=False)),
                ('title', fields.CharField(max_length=100)),
                ('priority', fields.SmallIntField(null=True, db_index=True)),
                ('solved_at', fields.DatetimeField(null=True, auto_now=False, auto_now_add=False)),
                ('resolution_note', fields.TextField(null=True, unique=False)),
                ('source', fields.JSONField(null=True, encoder=functools.partial(dumps, separators=(',', ':')), decoder=loads)),
                ('owner', fields.ForeignKeyField('models.User', source_field='owner_id', db_index=True, db_constraint=True, to_field='id', related_name='issues', on_delete=OnDelete.CASCADE)),
                ('team', fields.ForeignKeyField('models.Team', source_field='team_id', db_index=True, db_constraint=True, to_field='id', related_name='issues', on_delete=OnDelete.CASCADE)),
            ],
            options={'table': 'issue', 'app': 'models', 'indexes': [Index(fields=['owner_id', 'team_id'])], 'pk_attr': 'id'},
            bases=['BaseModel'],
        ),
        ops.CreateModel(
            name='Measurable',
            fields=[
                ('id', fields.CharField(primary_key=True, unique=True, db_index=True, max_length=20)),
                ('created_at', fields.DatetimeField(auto_now=False, auto_now_add=True)),
                ('updated_at', fields.DatetimeField(auto_now=True, auto_now_add=False)),
                ('name', fields.CharField(max_length=100)),
                ('unit', fields.CharField(max_length=50)),
                ('goal', fields.JSONField(default=dict, encoder=functools.partial(dumps, separators=(',', ':')), decoder=loads)),
                ('owner', fields.ForeignKeyField('models.User', source_field='owner_id', db_index=True, db_constraint=True, to_field='id', related_name='measurables', on_delete=OnDelete.CASCADE)),
                ('team', fields.ForeignKeyField('models.Team', source_field='team_id', db_index=True, db_constraint=True, to_field='id', related_name='measurables', on_delete=OnDelete.CASCADE)),
            ],
            options={'table': 'measurable', 'app': 'models', 'indexes': [Index(fields=['owner_id', 'team_id'])], 'pk_attr': 'id'},
            bases=['BaseModel'],
        ),
        ops.CreateModel(
            name='Meeting',
            fields=[
                ('id', fields.CharField(primary_key=True, unique=True, db_index=True, max_length=20)),
                ('created_at', fields.DatetimeField(auto_now=False, auto_now_add=True)),
                ('updated_at', fields.DatetimeField(auto_now=True, auto_now_add=False)),
                ('started_at', fields.DatetimeField(auto_now=False, auto_now_add=False)),
                ('ended_at', fields.DatetimeField(null=True, auto_now=False, auto_now_add=False)),
                ('facilitator', fields.ForeignKeyField('models.User', source_field='facilitator_id', db_index=True, db_constraint=True, to_field='id', related_name='meeting_facilitations', on_delete=OnDelete.CASCADE)),
                ('team', fields.ForeignKeyField('models.Team', source_field='team_id', db_index=True, db_constraint=True, to_field='id', related_name='meetings', on_delete=OnDelete.CASCADE)),
            ],
            options={'table': 'meeting', 'app': 'models', 'indexes': [Index(fields=['facilitator_id', 'team_id'])], 'pk_attr': 'id'},
            bases=['BaseModel'],
        ),
        ops.CreateModel(
            name='MeetingAttendee',
            fields=[
                ('id', fields.CharField(primary_key=True, unique=True, db_index=True, max_length=20)),
                ('created_at', fields.DatetimeField(auto_now=False, auto_now_add=True)),
                ('updated_at', fields.DatetimeField(auto_now=True, auto_now_add=False)),
                ('rating', fields.SmallIntField(null=True)),
                ('user', fields.ForeignKeyField('models.User', source_field='user_id', db_index=True, db_constraint=True, to_field='id', related_name='meetings', on_delete=OnDelete.CASCADE)),
                ('meeting', fields.ForeignKeyField('models.Meeting', source_field='meeting_id', db_index=True, db_constraint=True, to_field='id', related_name='attendees', on_delete=OnDelete.CASCADE)),
            ],
            options={'table': 'meetingattendee', 'app': 'models', 'pk_attr': 'id'},
            bases=['BaseModel'],
        ),
        ops.CreateModel(
            name='Membership',
            fields=[
                ('id', fields.CharField(primary_key=True, unique=True, db_index=True, max_length=20)),
                ('created_at', fields.DatetimeField(auto_now=False, auto_now_add=True)),
                ('updated_at', fields.DatetimeField(auto_now=True, auto_now_add=False)),
                ('user', fields.ForeignKeyField('models.User', source_field='user_id', db_constraint=True, to_field='id', related_name='teams', on_delete=OnDelete.CASCADE)),
                ('team', fields.ForeignKeyField('models.Team', source_field='team_id', db_constraint=True, to_field='id', related_name='users', on_delete=OnDelete.CASCADE)),
            ],
            options={'table': 'membership', 'app': 'models', 'unique_together': (('user_id', 'team_id'),), 'pk_attr': 'id'},
            bases=['BaseModel'],
        ),
        ops.CreateModel(
            name='Rock',
            fields=[
                ('id', fields.CharField(primary_key=True, unique=True, db_index=True, max_length=20)),
                ('created_at', fields.DatetimeField(auto_now=False, auto_now_add=True)),
                ('updated_at', fields.DatetimeField(auto_now=True, auto_now_add=False)),
                ('title', fields.CharField(max_length=100)),
                ('quarter', fields.CharField(db_index=True, max_length=7)),
                ('status', fields.CharEnumField(default=models.traction.Rock.Status.ON_TRACK, db_index=True, description='ON_TRACK: on_track\nOFF_TRACT: off_track\nCOMPLETE: complete', enum_type=models.traction.Rock.Status, max_length=9)),
                ('owner', fields.ForeignKeyField('models.User', source_field='owner_id', db_index=True, db_constraint=True, to_field='id', related_name='rocks', on_delete=OnDelete.CASCADE)),
                ('team', fields.ForeignKeyField('models.Team', source_field='team_id', db_index=True, db_constraint=True, to_field='id', related_name='rocks', on_delete=OnDelete.CASCADE)),
            ],
            options={'table': 'rock', 'app': 'models', 'indexes': [Index(fields=['quarter', 'status']), Index(fields=['owner_id', 'team_id'])], 'pk_attr': 'id'},
            bases=['BaseModel'],
        ),
        ops.CreateModel(
            name='Milestone',
            fields=[
                ('id', fields.CharField(primary_key=True, unique=True, db_index=True, max_length=20)),
                ('created_at', fields.DatetimeField(auto_now=False, auto_now_add=True)),
                ('updated_at', fields.DatetimeField(auto_now=True, auto_now_add=False)),
                ('title', fields.CharField(max_length=100)),
                ('due_date', fields.DateField()),
                ('done', fields.BooleanField(default=False, db_index=True)),
                ('rock', fields.ForeignKeyField('models.Rock', source_field='rock_id', db_index=True, db_constraint=True, to_field='id', related_name='milestones', on_delete=OnDelete.CASCADE)),
            ],
            options={'table': 'milestone', 'app': 'models', 'pk_attr': 'id'},
            bases=['BaseModel'],
        ),
        ops.CreateModel(
            name='Score',
            fields=[
                ('id', fields.CharField(primary_key=True, unique=True, db_index=True, max_length=20)),
                ('created_at', fields.DatetimeField(auto_now=False, auto_now_add=True)),
                ('updated_at', fields.DatetimeField(auto_now=True, auto_now_add=False)),
                ('week_start', fields.DateField()),
                ('value', fields.FloatField()),
                ('measurable', fields.ForeignKeyField('models.Measurable', source_field='measurable_id', db_index=True, db_constraint=True, to_field='id', related_name='scores', on_delete=OnDelete.CASCADE)),
            ],
            options={'table': 'score', 'app': 'models', 'unique_together': (('week_start', 'measurable_id'),), 'pk_attr': 'id'},
            bases=['BaseModel'],
        ),
        ops.CreateModel(
            name='Todo',
            fields=[
                ('id', fields.CharField(primary_key=True, unique=True, db_index=True, max_length=20)),
                ('created_at', fields.DatetimeField(auto_now=False, auto_now_add=True)),
                ('updated_at', fields.DatetimeField(auto_now=True, auto_now_add=False)),
                ('title', fields.CharField(max_length=100)),
                ('due_date', fields.DateField()),
                ('done_at', fields.DatetimeField(null=True, auto_now=False, auto_now_add=False)),
                ('source_issue', fields.ForeignKeyField('models.Issue', source_field='source_issue_id', null=True, db_index=True, db_constraint=True, to_field='id', related_name='todos', on_delete=OnDelete.CASCADE)),
                ('owner', fields.ForeignKeyField('models.User', source_field='owner_id', db_index=True, db_constraint=True, to_field='id', related_name='todos', on_delete=OnDelete.CASCADE)),
                ('team', fields.ForeignKeyField('models.Team', source_field='team_id', db_index=True, db_constraint=True, to_field='id', related_name='todos', on_delete=OnDelete.CASCADE)),
            ],
            options={'table': 'todo', 'app': 'models', 'indexes': [Index(fields=['owner_id', 'team_id'])], 'pk_attr': 'id'},
            bases=['BaseModel'],
        ),
    ]
