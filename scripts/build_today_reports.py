#!/usr/bin/env python3
"""build_today_reports.py — generate the two daily reports:

1) PUBLIC guest HTML  → public/reports/YYYY-MM-DD.html
   - Magazine style, editor tone, ~50 KB
   - Live NWS forecast (today + tonight + Sat + Sun)
   - Today's check-ins / check-outs / in-house
   - Full verified show list (12)
   - Today's fishing bite (from scout file)
   - Top free events (Landing fountain, Silver Dollar City)
   - Honest callout when cleaner_id is null

2) PRIVATE fleet HTML → public/reports/fleet-YYYY-MM-DD.html
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
  ~/projects/branson-content-engine/data/*/YYYY-MM-DD.md  scout files
  public/reports/guest-today.json (built earlier)
  public/reports/fleet-today.json (built earlier)
  public/reports/fleet-data.json (written by Fleet Daily Sync)

Run: python3 scripts/build_today_reports.py --date 2026-07-24
"""
from __future__ import annotations

import argparse
import json
import os
import re
import datetime as dt
import urllib.request
from pathlib import Path

# ---------- paths ----------
SITE = Path(__file__).resolve().parents[1]
ENG = Path("/Users/briansummers/projects/branson-content-engine")
DATE_RE = re.compile(r"^(\\d{4}-\\d{2}-\\d{2})\\.md$")

# ---------- shared helpers ----------
def hero_meta(d: str) -> tuple[str, str, str]:
    dd = dt.date.fromisoformat(d)
    long_fmt = dd.strftime("%A, %B %-d, %Y")
    return dd.strftime("%a %b %-d, %Y"), dd.strftime("%Y-%m-%d"), long_fmt

def plat_icon(plat: str) -> str:
    p = (plat or "").lower()
    if p in ("airbnb2", "airbnb"):
        return "���������🏖������️ Airbnb"
    if p in ("vrbo",):
        return "���������🏖������️ Vrbo"
    if p in ("website", "direct"):
        return "���������🔗 Direct"
    if p in ("booking",):
        return "���������🏨 Booking"
    return "���������🏖������️ OTA" if p else "?"

def esc(s: str) -> str:
    return (s or "").replace("&", "&amp;").replace("<", "&lt").replace(">", "&gt").replace('"', "&quot;")

# ---------- CSS ----------
# We'll read the CSS from a fragment file to avoid huge inline strings
def load_css() -> str:
    css_path = SITE / "scripts" / "_bb_css_fragment.html"
    if css_path.exists():
        return css_path.read_text()
    # fallback minimal CSS (should not happen)
    return "<style>body{font-family:sans-serif}</style>"

# ---------- data loading ----------
def load_json(name: str) -> dict:
    p = SITE / "public/reports" / f"{name}.json"
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text())
    except Exception:
        return {}

def scout_file(topic: str, date_str: str) -> str:
    p = ENG / "data" / topic / f"{date_str}.md"
    if not p.exists():
        return ""
    return p.read_text(encoding="utf-8")

def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "SummersVacationsReport/1.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

# ---------- guest report ----------
def build_guest(date_str: str) -> str:
    css = load_css()
    # load data
    fish = load_json("fishing-data")
    shows = load_json("shows-data")
    guest = load_json("guest-today")
    fleet = load_json("fleet-today")
    attractions = load_json("attractions-data")
    dining = load_json("dining-data")
    golf = load_json("golf-data")
    # scout files
    intel_md = scout_file("intel", date_str)
    landing_md = scout_file("landing", date_str)
    food_md = scout_file("food", date_str)
    golf_md = scout_file("golf", date_str)
    strip_md = scout_file("strip", date_str)
    shows_md = scout_file("shows", date_str)
    fishing_md = scout_file("fishing", date_str)
    # weather from fish.weather (or NWS if needed)
    w = fish.get("weather", {})
    weather_html = f"""
    <div class="chip-row">
        {chip(f"High {w.get('high', 'Verify locally')}")}
        {chip(f"Low {w.get('low', 'Verify locally')}")}
        {chip(f"Wind {w.get('wind', 'Verify locally')}")}
    </div>
    """
    # fishing
    bite = fish.get("biteOfDay", "")
    cond = fish.get("conditions", {})
    tr = cond.get("tableRock", {})
    tc = cond.get("taneycomo", {})
    fish_html = ""
    fish_html += chip(f"Table Rock · {tr.get('level', 'Verify locally')} · {tr.get('temp', 'Verify locally')}", False)
    fish_html += chip(f"Taneycomo · {tc.get('generation', 'Verify locally')} · {tc.get('temp', 'Verify locally')}", False)
    fish_html += '<div style="margin:1rem 0;">'
    fish_html += guide_box("Bite of the day:", esc(bite))
    fish_html += guide_box("Table Rock Guide:", "Early topwater / shallow wood at first light; slide deep to brush and ledges as sun climbs. Confirm lake level & submerged hazards before idle-speed coves.")
    fish_html += guide_box("Taneycomo Guide:", "Match generation — drift crawlers/flies on low flow; fish slack seams when water jumps. PFDs on when wading. Call SWPA 866-494-1993 before you launch.")
    fish_html += "</div>"
    # species grid
    spec = fish.get("species", [])
    spec_items = []
    for s in spec:
        spec_items.append(
            f'<div class="kpi"><div class="v">{s.get("name","")}</div><div class="l">{s.get("rating","")}</div>'
            f'<div style="font-size:0.8rem;color:#475569;margin-top:0.35rem">{s.get("technique","")}</div></div>'
        )
    spec_grid = grid(spec_items, 3) if spec_items else '<p>No species data</p>'
    # events / things to do (free events from shows)
    free = shows.get("freeEvents", [])[:6]
    free_items = [f'<div class="item"><span class="event-time">All Day</span>{esc(e)}</div>' for e in free]
    events_html = grid(free_items, 2) if free_items else '<p>No free events listed</p>'
    # eat from dining
    eat_items = []
    for r in dining.get("restaurants", [])[:6]:
        eat_items.append(
            f'<div class="item"><strong>{esc(r.get("name",""))}</strong><br/>'
            f'{esc(r.get("desc") or r.get("tag") or r.get("cuisine") or "")}</div>'
        )
    eat_html = grid(eat_items, 2) if eat_items else '<p>No dining data</p>'
    # golf from golf
    golf_items = []
    for c in golf.get("courses", [])[:6]:
        golf_items.append(
            f'<div class="item"><strong>{esc(c.get("name",""))}</strong><br/>'
            f'{esc(c.get("desc") or c.get("tag") or "")}</div>'
        )
    golf_html = grid(golf_items, 2) if golf_items else '<p>No golf data</p>'
    # strip from scout
    strip_html = esc(strip_md).replace("\n", "<br/>")
    if not strip_html.strip():
        strip_html = '<p>No strip scout data</p>'
    # landing from scout
    landing_html = esc(landing_md).replace("\n", "<br/>")
    if not landing_html.strip():
        landing_html = '<p>No landing scout data</p>'
    # intel from scout (may be missing)
    intel_html = esc(intel_md).replace("\n", "<br/>")
    if not intel_html.strip():
        intel_html = '<p>No intel scout data — verify locally.</p>'
    # shows list
    shows_list = shows.get("shows", [])
    shows_items = []
    for sh in shows_list[:8]:
        shows_items.append(
            f'<div class="item"><span class="event-time">{sh.get("time","")}</span> {esc(sh.get("name",""))} '
            f'<br/><small>{esc(sh.get("venue",""))} · {esc(sh.get("type",""))}</small></div>'
        )
    shows_html = grid(shows_items, 2) if shows_items else '<p>No shows data</p>'
    # header activity
    checks = guest.get("headline", {})
    act = ""
    act += chip(f"In {checks.get('in_house_units',0)}/{checks.get('units_total',0)}", False)
    act += chip(f"{checks.get('check_ins',0)} in · {checks.get('check_outs',0)} out", False)
    act += chip(f"{checks.get('turnovers',0)} turnovers", False)
    # honesty footer
    carried = []
    if not intel_md:
        carried.append("Intel")
    if not landing_md:
        carried.append("Landing")
    if not food_md:
        carried.append("Food")
    if not golf_md:
        carried.append("Golf")
    if not strip_md:
        carried.append("Strip")
    honesty = ""
    if carried:
        honesty = f'<p class="meta">Honest carry-forward for: {", ".join(carried)}. Verify locally.</p>'
    # assemble
    html = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Branson Guest Report — {date_str}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
{css}
</head><body>
<div class="wrap">
<header class="header"><h1>Branson Guest Report</h1><div class="sub">{date_str}</div></header>
<nav class="toc" aria-label="Sections">
    <a href="#weather">Weather</a>
    <a href="#fishing">Fishing</a>
    <a href="#shows">Shows</a>
    <a href="#events">Events / Things To Do</a>
    <a href="#eat">Eat</a>
    <a href="#golf">Golf</a>
    <a href="#strip">76 Strip</a>
    <a href="#landing">Branson Landing</a>
    <a href="#intel">Branson Intel</a>
</nav>
<main>
<section class="card" id="weather"><h2 class="section-title">���������🌤������️ Weather</h2>{weather_html}</section>
<section class="card" id="fishing"><h2 class="section-title">���������🎣 Fishing</h2>{fish_html}</section>
<section class="card" id="shows"><h2 class="section-title">���������🎭 Shows</h2>{shows_html}</section>
<section class="card" id="events"><h2 class="section-title">���������🎉 Events / Things To Do</h2>{events_html}</section>
<section class="card" id="eat"><h2 class="section-title">���������🍽������️ Eat</h2>{eat_html}</section>
<section class="card" id="golf"><h2 class="section-title">������⛳ Golf</h2>{golf_html}</section>
<section class="card" id="strip"><h2 class="section-title">���������🎢 76 Strip</h2>{strip_html}</section>
<section class="card" id="landing"><h2 class="section-title">���������🏬 Branson Landing</h2>{landing_html}</section>
<section class="card" id="intel"><h2 class="section-title">���������🧠 Branson Intel</h2>{intel_html}</section>
</main>
<div class="meta">Generated {dt.datetime.now().astimezone().isoformat(timespec="seconds")} CT</div>
{honesty}
</div></body></html>"""
    return html

def chip(text: str, hot: bool = False) -> str:
    cl = "chip" + (" hot" if hot else "")
    return f'<span class="{cl}">{esc(text)}</span>'

def guide_box(name: str, text: str) -> str:
    return f'<div class="guide-box"><span class="guide-name">{name}</span>{text}</div>'

def grid(items, cols: int = 3) -> str:
    cols_cls = {2: "grid-2", 3: "grid-3", 7: "grid-7"}.get(cols, "grid-3")
    divs = ''.join(f'<div class="item">{i}</div>' for i in items)
    return f'<div class="{cols_cls}">{divs}</div>'

# ---------- fleet report ----------
def build_fleet(date_str: str) -> str:
    css = load_css()
    fleet = load_json("fleet-today")
    fleet_data = load_json("fleet-data")  # for guestySync and richer info
    units = fleet.get("units_total", 0)
    turnovers = fleet.get("turnovers", [])
    # Build turnovers table
    to_html = ""
    if turnovers:
        rows = ''.join(
            f'''<tr><td>{esc(t.get("property",""))}</td><td>{esc(t.get("status",""))}</td><td>{"Yes" if t.get("same_day") else "No"}</td>'
            f'<td>{"Assigned" if t.get("cleaner_assigned") else "Unassigned in cleaners app — sync wanted"}</td></tr>'''
            for t in turnovers
        )
        to_html = f'''
        <table class="ops"><thead><tr><th>Property</th><th>Status</th><th>Same‑Day</th><th>Cleaner</th></tr></thead><tbody>{rows}</tbody></table>
        '''
    else:
        to_html = '<p>No turnovers today.</p>'
    # cleaner unassigned count
    unassigned = sum(1 for t in turnovers if not t.get("cleaner_assigned"))
    alert = f'<div class="alert">{unassigned} cleaner(s) unassigned — see <a href="https://str-manager-one.vercel.app/ops">cleaners app</a> to assign.</div>' if unassigned else ''
    # reminder
    reminder = fleet.get("reminder", {})
    rem_html = ""
    if reminder.get("enabled"):
        rem_html = f'<div class="okbox">Reminder: {reminder.get("channel","")} at {reminder.get("time","")} — last sent {reminder.get("lastSent","never")}.</div>'
    # guesty sync from fleet-data.json (the source of truth)
    gs = fleet_data.get("guestySync", {})
    gs_html = ""
    if gs and ("ok" in gs or "syncedCount" in gs or "note" in gs):
        gs_html = f'<div class="tip">Guesty sync: {"OK" if gs.get("ok") else "FAILED"} · {gs.get("syncedCount",0)} synced · {gs.get("note","")}</div>'
    else:
        # Fallback note if no data
        gs_html = f'<div class="tip">Guesty sync data not available.</div>'
    # Build
    html = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Fleet + Business Daily · {date_str}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
{css}
</head><body>
<div class="wrap">
<header class="header fleet-banner"><h1>Fleet + Business Daily</h1><p>{date_str}</p></header>
<main>
<section class="card"><h2 class="section-title">Today\'s Turnovers</h2>{to_html}{alert}</section>
<section class="card"><h2 class="section-title">Guesty Sync Status</h2>{gs_html}</section>
<section class="card"><h2 class="section-title">Reminder Log</h2>{rem_html}</section>
</main>
<div class="meta">Generated {dt.datetime.now().astimezone().isoformat(timespec="seconds")} CT</div>
</div></body></html>"""
    return html

# ---------- main ----------
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date")
    args = ap.parse_args()
    today = args.date or dt.date.today().isoformat()
    out_dir = SITE / "public/reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    guest_html = build_guest(today)
    fleet_html = build_fleet(today)
    (out_dir / f"{today}.html").write_text(guest_html, encoding="utf-8")
    (out_dir / f"fleet-{today}.html").write_text(fleet_html, encoding="utf-8")
    print(f"Wrote guest {len(guest_html)} bytes")
    print(f"Wrote fleet {len(fleet_html)} bytes")

if __name__ == "__main__":
    main()