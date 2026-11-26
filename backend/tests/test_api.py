import asyncio
import unittest

import httpx
from main import app
from models import Issue, Score
from utils.tokens import _create_access_token


class TestTractionAPI(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
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
            "source": {"measurable_id": "m1", "week_start": "2099-01-05"},
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
            "source": {"measurable_id": "m1", "week_start": "2099-01-12"},
        }
        headers = self._auth_headers("u2")
        created_ids: list[str] = []
        try:
            first = await self.client.post(
                "/traction/teams/team_lead/issues", headers=headers, json=payload
            )
            self.assertEqual(first.status_code, 201)
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
            self.assertEqual(second.status_code, 201)
            second_id = second.json()["data"]["id"]
            created_ids.append(second_id)
            self.assertNotEqual(first_id, second_id)
        finally:
            if created_ids:
                await Issue.filter(id__in=created_ids).delete()

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


if __name__ == "__main__":
    unittest.main()
