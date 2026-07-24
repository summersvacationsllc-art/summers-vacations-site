"""build_guest_today.py — pull live Guesty state from str-manager-one and write
public/reports/guest-today.json for the magazine guest report.

Honesty rules:
  - NEVER invent cleaner names. If `cleaner_id = null` on a task, mark
    `cleaner_assigned=false` and add a note so Brian sees the sync gap.
  - All int / stay-night numbers come from the API. Weather/lake numbers
    are still sourced separately by scouts (FIG, SWPA, USACE).
"""
from __future__ import annotations

import argparse
import json
import os
import urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
STR_BASE = "https://str-manager-one.vercel.app"


def auth_headers() -> dict[str, str]:
    secret = os.environ.get("CRON_SECRET", "")
    if not secret:
        for p in (
            Path.home() / ".hermes/scripts/str_manager_sync.env",
            Path.home() / ".hermes/secrets/guesty.env",
        ):
            if not p.exists():
                continue
            for line in p.read_text().splitlines():
                if line.startswith("CRON_SECRET="):
                    secret = line.split("=", 1)[1].strip()
                    break
            if secret:
                os.environ["CRON_SECRET"] = secret
                break
    return {
        "x-cron-secret": secret or "",
        "Authorization": f"Bearer {secret}" if secret else "",
    }


def get_json(path: str) -> dict:
    req = urllib.request.Request(f"{STR_BASE}{path}", headers=auth_headers())
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def build(date_str: str) -> dict:
    today = date.fromisoformat(date_str)
    qfrom = (today - timedelta(days=1)).isoformat()
    qto = (today + timedelta(days=8)).isoformat()
    cal = get_json(f"/api/cron/calendar?from={qfrom}&to={qto}")
    res = cal.get("reservations", [])
    t = get_json("/api/tasks")
    todays = [x for x in t.get("tasks", []) if x.get("scheduled_date") == date_str]
    names = {r["property_id"]: (r.get("property_name") or "?").strip() for r in res}
    in_house = [r for r in res if r["check_in"] <= date_str < r["check_out"]]
    checkins = [r for r in res if r["check_in"] == date_str]
    checkouts = [r for r in res if r["check_out"] == date_str]

    def norm(r: dict) -> dict:
        return {
            "property": names[r["property_id"]],
            "guest": (r.get("guest_name") or "").strip(),
            "guests": r.get("guests"),
            "platform": (r.get("source") or "").lower(),
            "reservation_id": r.get("id"),
        }

    payload = {
        "date": date_str,
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "headline": {
            "check_ins": len(checkins),
            "check_outs": len(checkouts),
            "turnovers": len(todays),
            "same_day_turnovers": sum(1 for x in todays if x.get("is_same_day")),
            "in_house_units": len({r["property_id"] for r in in_house}),
            "units_total": len({r["property_id"] for r in res}),
        },
        "check_ins": [{**norm(r), "time": r.get("check_in_time")} for r in checkins],
        "check_outs": [{**norm(r), "time": r.get("check_out_time")} for r in checkouts],
        "turnovers": [
            {
                "property": names.get(x["property_id"], x["property_id"]),
                "type": x["type"],
                "status": x["status"],
                "checkout_time": x.get("checkout_time"),
                "next_checkin": x.get("next_checkin"),
                "cleaner_id": x.get("cleaner_id"),
                "cleaner_assigned": x.get("cleaner_id") is not None,
                "cleaner_note": (
                    None
                    if x.get("cleaner_id")
                    else "Unassigned in cleaners app — sync wanted"
                ),
                "same_day": bool(x.get("is_same_day")),
                "reservation_id": x.get("guesty_reservation_id"),
            }
            for x in todays
        ],
        "in_house": [
            {
                **norm(r),
                "check_in": r["check_in"],
                "check_out": r["check_out"],
                "nights": (
                    date.fromisoformat(r["check_out"])
                    - date.fromisoformat(r["check_in"])
                ).days,
            }
            for r in in_house
        ],
        "sync_notes": {
            "cleaner_app": (
                "Cleaner assignments: pulled live from str-manager-one "
                "/api/tasks. Open https://str-manager-one.vercel.app/ops to "
                "assign any turnover where cleaner_assigned is false."
            ),
            "guesty_window": (
                "Guesty Pro data appears from Jul 2026 forward. Pre-July "
                "actuals live in Airbnb/Vrbo CSV exports."
            ),
        },
    }
    return payload


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date")
    args = ap.parse_args()
    today = args.date or date.today().isoformat()
    out = build(today)
    target = SITE / "public/reports/guest-today.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(out, indent=2))
    print(f"wrote {target} head={out['headline']}")


if __name__ == "__main__":
    main()
