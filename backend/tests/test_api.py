import asyncio
from datetime import date, timedelta
import unittest

import httpx
from main import app
from models import Issue, Meeting, MeetingAttendee, Rock, Score, Team, Todo
from models._base_db_model import BaseModel
from tortoise import connections
from tortoise.exceptions import IntegrityError
from rules_report import build_team_report
from utils.clock import freeze_app_now, get_app_now, reset_app_clock
from utils.tokens import _create_access_token


class TestTractionAPI(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        freeze_app_now()
        self.lifespan_cm = app.router.lifespan_context(app)
        await self.lifespan_cm.__aenter__()
        self.client_cm = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app),
            base_url="http://testserver",
        )
        self.client = await self.client_cm.__aenter__()

    async def asyncTearDown(self):
        await self.client_cm.__aexit__(None, None, None)
        await self.lifespan_cm.__aexit__(None, None, None)
        reset_app_clock()

    def _auth_headers(self, user_id: str) -> dict[str, str]:
        token = _create_access_token(sub=user_id)
        return {"Authorization": f"Bearer {token}"}

    async def test_team_member_reading_another_team_is_refused(self):
        resp = await self.client.get(
            "/traction/teams/team_lead/scorecard?start_date=2026-08-17&end_date=2026-11-09",
            headers=self._auth_headers("u6"),
        )
        self.assertEqual(resp.status_code, 403)

    async def test_cross_team_item_idor_is_refused(self):
        resp = await self.client.patch(
            "/traction/teams/team_sales/issues/i1",
            headers=self._auth_headers("u6"),
            json={"priority": 5},
        )
        self.assertEqual(resp.status_code, 404)

    async def test_observer_write_is_refused(self):
        resp = await self.client.post(
            "/traction/teams/team_lead/issues",
            headers=self._auth_headers("u5"),
            json={"title": "Observer should not create"},
        )
        self.assertEqual(resp.status_code, 403)

    async def test_concurrent_make_it_an_issue_returns_one_issue(self):
        payload = {
            "title": "Concurrent Make it an Issue",
            "source": {"measurable_id": "m1", "week_start": "2026-08-10"},
        }
        headers = self._auth_headers("u2")
        created_id = None
        try:
            r1, r2 = await asyncio.gather(
                self.client.post("/traction/teams/team_lead/issues", headers=headers, json=payload),
                self.client.post("/traction/teams/team_lead/issues", headers=headers, json=payload),
            )
            self.assertIn(r1.status_code, (200, 201))
            self.assertIn(r2.status_code, (200, 201))
            id1 = r1.json()["data"]["id"]
            id2 = r2.json()["data"]["id"]
            created_id = id1
            self.assertEqual(id1, id2)
        finally:
            if created_id:
                await Issue.filter(id=created_id).delete()

    async def test_make_it_an_issue_after_solved_creates_new_issue(self):
        payload = {
            "source": {"measurable_id": "m1", "week_start": "2025-01-06"},
        }
        headers = self._auth_headers("u2")
        created_ids: list[str] = []
        try:
            first = await self.client.post(
                "/traction/teams/team_lead/issues", headers=headers, json=payload
            )
            self.assertIn(first.status_code, (200, 201))
            first_id = first.json()["data"]["id"]
            created_ids.append(first_id)

            solve = await self.client.patch(
                f"/traction/teams/team_lead/issues/{first_id}",
                headers=headers,
                json={"resolution_note": "Resolved"},
            )
            self.assertEqual(solve.status_code, 200)

            second = await self.client.post(
                "/traction/teams/team_lead/issues", headers=headers, json=payload
            )
            self.assertIn(second.status_code, (200, 201))
            second_id = second.json()["data"]["id"]
            created_ids.append(second_id)
            self.assertNotEqual(first_id, second_id)
        finally:
            if created_ids:
                await Issue.filter(id__in=created_ids).delete()

    async def test_postgres_rejects_duplicate_unresolved_source_issue(self):
        payload = {
            "source": {"measurable_id": "m1", "week_start": "2025-02-03"}
        }
        response = await self.client.post(
            "/traction/teams/team_lead/issues",
            headers=self._auth_headers("u2"),
            json=payload,
        )
        self.assertIn(response.status_code, (200, 201), response.text)
        issue_id = response.json()["data"]["id"]
        timestamp = get_app_now()
        duplicate = Issue(
            id="i_dbduplicate",
            title="DB duplicate",
            priority=None,
            solved_at=None,
            resolution_note=None,
            source={"measurable_id": "m1", "week_start": "2025-02-03"},
            source_measurable_id="m1",
            owner_id="u2",
            team_id="team_lead",
            created_at=timestamp,
            updated_at=timestamp,
        )
        try:
            with self.assertRaises(IntegrityError):
                await BaseModel.save(duplicate, force_create=True)
        finally:
            await Issue.filter(id=issue_id).delete()

    async def test_postgres_enforces_cross_field_integrity(self):
        with self.assertRaises(IntegrityError):
            await Todo.filter(id="t1").update(source_issue_id="i8")

        with self.assertRaises(IntegrityError):
            await connections.get("default").execute_query(
                "UPDATE rock SET status = $1 WHERE id = $2", ["invalid", "r1"]
            )

        score = await Score.filter(measurable_id="m1").first()
        self.assertIsNotNone(score)
        with self.assertRaises(IntegrityError):
            await Score.filter(id=score.id).update(value=float("nan"))

        issue_response = await self.client.post(
            "/traction/teams/team_lead/issues",
            headers=self._auth_headers("u2"),
            json={"title": "Resolution constraint check"},
        )
        self.assertIn(issue_response.status_code, (200, 201), issue_response.text)
        issue_id = issue_response.json()["data"]["id"]
        try:
            with self.assertRaises(IntegrityError):
                await Issue.filter(id=issue_id).update(solved_at=get_app_now())
        finally:
            await Issue.filter(id=issue_id).delete()

        meeting = await Meeting.filter(ended_at__isnull=False).first()
        self.assertIsNotNone(meeting)
        with self.assertRaises(IntegrityError):
            await Meeting.filter(id=meeting.id).update(
                ids_started_at=meeting.started_at - timedelta(seconds=1)
            )

    async def test_upsert_score_for_unscored_week(self):
        headers = self._auth_headers("u2")
        score_id = None
        try:
            resp = await self.client.put(
                "/traction/teams/team_lead/measurables/m1/scores/2099-01-05",
                headers=headers,
                json={"value": 42},
            )
            self.assertEqual(resp.status_code, 201)
            score_id = resp.json()["data"]["id"]
            self.assertEqual(resp.json()["data"]["value"], 42)
        finally:
            if score_id:
                await Score.filter(id=score_id).delete()

    async def test_quarterly_rocks_includes_milestones(self):
        resp = await self.client.get(
            "/traction/teams/team_lead/quarterly-rocks?quarter=2026-Q4",
            headers=self._auth_headers("u2"),
        )
        self.assertEqual(resp.status_code, 200)
        rocks = resp.json()["data"]
        self.assertTrue(len(rocks) > 0)
        self.assertIn("milestones", rocks[0])
        self.assertIn("progress_percent", rocks[0])

    async def test_admin_can_access_all_teams(self):
        teams_resp = await self.client.get("/auth/teams", headers=self._auth_headers("u1"))
        self.assertEqual(teams_resp.status_code, 200)
        team_ids = {t["id"] for t in teams_resp.json()["data"]["teams"]}
        self.assertTrue({"team_lead", "team_sales", "team_ops"}.issubset(team_ids))

        sales_resp = await self.client.get(
            "/traction/teams/team_sales/scorecard?start_date=2026-08-17&end_date=2026-11-09",
            headers=self._auth_headers("u1"),
        )
        self.assertEqual(sales_resp.status_code, 200)

    async def test_todo_and_score_authorization(self):
        cross_team_todo = await self.client.get(
            "/traction/teams/team_lead/todos",
            headers=self._auth_headers("u6"),
        )
        self.assertEqual(cross_team_todo.status_code, 403)

        observer_todo = await self.client.post(
            "/traction/teams/team_lead/todos",
            headers=self._auth_headers("u5"),
            json={"title": "Observer todo", "owner_id": "u2"},
        )
        self.assertEqual(observer_todo.status_code, 403)

        observer_score = await self.client.put(
            "/traction/teams/team_lead/measurables/m1/scores/2026-11-09",
            headers=self._auth_headers("u5"),
            json={"value": 10},
        )
        self.assertEqual(observer_score.status_code, 403)

    async def test_meeting_authorization_and_rating_section_guards(self):
        # Observer cannot start a meeting
        obs_start = await self.client.post(
            "/traction/teams/team_lead/meetings/state",
            headers=self._auth_headers("u5"),
            json={"state": "start"},
        )
        self.assertEqual(obs_start.status_code, 403)

        # Clean up any leftover active meeting on team_lead before starting
        await Meeting.filter(team_id="team_lead", ended_at__isnull=True).delete()

        meeting_id = None
        try:
            start = await self.client.post(
                "/traction/teams/team_lead/meetings/state",
                headers=self._auth_headers("u2"),
                json={"state": "start"},
            )
            self.assertEqual(start.status_code, 200)
            meeting_id = start.json()["data"]["id"]

            # Observer can join, but cannot rate or advance
            obs_join = await self.client.post(
                f"/traction/teams/team_lead/meetings/{meeting_id}/attendees",
                headers=self._auth_headers("u5"),
            )
            self.assertEqual(obs_join.status_code, 200)

            obs_advance = await self.client.post(
                "/traction/teams/team_lead/meetings/state",
                headers=self._auth_headers("u5"),
                json={"state": "ids", "meeting_id": meeting_id},
            )
            self.assertEqual(obs_advance.status_code, 403)

            obs_rate = await self.client.post(
                f"/traction/teams/team_lead/meetings/{meeting_id}/ratings",
                headers=self._auth_headers("u5"),
                json={"rating": 8},
            )
            self.assertEqual(obs_rate.status_code, 403)

            # Non-facilitator team member cannot advance
            non_fac_advance = await self.client.post(
                "/traction/teams/team_lead/meetings/state",
                headers=self._auth_headers("u3"),
                json={"state": "ids", "meeting_id": meeting_id},
            )
            self.assertEqual(non_fac_advance.status_code, 403)

            # Rating outside Conclude section is rejected
            early_rate = await self.client.post(
                f"/traction/teams/team_lead/meetings/{meeting_id}/ratings",
                headers=self._auth_headers("u2"),
                json={"rating": 9},
            )
            self.assertEqual(early_rate.status_code, 400)
        finally:
            if meeting_id:
                await Meeting.filter(id=meeting_id).delete()

    async def test_active_meeting_database_guard_and_restart(self):
        created_ids: list[str] = []

        async def start(team_id: str, user_id: str):
            response = await self.client.post(
                f"/traction/teams/{team_id}/meetings/state",
                headers=self._auth_headers(user_id),
                json={"state": "start"},
            )
            if response.status_code == 200:
                created_ids.append(response.json()["data"]["id"])
            return response

        try:
            concurrent = await asyncio.gather(
                start("team_lead", "u2"), start("team_lead", "u2")
            )
            self.assertEqual(
                sorted(response.status_code for response in concurrent), [200, 400]
            )
            first = next(response for response in concurrent if response.status_code == 200)
            first_id = first.json()["data"]["id"]

            second = await start("team_lead", "u2")
            self.assertEqual(second.status_code, 400)

            other_team = await start("team_ops", "u8")
            self.assertEqual(other_team.status_code, 200, other_team.text)

            ended = await self.client.post(
                "/traction/teams/team_lead/meetings/state",
                headers=self._auth_headers("u2"),
                json={"state": "end", "meeting_id": first_id},
            )
            self.assertEqual(ended.status_code, 200, ended.text)
            self.assertTrue(ended.json()["data"]["summary"])

            restarted = await start("team_lead", "u2")
            self.assertEqual(restarted.status_code, 200, restarted.text)
        finally:
            if created_ids:
                await Meeting.filter(id__in=created_ids).delete()

    async def test_ended_meeting_snapshot_survives_later_record_changes(self):
        headers = self._auth_headers("u2")
        meeting_id = issue_id = todo_id = None
        reviewed_score = await Score.get_or_none(
            measurable_id="m1", week_start=date(2026, 11, 2)
        )
        original_score = reviewed_score.value if reviewed_score else None
        try:
            started = await self.client.post(
                "/traction/teams/team_lead/meetings/state",
                headers=headers,
                json={"state": "start"},
            )
            self.assertEqual(started.status_code, 200, started.text)
            meeting_id = started.json()["data"]["id"]

            issue_response = await self.client.post(
                "/traction/teams/team_lead/issues",
                headers=headers,
                json={"title": "Snapshot issue"},
            )
            self.assertIn(issue_response.status_code, (200, 201), issue_response.text)
            issue_id = issue_response.json()["data"]["id"]

            todo_response = await self.client.post(
                "/traction/teams/team_lead/todos",
                headers=headers,
                json={"title": "Snapshot todo", "owner_id": "u2", "source_issue_id": issue_id},
            )
            self.assertEqual(todo_response.status_code, 201, todo_response.text)
            todo_id = todo_response.json()["data"]["id"]

            if reviewed_score:
                reviewed_score.value = 99
                await reviewed_score.save()

            for state in ("conclude",):
                transitioned = await self.client.post(
                    "/traction/teams/team_lead/meetings/state",
                    headers=headers,
                    json={"state": state, "meeting_id": meeting_id},
                )
                self.assertEqual(transitioned.status_code, 200, transitioned.text)
            rating = await self.client.post(
                f"/traction/teams/team_lead/meetings/{meeting_id}/ratings",
                headers=headers,
                json={"rating": 9},
            )
            self.assertEqual(rating.status_code, 200, rating.text)

            ended = await self.client.post(
                "/traction/teams/team_lead/meetings/state",
                headers=headers,
                json={"state": "end", "meeting_id": meeting_id},
            )
            self.assertEqual(ended.status_code, 200, ended.text)
            saved_summary = ended.json()["data"]["summary"]
            self.assertTrue(saved_summary["issues"]["created"])
            self.assertTrue(saved_summary["todos"]["created"])
            self.assertEqual(saved_summary["average_rating"], 9)

            issue = await Issue.get(id=issue_id)
            issue.title = "Changed after meeting"
            await issue.save()
            todo = await Todo.get(id=todo_id)
            todo.title = "Changed after meeting"
            await todo.save()
            if reviewed_score:
                reviewed_score.value = -99
                await reviewed_score.save()
            attendee = await MeetingAttendee.get(meeting_id=meeting_id, user_id="u2")
            attendee.rating = 1
            await attendee.save()

            summary_response = await self.client.get(
                f"/traction/teams/team_lead/meetings/{meeting_id}/summary",
                headers=headers,
            )
            self.assertEqual(summary_response.status_code, 200)
            self.assertEqual(summary_response.json()["data"], saved_summary)

            team = await Team.get(id="team_lead").select_related("company")
            report = await build_team_report(team, get_app_now())
            self.assertEqual(
                report["meetings"][meeting_id]["measurable_status"],
                {
                    item["id"]: item["status"]
                    for item in saved_summary["measurables"]
                },
            )
            self.assertEqual(
                report["meetings"][meeting_id]["todos_created"], [todo_id]
            )
            self.assertEqual(report["meetings"][meeting_id]["rating"], 9)
        finally:
            if reviewed_score and original_score is not None:
                reviewed_score.value = original_score
                await reviewed_score.save()
            if meeting_id:
                await Meeting.filter(id=meeting_id).delete()
            if todo_id:
                await Todo.filter(id=todo_id).delete()
            if issue_id:
                await Issue.filter(id=issue_id).delete()

    async def test_blank_title_and_on_track_issue_rejected(self):
        blank_todo = await self.client.post(
            "/traction/teams/team_lead/todos",
            headers=self._auth_headers("u2"),
            json={"title": "   ", "owner_id": "u2"},
        )
        # The blank-title rejection is enforced by the custom request-validation
        # handler which replies with HTTP 400 (not pydantic's 422).
        self.assertEqual(blank_todo.status_code, 400)

        on_track_issue = await self.client.post(
            "/traction/teams/team_lead/issues",
            headers=self._auth_headers("u2"),
            json={"source": {"measurable_id": "m1", "week_start": "2026-08-17"}},
        )
        self.assertEqual(on_track_issue.status_code, 400)


if __name__ == "__main__":
    unittest.main()
