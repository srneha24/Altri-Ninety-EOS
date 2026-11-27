import copy
import json
import unittest
from collections import defaultdict
from pathlib import Path
from unittest.mock import AsyncMock, patch

import seed


class _Record:
    def __init__(self, **values):
        self.__dict__.update(values)

    async def save(self):
        raise AssertionError("Insert-only seeding must not save an existing record")


class _Query:
    def __init__(self, records):
        self.records = records

    async def first(self):
        return self.records[0] if self.records else None

    async def all(self):
        return self.records


class _FakeModel:
    records: dict[str, _Record] = {}  # noqa: RUF012

    @classmethod
    async def get_or_create(cls, *, id, defaults):
        record = cls.records.get(id)
        if record is not None:
            return record, False
        record = _Record(id=id, **defaults)
        cls.records[id] = record
        return record, True

    @classmethod
    def filter(cls, **criteria):
        return _Query(
            [
                record
                for record in cls.records.values()
                if all(getattr(record, key) == value for key, value in criteria.items())
            ]
        )

    @classmethod
    async def create(cls, *, id, **defaults):
        record = _Record(id=id, **defaults)
        cls.records[id] = record
        return record


def _model(name: str):
    return type(name, (_FakeModel,), {"records": {}})


class TestInsertOnlySeedHelpers(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.stats = defaultdict(lambda: {"created": 0, "updated": 0})

    async def test_existing_seed_records_are_not_changed(self):
        cases = [
            ("Score", {"value": 1}, {"value": 99}),
            ("Issue", {"priority": 1}, {"priority": 5}),
            ("Todo", {"done_at": None}, {"done_at": "modified"}),
            ("MeetingAttendee", {"rating": 3}, {"rating": 10}),
        ]
        for name, defaults, modified in cases:
            model = _model(name)
            self.assertTrue(
                await seed.seed_record(model, "seeded", defaults, self.stats)
            )
            record = model.records["seeded"]
            record.__dict__.update(modified)

            self.assertFalse(
                await seed.seed_record(model, "seeded", defaults, self.stats)
            )
            for field, value in modified.items():
                self.assertEqual(getattr(record, field), value)

    async def test_keyed_records_preserve_existing_values_and_logical_records(self):
        model = _model("Score")
        seeded_id = seed.derived_id("score", "m1", "2026-11-09")
        await model.create(
            id=seeded_id,
            measurable_id="m1",
            week_start="2026-11-09",
            value=42,
        )
        self.assertFalse(
            await seed.seed_keyed_record(
                model,
                seeded_id,
                {"measurable_id": "m1", "week_start": "2026-11-09"},
                {"measurable_id": "m1", "week_start": "2026-11-09", "value": 1},
                self.stats,
            )
        )
        self.assertEqual(model.records[seeded_id].value, 42)

        legacy_id = "legacy_score"
        await model.create(
            id=legacy_id,
            measurable_id="m2",
            week_start="2026-11-09",
            value=27,
        )
        self.assertFalse(
            await seed.seed_keyed_record(
                model,
                seed.derived_id("score", "m2", "2026-11-09"),
                {"measurable_id": "m2", "week_start": "2026-11-09"},
                {"measurable_id": "m2", "week_start": "2026-11-09", "value": 1},
                self.stats,
            )
        )
        self.assertEqual(model.records[legacy_id].value, 27)

    async def test_missing_records_are_inserted_and_id_collisions_raise(self):
        model = _model("MeetingAttendee")
        identifier = seed.derived_id("att", "meeting", "user")
        self.assertTrue(
            await seed.seed_keyed_record(
                model,
                identifier,
                {"meeting_id": "meeting", "user_id": "user"},
                {"meeting_id": "meeting", "user_id": "user", "rating": 8},
                self.stats,
            )
        )
        self.assertEqual(model.records[identifier].rating, 8)

        with self.assertRaisesRegex(ValueError, "Generated ID collision"):
            await seed.seed_keyed_record(
                model,
                identifier,
                {"meeting_id": "other", "user_id": "user"},
                {"meeting_id": "other", "user_id": "user", "rating": 8},
                self.stats,
            )

    async def test_user_created_records_are_not_removed(self):
        model = _model("Issue")
        await model.create(id="user_issue", title="Keep me")
        await seed.seed_record(model, "seeded_issue", {"title": "Seeded"}, self.stats)
        self.assertIn("user_issue", model.records)
        self.assertEqual(model.records["user_issue"].title, "Keep me")


class TestSeedValidation(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.seed_data = json.loads(
            (Path(__file__).resolve().parents[2] / "seed.json").read_text(
                encoding="utf-8"
            )
        )

    async def _seed_with_no_writes(self, seed_data):
        with (
            patch.object(seed, "seed_record", new=AsyncMock(return_value=False)),
            patch.object(seed, "seed_keyed_record", new=AsyncMock(return_value=False)),
        ):
            await seed.seed_records.__wrapped__(
                seed_data, defaultdict(lambda: {"created": 0, "updated": 0})
            )

    async def test_duplicate_attendees_and_invalid_ratings_still_raise(self):
        duplicate_attendees = copy.deepcopy(self.seed_data)
        duplicate_attendees["meetings"][0]["attendee_ids"].append(
            duplicate_attendees["meetings"][0]["attendee_ids"][0]
        )
        with self.assertRaisesRegex(ValueError, "duplicate attendees"):
            await self._seed_with_no_writes(duplicate_attendees)

        invalid_rating = copy.deepcopy(self.seed_data)
        invalid_rating["meetings"][0]["ratings"][0]["rating"] = 11
        with self.assertRaisesRegex(ValueError, "invalid rating"):
            await self._seed_with_no_writes(invalid_rating)

    async def test_existing_meeting_summaries_are_not_rebuilt(self):
        with (
            patch.object(seed, "seed_record", new=AsyncMock(return_value=False)),
            patch.object(seed, "seed_keyed_record", new=AsyncMock(return_value=False)),
            patch.object(
                seed, "build_meeting_summary", new=AsyncMock()
            ) as build_summary,
        ):
            await seed.seed_records.__wrapped__(
                self.seed_data, defaultdict(lambda: {"created": 0, "updated": 0})
            )

        build_summary.assert_not_awaited()

    def test_timezone_qualified_timestamps_remain_required(self):
        with self.assertRaisesRegex(ValueError, "must include a timezone"):
            seed.parse_timestamp("2026-11-11T15:00:00")


if __name__ == "__main__":
    unittest.main()
