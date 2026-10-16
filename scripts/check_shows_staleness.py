#!/usr/bin/env python3
"""Fail loudly when the guest show list stops changing while scouts change.

Looks at the last committed public/reports/shows-data.json for each CT day
(git history) and at the shows scout for the same days. If the guest list
(names + times) is identical for --days or more consecutive days ending
today, while the scouts for those days list different shows, the board is
stale (the 2026-10-02 → 10-16 failure).

Writes public/reports/shows-health.json (no guest data; show counts and
hashes only) and exits 1 when stale (unless --no-fail).

Usage: python3 scripts/check_shows_staleness.py [--days 3] [--date YYYY-MM-DD]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_shows_from_scout as bs  # noqa: E402

CT = ZoneInfo("America/Chicago")
SITE = HERE.parent
REL = "public/reports/shows-data.json"


def sig(shows: list[dict]) -> str:
    return hashlib.sha1(json.dumps([(s.get("name"), s.get("time")) for s in shows or []],
                                   ensure_ascii=False).encode()).hexdigest()[:12]


def daily_board_hashes(days: list[str]) -> dict[str, str | None]:
    """Last commit of shows-data.json on or before the end of each CT day."""
    out: dict[str, str | None] = {}
    for d in days:
        until = f"{d}T23:59:59-05:00"
        c = subprocess.run(["git", "-C", str(SITE), "log", "-1", "--format=%H", f"--until={until}", "--", REL],
                           capture_output=True, text=True).stdout.strip()
        if not c:
            out[d] = None
            continue
        raw = subprocess.run(["git", "-C", str(SITE), "show", f"{c}:{REL}"], capture_output=True, text=True).stdout
        try:
            out[d] = sig(json.loads(raw).get("shows"))
        except Exception:
            out[d] = None
    # today: prefer the working-tree file (what this run is about to publish)
    today = days[-1]
    p = SITE / REL
    if p.is_file():
        try:
            out[today] = sig(json.loads(p.read_text(encoding="utf-8")).get("shows"))
        except Exception:
            pass
    return out


def scout_hash(day: str) -> str | None:
    for base in bs.scout_dirs():
        f = base / f"{day}.md"
        if f.is_file() and f.stat().st_size >= bs.MIN_SCOUT_BYTES:
            rows = bs.dedupe(bs.parse_scout(f.read_text(encoding="utf-8", errors="replace")))
            return sig(rows)
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=3)
    ap.add_argument("--date", default=datetime.now(CT).strftime("%Y-%m-%d"))
    ap.add_argument("--out", type=Path, default=SITE / "public/reports/shows-health.json")
    ap.add_argument("--no-fail", action="store_true")
    a = ap.parse_args()

    end = datetime.strptime(a.date, "%Y-%m-%d").date()
    window = [(end - timedelta(days=i)).isoformat() for i in range(13, -1, -1)]  # 14 days
    boards = daily_board_hashes(window)
    scouts = {d: scout_hash(d) for d in window}

    # consecutive identical board days ending today
    today_sig = boards.get(a.date)
    run = 0
    for d in reversed(window):
        if today_sig and boards.get(d) == today_sig:
            run += 1
        else:
            break
    run_days = window[len(window) - run:] if run else []
    scout_sigs = {scouts[d] for d in run_days if scouts.get(d)}
    scouts_differ = len(scout_sigs) >= 2 or (len(scout_sigs) == 1 and today_sig not in scout_sigs and run >= a.days)
    stale = run >= a.days and scouts_differ

    health = {
        "checkedAt": datetime.now(CT).isoformat(timespec="seconds"),
        "date": a.date,
        "ok": not stale,
        "unchangedDays": run,
        "unchangedSince": run_days[0] if run_days else None,
        "scoutsInWindow": sum(1 for d in run_days if scouts.get(d)),
        "distinctScoutLists": len(scout_sigs),
        "threshold": a.days,
        "message": (
            f"Show list unchanged for {'at least ' if run == len(window) else ''}{run} days (since {run_days[0]}) while scouts listed "
            f"{len(scout_sigs)} different line-ups. Guest board is stale."
            if stale else "ok"
        ),
    }
    a.out.write_text(json.dumps(health, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(health))
    if stale and not a.no_fail:
        print(f"::error::{health['message']}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
