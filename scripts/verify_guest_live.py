#!/usr/bin/env python3
"""verify_guest_live.py — prove production shows the guest data the sync wrote.

Checks (stdlib only, safe to run anywhere):
  1. Expected file (the sync's own public/reports/guest-today.json) is for
     today's America/Chicago date (unless --allow-stale-expected).
  2. Live GET <base>/api/guest-today returns the same snapshot (same date and
     generated_at, same property -> guest pairs in in_house). Retries up to
     --wait seconds because the API reads GitHub main through a ~5 min CDN.
  3. Live <base>/kiosk.html still points at the guest API, and every in-house
     property maps to a kiosk unit using the kiosk's own alias matching (this
     is the check that would have caught Guesty 'Indian Point' not matching
     Branson Family Haven).

Writes a status JSON (--status-out) and exits 1 on any failure so the GitHub
Actions job fails (GitHub then emails the repo owner about the failed run).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

CT = ZoneInfo("America/Chicago")
UA = {"User-Agent": "summers-guest-sync-verifier", "Cache-Control": "no-cache"}


def get(url: str, timeout: int = 20) -> tuple[int, dict, str]:
    sep = "&" if "?" in url else "?"
    req = urllib.request.Request(f"{url}{sep}v={int(time.time())}", headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, dict(r.headers), r.read().decode("utf-8", "replace")


def pairs(data: dict) -> list[tuple[str, str]]:
    return sorted(
        (str(r.get("property", "")).strip(), str(r.get("guest", "")).strip())
        for r in (data.get("in_house") or [])
    )


def kiosk_units(html: str) -> dict[str, list[str]]:
    """Parse UNITS = { "slug": { name: ..., aliases: [...] } } from kiosk.html."""
    units: dict[str, list[str]] = {}
    for m in re.finditer(r'"([a-z0-9-]+)":\s*\{\s*name:\s*"[^"]*",\s*aliases:\s*\[([^\]]*)\]', html):
        units[m.group(1)] = [a.lower() for a in re.findall(r'"([^"]*)"', m.group(2))]
    return units


def match_stay(in_house: list[dict], aliases: list[str]) -> dict | None:
    # Mirror of matchStay() in public/kiosk.html.
    for row in in_house:
        p = str(row.get("property") or "").lower()
        if any(p == a or a in p or p in a for a in aliases):
            return row
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--expected", default="public/reports/guest-today.json")
    ap.add_argument("--base", default="https://www.mybransonvacation.com")
    ap.add_argument("--wait", type=int, default=600, help="seconds to keep retrying live match")
    ap.add_argument("--interval", type=int, default=30)
    ap.add_argument("--status-out", default="")
    ap.add_argument("--allow-stale-expected", action="store_true")
    ap.add_argument("--context", default="", help="free text recorded in status (e.g. workflow run URL)")
    a = ap.parse_args()

    now_utc = datetime.now(timezone.utc)
    today = now_utc.astimezone(CT).strftime("%Y-%m-%d")
    errors: list[str] = []
    notes: list[str] = []

    expected = json.loads(Path(a.expected).read_text())
    exp_pairs = pairs(expected)
    if expected.get("date") != today:
        msg = f"sync data is for {expected.get('date')}, today is {today} CT"
        (notes if a.allow_stale_expected else errors).append(msg)

    # 2. live API matches expected
    live: dict = {}
    live_src = ""
    deadline = time.time() + a.wait
    attempt = 0
    while True:
        attempt += 1
        try:
            status, headers, body = get(f"{a.base}/api/guest-today")
            live = json.loads(body)
            live_src = headers.get("X-Guest-Data-Source") or headers.get("x-guest-data-source") or ""
            same = (
                live.get("date") == expected.get("date")
                and live.get("generated_at") == expected.get("generated_at")
                and pairs(live) == exp_pairs
            )
        except Exception as e:  # noqa: BLE001
            same = False
            live = {"_error": str(e)[:200]}
        if same or time.time() >= deadline:
            break
        print(f"live not matching yet (attempt {attempt}, live date={live.get('date')} gen={live.get('generated_at')}); retrying in {a.interval}s", flush=True)
        time.sleep(a.interval)
    if not same:
        errors.append(
            "live /api/guest-today does not match sync data after "
            f"{a.wait}s: live date={live.get('date')} generated_at={live.get('generated_at')} "
            f"in_house={pairs(live) if 'in_house' in live else live.get('_error')}; "
            f"expected date={expected.get('date')} generated_at={expected.get('generated_at')} in_house={exp_pairs}"
        )

    # 3. kiosk maps every in-house property to a unit
    unit_report: dict[str, str | None] = {}
    try:
        _, _, html = get(f"{a.base}/kiosk.html")
        if "/api/guest-today" not in html:
            errors.append("live kiosk.html no longer references /api/guest-today")
        units = kiosk_units(html)
        if not units:
            errors.append("could not parse UNITS from live kiosk.html")
        in_house = expected.get("in_house") or []
        matched_props: set[str] = set()
        for slug, aliases in units.items():
            row = match_stay(in_house, aliases)
            unit_report[slug] = f"{row.get('guest')} ({row.get('property')})" if row else None
            if row:
                matched_props.add(str(row.get("property")))
        for row in in_house:
            if str(row.get("property")) not in matched_props:
                errors.append(f"kiosk has no unit matching Guesty property '{row.get('property')}' (guest {row.get('guest')}) — guest would not show")
    except Exception as e:  # noqa: BLE001
        errors.append(f"kiosk check failed: {str(e)[:200]}")

    ok = not errors
    status = {
        "ok": ok,
        "generated_at": now_utc.isoformat(timespec="seconds"),
        "checkedAt": now_utc.astimezone(CT).isoformat(timespec="seconds"),
        "todayCT": today,
        "lastSyncAt": expected.get("generated_at"),
        "syncDataDate": expected.get("date"),
        "liveDataDate": live.get("date"),
        "liveSource": live_src,
        "expectedInHouse": [f"{g} @ {p}" for p, g in exp_pairs],
        "kioskUnits": unit_report,
        "errors": errors,
        "notes": notes,
        "context": a.context,
    }
    print(json.dumps(status, indent=2))
    if a.status_out:
        Path(a.status_out).write_text(json.dumps(status, indent=2) + "\n")
    for e in errors:
        print(f"::error::{e}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
