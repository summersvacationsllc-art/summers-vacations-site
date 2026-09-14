#!/usr/bin/env python3
"""Build the single phone Business Report JSON for /reports/fleet.

Combines fleet-today + guest-today + BizDev SaaS bites + latest leads +
Monday weekly rollup. Never fabricates numbers.
"""
from __future__ import annotations

import argparse
import json
import os
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

CT = ZoneInfo("America/Chicago")
SITE = Path("/Users/briansummers/projects/summers-vacations-site")
BIZ = Path("/Users/briansummers/projects/branson-bizdev")
REPORTS = SITE / "public" / "reports"


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def latest_file(folder: Path, glob: str) -> Path | None:
    if not folder.exists():
        return None
    files = sorted(folder.glob(glob))
    return files[-1] if files else None


def first_paragraph(md: str, heading: str) -> str:
    m = re.search(rf"^## {re.escape(heading)}\s*\n+(.+?)(?=\n## |\Z)", md, re.S | re.M)
    if not m:
        return ""
    body = m.group(1).strip()
    # first non-empty paragraph / bullet block, cap length
    parts = re.split(r"\n\s*\n", body)
    text = (parts[0] if parts else body).strip()
    return text[:900]


def lead_summary(path: Path | None) -> dict:
    if not path:
        return {"date": None, "summary": "No lead files on disk.", "named": [], "watch": [], "none_verified": False}
    text = path.read_text(errors="replace")
    named = []
    watch = []
    if "Coveside" in text or "Faulkner" in text:
        named.append("Coveside Pool Place / Jen Chandler Faulkner — LIVE 2026-09-01, Nightly Vacations. Brian owns follow-up.")
    if "2920440568152837" in text or "needs TLC" in text or "TLC" in text:
        watch.append("Public owner-ask in Branson Vacation Rentals: new purchase needs TLC / hunting a PM (~15w). Comments already pitching Shellie, Ferris View, Snyder.")
    if "paste" in text.lower() and "missed" in text.lower():
        watch.append("Brian found a Facebook lead Google did not index — paste name + URL to file it.")
    none = bool(re.search(r"\*\*none verified\*\*", text, re.I)) and not named and not watch
    summary = first_paragraph(text, "Why the search engine missed it") or first_paragraph(text, "Named asks") or ""
    return {
        "date": path.stem[:10] if path.stem[:10].count("-") == 2 else path.name,
        "summary": (summary.strip() or "See lead file.")[:600],
        "none_verified": none,
        "named": named,
        "watch": watch,
        "file": str(path.name),
    }


def competitor_section() -> dict:
    path = latest_file(BIZ / "data" / "competitors", "2026-*.md")
    if not path:
        return {"date": None, "rows": [], "note": "No competitor dossier on disk."}
    text = path.read_text(errors="replace")
    rows = [
        {"name": "Summers Vacations", "fee": "15% + $50/mo tech", "signal": "Owners keep ratings", "note": "Local ops + guidebook/kiosk"},
        {"name": "Weekender", "fee": "25% flat published", "signal": "~13 Branson-area (self)", "note": "Only local that posts a number"},
        {"name": "Thousand Hills Vacations", "fee": "not published", "signal": "Airbtics 285 listings / ~$45.7k", "note": "Largest tracked book"},
        {"name": "Grand Welcome", "fee": "custom (dir. ~30%)", "signal": "Airbtics 174 / 71% occ", "note": "Named on owner threads"},
        {"name": "Shellie Long Edwards", "fee": "VERIFY", "signal": "Most-named in FB comments", "note": "shellieedwardsrentals.com"},
        {"name": "Aha Property Management", "fee": "VERIFY", "signal": "Claims 72 Branson units", "note": "Tall Timbers recruiting 303-819-1182"},
        {"name": "Evolve", "fee": "10–15% half-service", "signal": "No cleaning included", "note": "Old thread favorite"},
    ]
    return {
        "date": path.name[:10],
        "file": path.name,
        "owners_hear_first": "Shellie Long Edwards, Ferris View Horizon, Grand Welcome, Aha, Thousand Hills, Weekender 25%.",
        "rows": rows,
        "note": first_paragraph(text, "How owners actually pick (from FB comment threads)")[:400],
    }


def guest_experience() -> dict:
    return {
        "title": "Guest Experience Enhancement",
        "standing": True,
        "items": [
            {"status": "done", "item": "Kiosk weather uses /api/weather (same as stay Home)"},
            {"status": "next", "item": "Marketing opt-in on /branson name+phone unlock (unchecked by default)"},
            {"status": "next", "item": "Kiosk welcome: unit amenities card (Haven vs Notch)"},
            {"status": "next", "item": "Kiosk Emergency expand (911, Cox Branson, Walgreens, host tel)"},
            {"status": "later", "item": "Daily save-for-later + listen-to-brief on The Branson Daily"},
        ],
    }


def monday_section(today: datetime) -> dict:
    weekly = latest_file(BIZ / "analysis", "*-weekly-briefing.md")
    if not weekly:
        return {
            "is_monday": today.weekday() == 0,
            "week_of": None,
            "bottom_line": "No weekly briefing file yet.",
            "top3": [],
            "one_liner": None,
        }
    md = weekly.read_text(errors="replace")
    bottom = first_paragraph(md, "Bottom line")
    top_block = first_paragraph(md, "Top 3 opportunities")
    top3 = []
    for line in top_block.splitlines():
        line = line.strip()
        if re.match(r"^\d+\.", line) or line.startswith("**"):
            top3.append(re.sub(r"^\d+\.\s*", "", line)[:280])
        if len(top3) >= 3:
            break
    one = ""
    m = re.search(r"\*\*One plain sentence for Brian:\*\*\s*(.+)", md)
    if m:
        one = m.group(1).strip()
    week_of = weekly.name[:10]
    return {
        "is_monday": today.weekday() == 0,
        "week_of": week_of,
        "bottom_line": bottom[:700],
        "top3": top3,
        "one_liner": one[:400] or None,
        "file": weekly.name,
    }


def saas_bites(today: datetime) -> list:
    p = BIZ / "data" / "projects" / "saas-ops-rollout.json"
    data = load_json(p)
    bites = (data.get("today_bites") or {}).get(str(today.weekday()), [])
    items = {i.get("id"): i for i in data.get("items") or []}
    out = []
    for b in bites:
        item = items.get(b.get("item"), {})
        out.append({
            "item": b.get("item"),
            "action": b.get("action"),
            "title": item.get("title"),
            "status": item.get("status", "todo"),
        })
    return out


def actions(guest: dict, fleet: dict, leads: dict, monday: dict) -> list[str]:
    out = []
    turns = fleet.get("turnovers") or guest.get("turnovers") or []
    unassigned = [t for t in turns if t.get("cleaner_assigned") is False]
    if unassigned:
        out.append(f"Assign {len(unassigned)} unassigned turnover(s) in cleaners app.")
    else:
        out.append("No unassigned turnovers in the last snapshot.")
    named = leads.get("named") or []
    watch = leads.get("watch") or []
    if named:
        out.append("LIVE lead: " + named[0][:160])
    if watch:
        out.append(watch[0][:180])
    if not named and not watch:
        out.append("No new indexed owner-ask — paste any Facebook lead you found.")
    one = monday.get("one_liner") or ""
    if one and "frozen" not in one.lower() and "45 days" not in one:
        out.append("Monday: " + one[:180])
    out.append("Guesty Price Optimizer only — do not pitch PriceLabs.")
    return out[:6]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default="")
    args = parser.parse_args()
    now = datetime.now(CT)
    date = args.date or now.strftime("%Y-%m-%d")
    # lock weekday from --date when given
    try:
        today = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=CT)
    except ValueError:
        today = now

    fleet = load_json(REPORTS / "fleet-today.json")
    guest = load_json(REPORTS / "guest-today.json")
    leads = lead_summary(latest_file(BIZ / "data" / "leads", "2026-*.md"))
    monday = monday_section(today)
    bites = saas_bites(today)
    comps = competitor_section()
    gx = guest_experience()
    fleet_sync = (load_json(REPORTS / "fleet-data.json") or {}).get("guestySync") or {}

    payload = {
        "ok": True,
        "date": date,
        "generated_at": now.isoformat(timespec="seconds"),
        "title": "Summers Vacations Business Report",
        "phone_url": "/reports/fleet",
        "actions": actions(guest, fleet, leads, monday),
        "saas_bites": bites,
        "leads": leads,
        "competitors": comps,
        "guest_experience": gx,
        "guesty_sync": {
            "ok": fleet_sync.get("ok"),
            "lastRun": fleet_sync.get("lastRun"),
            "note": fleet_sync.get("note") or "Prefer live /api/cron/fleet-read over local SQLite lastRun.",
        },
        "monday": monday,
        "fleet_date": fleet.get("date"),
        "guest_date": guest.get("date"),
        "notes": [
            "This is the single daily business report. Guest Branson Daily stays separate.",
            "Monday section is the weekly rollup — not a second file.",
            "Do not repeat 'Guesty frozen 45 days' from old weeklies if lastRun is current.",
        ],
    }
    out = REPORTS / "business-today.json"
    out.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {out} date={date} monday={monday.get('week_of')} bites={len(bites)}")


if __name__ == "__main__":
    main()
