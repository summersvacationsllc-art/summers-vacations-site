"""Public guest feed must not contain names or reservation ids.

Run: python3 -m unittest scripts.tests.test_public_guest_privacy -v
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE.parent))

import build_fleet_today as fleet  # noqa: E402
import build_guest_today as guest  # noqa: E402
import public_guest_privacy as privacy  # noqa: E402
import verify_guest_live as verify  # noqa: E402

SECRET_NAME = "Casey Placeholder"
SECRET_ID = "res_placeholder"


def calendar() -> dict:
    return {
        "reservations": [
            {
                "property_id": "p1",
                "property_name": "Example Cabin",
                "guest_name": SECRET_NAME,
                "guests": 4,
                "source": "Airbnb",
                "id": SECRET_ID,
                "check_in": "2026-11-18",
                "check_out": "2026-11-20",
                "check_in_time": "16:00",
                "check_out_time": "10:00",
            }
        ]
    }


def tasks() -> dict:
    return {
        "tasks": [
            {
                "scheduled_date": "2026-11-18",
                "property_id": "p1",
                "type": "turnover",
                "status": "pending",
                "guesty_reservation_id": SECRET_ID,
                "cleaner_id": None,
                "is_same_day": False,
                "checkout_time": "10:00",
                "next_checkin": "16:00",
            }
        ]
    }


class PublicFeed(unittest.TestCase):
    def test_guest_snapshot_omits_name_and_reservation_id(self):
        out = guest.snapshot("2026-11-18", calendar(), tasks())
        blob = json.dumps(out)
        self.assertNotIn(SECRET_NAME, blob)
        self.assertNotIn(SECRET_ID, blob)
        self.assertEqual(out["in_house"][0]["property"], "Example Cabin")
        self.assertEqual(out["in_house"][0]["check_in"], "2026-11-18")
        self.assertEqual(out["in_house"][0]["check_out"], "2026-11-20")
        self.assertEqual(out["in_house"][0]["guests"], 4)
        self.assertNotIn("guest", out["in_house"][0])
        self.assertNotIn("reservation_id", out["in_house"][0])
        self.assertNotIn("reservation_id", out["turnovers"][0])
        self.assertEqual(out["check_ins"][0]["time"], "16:00")
        self.assertEqual(out["headline"]["in_house_units"], 1)
        self.assertEqual(privacy.forbidden_key_paths(out), [])

    def test_fleet_snapshot_omits_reservation_id(self):
        out = fleet.snapshot("2026-11-18", calendar(), tasks())
        blob = json.dumps(out)
        self.assertNotIn(SECRET_NAME, blob)
        self.assertNotIn(SECRET_ID, blob)
        self.assertEqual(out["turnovers"][0]["property"], "Example Cabin")
        self.assertNotIn("reservation_id", out["turnovers"][0])
        self.assertFalse(out["turnovers"][0]["cleaner_assigned"])
        self.assertEqual(privacy.forbidden_key_paths(out), [])

    def test_status_labels_ignore_guest_name(self):
        row = {
            "property": "Example Cabin",
            "guest": SECRET_NAME,
            "reservation_id": SECRET_ID,
            "check_in": "2026-11-18",
            "check_out": "2026-11-20",
        }
        label = verify.in_house_label(row)
        self.assertNotIn(SECRET_NAME, label)
        self.assertNotIn(SECRET_ID, label)
        self.assertIn("Example Cabin", label)
        self.assertIn("2026-11-18", label)
        paired = verify.pairs({"in_house": [row]})
        self.assertEqual(paired, [("Example Cabin", "2026-11-18", "2026-11-20")])
        blob = json.dumps({"expectedInHouse": [label], "kioskUnits": {"example": row["property"]}})
        self.assertNotIn(SECRET_NAME, blob)
        self.assertEqual(privacy.nested_sync_issues(json.loads(blob)), [])

    def test_committed_public_files_are_clean(self):
        issues = privacy.check_public_tree(ROOT)
        self.assertEqual(issues, [], "\n".join(issues))

    def test_html_guest_column_detector(self):
        dirty = "<table><tr><th>Guest</th><th>Property</th></tr><tr><td>Casey Placeholder</td><td>Cabin</td></tr></table>"
        clean = "<table><tr><th>Guest</th><th>Property</th></tr><tr><td>—</td><td>Cabin</td></tr></table>"
        self.assertTrue(privacy.html_guest_column_issues(dirty))
        self.assertEqual(privacy.html_guest_column_issues(clean), [])
        self.assertNotIn(SECRET_NAME, " ".join(privacy.html_guest_column_issues(dirty)))


if __name__ == "__main__":
    unittest.main()
