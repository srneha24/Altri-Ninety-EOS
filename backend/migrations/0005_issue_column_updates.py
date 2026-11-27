from tortoise import migrations
from tortoise.migrations import operations as ops
from tortoise.fields.base import OnDelete
from utils.clock import get_app_now
from tortoise import fields

class Migration(migrations.Migration):
    dependencies = [('models', '0004_db_constraints')]

    initial = False

    operations = [
        ops.AlterField(
            model_name='Company',
            name='created_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Company',
            name='updated_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Issue',
            name='created_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Issue',
            name='updated_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AddField(
            model_name='Issue',
            name='source_measurable',
            field=fields.ForeignKeyField('models.Measurable', source_field='source_measurable_id', null=True, db_constraint=False, to_field='id', related_name='source_issues', on_delete=OnDelete.RESTRICT),
        ),
        ops.AddField(
            model_name='Issue',
            name='source_rock',
            field=fields.ForeignKeyField('models.Rock', source_field='source_rock_id', null=True, db_constraint=False, to_field='id', related_name='source_issues', on_delete=OnDelete.RESTRICT),
        ),
        ops.AddField(
            model_name='Issue',
            name='source_todo',
            field=fields.ForeignKeyField('models.Todo', source_field='source_todo_id', null=True, db_constraint=False, to_field='id', related_name='source_issues', on_delete=OnDelete.RESTRICT),
        ),
        ops.AlterField(
            model_name='Measurable',
            name='created_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Measurable',
            name='updated_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Meeting',
            name='created_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Meeting',
            name='updated_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='MeetingAttendee',
            name='created_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='MeetingAttendee',
            name='updated_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Membership',
            name='created_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Membership',
            name='updated_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Milestone',
            name='created_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Milestone',
            name='updated_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Rock',
            name='created_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Rock',
            name='updated_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Score',
            name='created_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Score',
            name='updated_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Team',
            name='created_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Team',
            name='updated_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Todo',
            name='created_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='Todo',
            name='updated_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='User',
            name='created_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.AlterField(
            model_name='User',
            name='updated_at',
            field=fields.DatetimeField(default=get_app_now, auto_now=False, auto_now_add=False),
        ),
        ops.RunSQL(
            sql=[
                """
                UPDATE issue
                SET source_measurable_id = source->>'measurable_id',
                    source_rock_id = source->>'rock_id',
                    source_todo_id = source->>'todo_id'
                WHERE source IS NOT NULL
                """,
                "CREATE UNIQUE INDEX uq_measurable_id_team ON measurable (id, team_id)",
                "CREATE UNIQUE INDEX uq_rock_id_team ON rock (id, team_id)",
                "CREATE UNIQUE INDEX uq_todo_id_team ON todo (id, team_id)",
                """
                ALTER TABLE issue ADD CONSTRAINT fk_issue_source_measurable_team
                FOREIGN KEY (source_measurable_id, team_id)
                REFERENCES measurable (id, team_id) ON DELETE RESTRICT
                """,
                """
                ALTER TABLE issue ADD CONSTRAINT fk_issue_source_rock_team
                FOREIGN KEY (source_rock_id, team_id)
                REFERENCES rock (id, team_id) ON DELETE RESTRICT
                """,
                """
                ALTER TABLE issue ADD CONSTRAINT fk_issue_source_todo_team
                FOREIGN KEY (source_todo_id, team_id)
                REFERENCES todo (id, team_id) ON DELETE RESTRICT
                """,
                """
                ALTER TABLE issue ADD CONSTRAINT chk_issue_source_shape
                CHECK (
                    (source IS NULL AND source_measurable_id IS NULL
                     AND source_rock_id IS NULL AND source_todo_id IS NULL)
                    OR
                    (jsonb_typeof(source) = 'object'
                     AND source->>'measurable_id' IS NOT DISTINCT FROM source_measurable_id
                     AND source->>'rock_id' IS NOT DISTINCT FROM source_rock_id
                     AND source->>'todo_id' IS NOT DISTINCT FROM source_todo_id
                     AND (
                         (source_measurable_id IS NOT NULL
                          AND source_rock_id IS NULL AND source_todo_id IS NULL
                          AND jsonb_typeof(source->'measurable_id') = 'string'
                          AND source_measurable_id <> ''
                          AND jsonb_typeof(source->'week_start') = 'string'
                          AND (source->>'week_start') ~ '^\\d{4}-\\d{2}-\\d{2}$'
                          AND CASE WHEN (source->>'week_start') ~ '^\\d{4}-\\d{2}-\\d{2}$'
                              THEN EXTRACT(ISODOW FROM (source->>'week_start')::date) = 1
                              ELSE FALSE END)
                         OR
                         (source_rock_id IS NOT NULL
                          AND source_measurable_id IS NULL AND source_todo_id IS NULL
                          AND jsonb_typeof(source->'rock_id') = 'string'
                          AND source_rock_id <> '' AND NOT (source ? 'week_start'))
                         OR
                         (source_todo_id IS NOT NULL
                          AND source_measurable_id IS NULL AND source_rock_id IS NULL
                          AND jsonb_typeof(source->'todo_id') = 'string'
                          AND source_todo_id <> '' AND NOT (source ? 'week_start'))
                     ))
                )
                """,
                "CREATE UNIQUE INDEX uq_issue_id_team ON issue (id, team_id)",
                """
                ALTER TABLE todo ADD CONSTRAINT fk_todo_source_issue_team
                FOREIGN KEY (source_issue_id, team_id)
                REFERENCES issue (id, team_id) ON DELETE RESTRICT
                """,
                """
                ALTER TABLE issue ADD CONSTRAINT chk_issue_resolution_state
                CHECK (
                    (solved_at IS NULL AND resolution_note IS NULL)
                    OR (solved_at IS NOT NULL AND resolution_note IS NOT NULL
                        AND btrim(resolution_note) <> '')
                )
                """,
                """
                ALTER TABLE meeting ADD CONSTRAINT chk_meeting_event_order
                CHECK (
                    (ids_started_at IS NULL OR ids_started_at >= started_at)
                    AND (conclude_started_at IS NULL OR
                         conclude_started_at >= COALESCE(ids_started_at, started_at))
                    AND (ended_at IS NULL OR
                         ended_at >= COALESCE(conclude_started_at, ids_started_at, started_at))
                )
                """,
                "ALTER TABLE rock ADD CONSTRAINT chk_rock_status CHECK (status IN ('on_track', 'off_track', 'complete'))",
                """
                ALTER TABLE score ADD CONSTRAINT chk_score_finite_value
                CHECK (value NOT IN (
                    'NaN'::double precision,
                    'Infinity'::double precision,
                    '-Infinity'::double precision
                ))
                """,
            ],
            reverse_sql=[
                "ALTER TABLE score DROP CONSTRAINT IF EXISTS chk_score_finite_value",
                "ALTER TABLE rock DROP CONSTRAINT IF EXISTS chk_rock_status",
                "ALTER TABLE meeting DROP CONSTRAINT IF EXISTS chk_meeting_event_order",
                "ALTER TABLE issue DROP CONSTRAINT IF EXISTS chk_issue_resolution_state",
                "ALTER TABLE todo DROP CONSTRAINT IF EXISTS fk_todo_source_issue_team",
                "DROP INDEX IF EXISTS uq_issue_id_team",
                "ALTER TABLE issue DROP CONSTRAINT IF EXISTS chk_issue_source_shape",
                "ALTER TABLE issue DROP CONSTRAINT IF EXISTS fk_issue_source_todo_team",
                "ALTER TABLE issue DROP CONSTRAINT IF EXISTS fk_issue_source_rock_team",
                "ALTER TABLE issue DROP CONSTRAINT IF EXISTS fk_issue_source_measurable_team",
                "DROP INDEX IF EXISTS uq_todo_id_team",
                "DROP INDEX IF EXISTS uq_rock_id_team",
                "DROP INDEX IF EXISTS uq_measurable_id_team",
            ],
        ),
    ]
