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
        return {"date": None, "summary": "No lead files on disk.", "named": []}
    text = path.read_text(errors="replace")
    named = []
    if "Coveside" in text or "Faulkner" in text:
        named.append("Coveside Pool Place / Jen Chandler Faulkner (LIVE file 2026-09-01 — Brian owns follow-up)")
    none = bool(re.search(r"none verified", text, re.I))
    summary = first_paragraph(text, "Named asks") or text.split("\n", 3)[-1][:400]
    return {
        "date": path.stem[:10] if path.stem[:10].count("-") == 2 else path.name,
        "summary": summary.strip()[:500],
        "none_verified": none,
        "named": named,
        "file": str(path.name),
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
    if named:
        out.append("Owner lead on disk: " + named[0])
    elif leads.get("none_verified"):
        out.append("Owner Lead Scout: none verified on last hunt — paste Messenger DMs if any.")
    if monday.get("one_liner"):
        out.append("Monday: " + monday["one_liner"][:180])
    out.append("Guesty Price Optimizer only — do not pitch PriceLabs.")
    return out[:5]


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

    payload = {
        "ok": True,
        "date": date,
        "generated_at": now.isoformat(timespec="seconds"),
        "title": "Summers Vacations Business Report",
        "phone_url": "/reports/fleet",
        "actions": actions(guest, fleet, leads, monday),
        "saas_bites": bites,
        "leads": leads,
        "monday": monday,
        "fleet_date": fleet.get("date"),
        "guest_date": guest.get("date"),
        "notes": [
            "This is the single daily business report. Guest Branson Daily stays separate.",
            "Monday section is the weekly rollup — not a second file.",
        ],
    }
    out = REPORTS / "business-today.json"
    out.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {out} date={date} monday={monday.get('week_of')} bites={len(bites)}")


if __name__ == "__main__":
    main()
