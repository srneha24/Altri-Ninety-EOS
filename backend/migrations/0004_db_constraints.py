from tortoise import migrations
from tortoise.migrations import operations as ops


class Migration(migrations.Migration):
    dependencies = [("models", "0003_meeting_summary_column")]

    initial = False

    operations = [
        ops.RunSQL(
            sql=[
                """
                CREATE UNIQUE INDEX IF NOT EXISTS uq_meeting_one_active_per_team
                ON meeting (team_id)
                WHERE ended_at IS NULL
                """,
                """
                CREATE UNIQUE INDEX IF NOT EXISTS uq_issue_open_measurable_week
                ON issue (team_id, (source->>'measurable_id'), (source->>'week_start'))
                WHERE solved_at IS NULL AND source IS NOT NULL AND source ? 'measurable_id'
                """,
                """
                CREATE UNIQUE INDEX IF NOT EXISTS uq_issue_open_rock
                ON issue (team_id, (source->>'rock_id'))
                WHERE solved_at IS NULL AND source IS NOT NULL AND source ? 'rock_id'
                """,
                """
                CREATE UNIQUE INDEX IF NOT EXISTS uq_issue_open_todo
                ON issue (team_id, (source->>'todo_id'))
                WHERE solved_at IS NULL AND source IS NOT NULL AND source ? 'todo_id'
                """,
                """
                ALTER TABLE issue
                ADD CONSTRAINT chk_issue_priority_range
                CHECK (priority IS NULL OR (priority >= 1 AND priority <= 5))
                """,
                """
                ALTER TABLE issue
                ADD CONSTRAINT chk_issue_title_nonblank
                CHECK (btrim(title) <> '')
                """,
                """
                ALTER TABLE todo
                ADD CONSTRAINT chk_todo_title_nonblank
                CHECK (btrim(title) <> '')
                """,
                """
                ALTER TABLE meetingattendee
                ADD CONSTRAINT chk_meetingattendee_rating_range
                CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10))
                """,
                """
                ALTER TABLE score
                ADD CONSTRAINT chk_score_week_start_monday
                CHECK (EXTRACT(ISODOW FROM week_start) = 1)
                """,
            ],
            reverse_sql=[
                "ALTER TABLE score DROP CONSTRAINT IF EXISTS chk_score_week_start_monday",
                "ALTER TABLE meetingattendee DROP CONSTRAINT IF EXISTS chk_meetingattendee_rating_range",
                "ALTER TABLE todo DROP CONSTRAINT IF EXISTS chk_todo_title_nonblank",
                "ALTER TABLE issue DROP CONSTRAINT IF EXISTS chk_issue_title_nonblank",
                "ALTER TABLE issue DROP CONSTRAINT IF EXISTS chk_issue_priority_range",
                "DROP INDEX IF EXISTS uq_issue_open_todo",
                "DROP INDEX IF EXISTS uq_issue_open_rock",
                "DROP INDEX IF EXISTS uq_issue_open_measurable_week",
                "DROP INDEX IF EXISTS uq_meeting_one_active_per_team",
            ],
        ),
    ]
