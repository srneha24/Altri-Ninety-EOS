import unittest
from datetime import UTC, date, datetime

from apps.traction.rules import (
    compute_measurable_status,
    compute_meeting_rating,
    compute_rock_progress,
    compute_rock_status,
    compute_todo_completion,
    get_company_week_bounds,
    round_half_up_1dp,
    round_half_up_int,
    sort_issues,
)


class TestBusinessRules(unittest.TestCase):
    def test_rounding_half_up(self):
        self.assertEqual(round_half_up_int(12.5), 13)
        self.assertEqual(round_half_up_1dp(8.25), 8.3)

    def test_measurable_status_and_boundaries(self):
        current_week = date(2026, 11, 9)
        closed_week = date(2026, 11, 2)

        self.assertEqual(
            compute_measurable_status(
                {"type": "at_least", "value": 10}, 10, closed_week, current_week
            ),
            "on_track",
        )
        self.assertEqual(
            compute_measurable_status(
                {"type": "at_most", "value": 5}, 5, closed_week, current_week
            ),
            "on_track",
        )
        self.assertEqual(
            compute_measurable_status(
                {"type": "between", "min": 3, "max": 7}, 3, closed_week, current_week
            ),
            "on_track",
        )
        self.assertEqual(
            compute_measurable_status(
                {"type": "between", "min": 3, "max": 7}, 7, closed_week, current_week
            ),
            "on_track",
        )
        self.assertEqual(
            compute_measurable_status(
                {"type": "exactly", "value": 4}, 4, closed_week, current_week
            ),
            "on_track",
        )

        self.assertEqual(
            compute_measurable_status(
                {"type": "at_least", "value": 10}, None, closed_week, current_week
            ),
            "off_track",
        )
        self.assertEqual(
            compute_measurable_status(
                {"type": "at_least", "value": 10}, None, current_week, current_week
            ),
            "pending",
        )

    def test_todo_completion_rate_and_boundaries(self):
        week_start, week_end_utc = get_company_week_bounds(date(2026, 11, 2))
        self.assertIsNone(compute_todo_completion([], week_start, week_end_utc))

        todos = [
            {"due_date": date(2026, 11, 6), "done_at": datetime(2026, 11, 8, 12, 0, tzinfo=UTC)}
            for _ in range(9)
        ] + [
            {"due_date": date(2026, 11, 6), "done_at": datetime(2026, 11, 9, 6, 0, 0, tzinfo=UTC)}
        ]
        result = compute_todo_completion(todos, week_start, week_end_utc)
        self.assertIsNotNone(result)
        self.assertEqual(result["rate_percent"], 90)
        self.assertTrue(result["meets_target"])

        # Sub-second before midnight Sunday (2026-11-09 05:59:59.500Z == Sunday 23:59:59.500 CST) counts on time;
        # Monday 00:00:00Z CST (2026-11-09 06:00:00Z) counts late.
        boundary_todos = [
            {"due_date": date(2026, 11, 6), "done_at": datetime(2026, 11, 9, 5, 59, 59, 500000, tzinfo=UTC)},
            {"due_date": date(2026, 11, 6), "done_at": datetime(2026, 11, 9, 6, 0, 0, 0, tzinfo=UTC)},
        ]
        boundary_result = compute_todo_completion(boundary_todos, week_start, week_end_utc)
        self.assertIsNotNone(boundary_result)
        self.assertEqual(boundary_result["done"], 1)
        self.assertEqual(boundary_result["rate_percent"], 50)
        self.assertFalse(boundary_result["meets_target"])

        # 179/200 = 89.5% rounds half-up to 90%, but exact ratio is < 90% so meets_target is False
        rounded_90_todos = [
            {"due_date": date(2026, 11, 6), "done_at": datetime(2026, 11, 8, 12, 0, tzinfo=UTC)}
            for _ in range(179)
        ] + [
            {"due_date": date(2026, 11, 6), "done_at": None}
            for _ in range(21)
        ]
        rounded_90_result = compute_todo_completion(rounded_90_todos, week_start, week_end_utc)
        self.assertIsNotNone(rounded_90_result)
        self.assertEqual(rounded_90_result["rate_percent"], 90)
        self.assertFalse(rounded_90_result["meets_target"])

    def test_rock_status_and_boundaries(self):
        today = date(2026, 11, 11)
        self.assertEqual(
            compute_rock_status("on_track", [{"done": False, "due_date": today}], today),
            "on_track",
        )
        self.assertEqual(
            compute_rock_status(
                "on_track",
                [{"done": False, "due_date": date(2026, 11, 10)}],
                today,
            ),
            "off_track",
        )
        self.assertEqual(compute_rock_status("off_track", [], today), "off_track")
        self.assertEqual(compute_rock_status("complete", [], today), "complete")

    def test_rock_progress_and_boundaries(self):
        self.assertEqual(compute_rock_progress("on_track", []), 0)
        self.assertEqual(compute_rock_progress("complete", []), 100)
        milestones = [{"done": True}] + [{"done": False} for _ in range(7)]
        self.assertEqual(compute_rock_progress("on_track", milestones), 13)

    def test_issue_order_and_boundaries(self):
        t1 = datetime(2026, 11, 1, 10, 0, tzinfo=UTC)
        t2 = datetime(2026, 11, 2, 10, 0, tzinfo=UTC)
        issues = [
            {"id": "no_prio", "priority": None, "created_at": t1},
            {"id": "p3_newer", "priority": 3, "created_at": t2},
            {"id": "p3_older", "priority": 3, "created_at": t1},
            {"id": "p5", "priority": 5, "created_at": t2},
        ]
        ordered = [issue["id"] for issue in sort_issues(issues)]
        self.assertEqual(ordered, ["p5", "p3_older", "p3_newer", "no_prio"])

    def test_meeting_rating_and_boundaries(self):
        self.assertEqual(compute_meeting_rating([8, 8, 9, 8, None]), 8.3)
        self.assertIsNone(compute_meeting_rating([None, None]))


if __name__ == "__main__":
    unittest.main()
