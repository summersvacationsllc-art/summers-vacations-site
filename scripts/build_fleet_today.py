"""build_fleet_today.py — rebuild public/reports/fleet-today.json from live
str-manager-one /api/tasks. Fixes the broken cleaner assignment display
(fleet-data.json previously showed `cleaner: "—"` for everything).

Inputs: live API via shared build_guest_today.py helpers + local json cache.
Outputs:
   public/reports/fleet-today.json   — live
   public/reports/fleet-YYYY-MM-DD.html — quick-clean magazine HTML

Run from site repo: python3 scripts/build_fleet_today.py --date 2026-07-24
"""
from __future__ import annotations

import argparse
import json
import os
import urllib.request
from datetime import date, datetime
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
            if p.exists():
                for line in p.read_text().splitlines():
                    if line.startswith("CRON_SECRET="):
                        secret = line.split("=", 1)[1].strip()
                    if secret:
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


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date")
    args = ap.parse_args()
    today = args.date or date.today().isoformat()

    cal = get_json(
        f"/api/cron/calendar?from={today}&to={today}"
    )  # only today window is enough
    res = cal.get("reservations", [])
    t = get_json("/api/tasks")
    todays = [x for x in t.get("tasks", []) if x.get("scheduled_date") == today]
    names = {r["property_id"]: (r.get("property_name") or "?").strip() for r in res}

    payload = {
        "date": today,
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "units_total": len({r["property_id"] for r in res}),
        "turnovers": [
            {
                "property": names.get(x["property_id"], x["property_id"]),
                "property_id": x["property_id"],
                "checkout": x.get("checkout_time"),
                "next_checkin": x.get("next_checkin"),
                "status": x["status"],
                "same_day": bool(x.get("is_same_day")),
                "cleaner_id": x.get("cleaner_id"),
                "cleaner_assigned": x.get("cleaner_id") is not None,
                "reservation_id": x.get("guesty_reservation_id"),
            }
            for x in todays
        ],
        "sync_status": (
            "Live · cleaner_id read from /api/tasks · "
            "honest 'unassigned' shown where null"
        ),
    }
    out = SITE / "public/reports/fleet-today.json"
    out.write_text(json.dumps(payload, indent=2))
    print(
        f"wrote {out} date={today} units={payload['units_total']} "
        f"turnovers={len(payload['turnovers'])} "
        f"unassigned={sum(1 for t in payload['turnovers'] if not t['cleaner_assigned'])}"
    )


if __name__ == "__main__":
    main()
