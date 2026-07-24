"""build_today_reports.py — generate the two daily reports:

1) PUBLIC guest HTML  → public/reports/2026-07-24.html
   - Magazine style, editor tone, ~50 KB
   - Live NWS forecast (today + tonight + Sat + Sun)
   - Today's check-ins / check-outs / in-house
   - Full verified show list (12)
   - Today's fishing bite (from scout file)
   - Top free events (Landing fountain, Silver Dollar City)
   - Honest callout when cleaner_id is null
2) PRIVATE fleet HTML → public/reports/fleet-2026-07-24.html
   - Deep / travel-magazine density, ~120 KB
   - All of the above +
     - 30-day demand outlook
     - Competitor dossier (Weekender 25%, Nightly Rental 5-star guarantee, etc.)
     - Owner-recruiting pitch sidebar
     - Heat-dome safety + lake guidance

Inputs (already cached / live):
  /tmp/cal.json   : str-manager-one /api/cron/calendar
  /tmp/tasks.json : str-manager-one /api/tasks
  /tmp/nws.json   : NWS periods + 18 hours
  ~/projects/branson-content-engine/data/*/2026-07-24.md  scout files
  public/reports/guest-today.json (built earlier)

Run: python3 scripts/build_today_reports.py --date 2026-07-24
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ENG = Path("/Users/briansummers/projects/branson-content-engine")
SITE = Path("/Users/briansummers/projects/summers-vacations-site")
DESK = Path("/Users/briansummers/Desktop/Morning hermes report")
DATE_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})\.md$")


# ---------- shared helpers ----------
def hero_meta(d: str) -> tuple[str, str, str]:
    dd = dt.date.fromisoformat(d)
    long_fmt = dd.strftime("%A, %B %-d, %Y")
    return dd.strftime("%a %b %-d, %Y"), dd.strftime("%Y-%m-%d"), long_fmt


def plat_icon(plat: str) -> str:
    p = (plat or "").lower()
    if p in ("airbnb2", "airbnb"):
        return "🏖️ Airbnb"
    if p in ("vrbo",):
        return "🏖️ Vrbo"
    if p in ("website", "direct"):
        return "🔗 Direct"
    if p in ("booking",):
        return "🏨 Booking"
    return "🏖️ OTA" if p else "?"


def esc(s: str) -> str:
    return (s or "")
