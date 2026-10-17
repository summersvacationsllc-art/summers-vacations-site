"""Tests for build_shows_from_scout.py (stdlib unittest).

Run: python3 -m unittest discover -s scripts/tests -v
"""
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import build_shows_from_scout as b  # noqa: E402

REPORTS = HERE.parents[1] / "public" / "reports"
SCOUTS = REPORTS / "shows-scouts"
FROZEN = {"shows": [
    {"name": "The Haygoods", "time": "7:30 PM", "venue": "Clay Cooper Theatre", "lat": 36.6, "lng": -93.3},
    {"name": "Legends in Concert", "time": "8:00 PM", "venue": "Pepsi Legends Theater", "lat": 36.64, "lng": -93.26},
]}

SYNTH = """# 🎭 Shows — Friday
## Highlighted Shows
**Alpha Show** – 8:00 PM
- Alpha Theatre (100 Main St)
- Great show.
- Tickets from ~$40–$60 avg.
**The Alpha Show** – 8:00 PM (Alpha Theatre)
**Beta Revue** – 10:00 AM
**Gamma Night** – Evening (typically 7:30 PM)
**Delta Hour** – 8:00 PM (select dates; confirm)
**Alpha Show** – Check times
## Insider Tips
**Not A Show** – 9:00 PM
"""


class T(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self._dirs = b.scout_dirs
        b.scout_dirs = lambda: [self.tmp]

    def tearDown(self):
        b.scout_dirs = self._dirs
        shutil.rmtree(self.tmp)

    def put(self, day, src=None, text=None):
        p = self.tmp / f"{day}.md"
        if src:
            shutil.copy(src, p)
        else:
            p.write_text(text + "\n" + ("x" * 500), encoding="utf-8")
        return p

    def test_today_fresh_real_scout(self):
        self.put("2026-10-16", SCOUTS / "2026-10-16.md")
        d = b.build("2026-10-16", None, 2, FROZEN)
        names = [s["name"] for s in d["shows"]]
        self.assertEqual(d["status"], "fresh")
        self.assertEqual(d["scoutDate"], "2026-10-16")
        self.assertIn("The Texas Tenors", names)
        self.assertNotIn("The Haygoods", names)          # frozen list not resurrected
        self.assertNotIn("Legends in Concert", names)

    def test_fallback_within_two_days_is_labeled(self):
        self.put("2026-10-12", SCOUTS / "2026-10-12.md")
        d = b.build("2026-10-13", None, 2, FROZEN)
        self.assertEqual(d["status"], "fallback")
        self.assertEqual(d["scoutDate"], "2026-10-12")
        self.assertIn("2026-10-12", d["note"])
        self.assertEqual(d["date"], "2026-10-13")

    def test_no_fresh_scout_empties_board(self):
        self.put("2026-10-12", SCOUTS / "2026-10-12.md")
        d = b.build("2026-10-15", None, 2, FROZEN)        # 3 days old -> too stale
        self.assertEqual(d["status"], "no_fresh_scout")
        self.assertEqual(d["shows"], [])

    def test_unconfirmed_times_dedupe_sort_and_stop_sections(self):
        self.put("2026-10-16", text=SYNTH)
        d = b.build("2026-10-16", None, 2, {})
        rows = [(s["name"], s["time"]) for s in d["shows"]]
        self.assertEqual(rows[0], ("Beta Revue", "10:00 AM"))                 # sorted by time
        self.assertEqual(sum(1 for n, _ in rows if b.name_key(n) == b.name_key("Alpha Show")), 1)  # deduped
        self.assertIn(("Gamma Night", "Check times"), rows)                   # hedged time not invented
        self.assertIn(("Delta Hour", "Check times"), rows)                    # "select dates; confirm"
        self.assertNotIn("Not A Show", [n for n, _ in rows])                  # ignored after Insider Tips
        self.assertEqual(rows[-1][1], "Check times")                          # unconfirmed sort last
        alpha = next(s for s in d["shows"] if s["name"] == "Alpha Show")
        self.assertEqual(alpha["venue"], "Alpha Theatre")
        self.assertEqual(alpha["price"], "$40–$60")

    def test_schema_matches_site_consumers(self):
        self.put("2026-10-16", SCOUTS / "2026-10-16.md")
        prior = json.loads((REPORTS / "shows-data.json").read_text())
        d = b.build("2026-10-16", None, 2, prior)
        for k in ("date", "shows", "freeEvents"):
            self.assertIn(k, d)
        need = {"name", "time", "venue", "sortMinutes", "bucket", "chip", "icon", "for", "ticketOk"}
        for s in d["shows"]:
            self.assertTrue(need <= set(s), s["name"])
        self.assertEqual(d["freeEvents"], [])                                 # no desk notes to guests

    def test_all_real_scouts_parse(self):
        for f in sorted(SCOUTS.glob("2026-*.md")):
            day = f.stem
            self.put(day, f)
            d = b.build(day, None, 0, {})
            self.assertGreaterEqual(len(d["shows"]), 3, f.name)
            for s in d["shows"]:
                self.assertLess(len(s["name"]), 95, f.name)


class HonestCarryTest(unittest.TestCase):
    def test_honest_carry_scout_is_skipped(self):
        """A carry-forward shell under today's name must not become today's board."""
        import os
        tmp = Path(tempfile.mkdtemp())
        try:
            body = "\n".join(f"**Show {i}** – 7:{i}0 PM\n- Some Theatre (1 Main St)\n- Desc." for i in range(5))
            (tmp / "2026-10-20.md").write_text("> **HONEST CARRY-FORWARD BASELINE** from 2026-10-18\n\n" + body + "\n" + "x" * 400)
            (tmp / "2026-10-19.md").write_text("# Shows\n\n" + body + "\n" + "y" * 400)
            old = os.environ.get("SHOW_SCOUT_DIR")
            os.environ["SHOW_SCOUT_DIR"] = str(tmp)
            try:
                _, day = b.find_scout("2026-10-20", 2)
            finally:
                if old is None:
                    os.environ.pop("SHOW_SCOUT_DIR", None)
                else:
                    os.environ["SHOW_SCOUT_DIR"] = old
            self.assertEqual(day, "2026-10-19")
        finally:
            shutil.rmtree(tmp)


if __name__ == "__main__":
    unittest.main()
