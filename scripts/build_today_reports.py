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
def clean_text(s: str) -> str:
    s = re.sub(r"[*_`>#]+", "", s or "")
    s = re.sub(r"\s+", " ", s).strip()
    return s

def first_sentence(s: str, n: int = 220) -> str:
    s = clean_text(s)
    if len(s) <= n:
        return s
    cut = s[:n]
    if " " in cut:
        cut = cut.rsplit(" ", 1)[0]
    return cut.rstrip(" ,;:") + "…"

def md_tiles(md: str, limit: int = 4) -> list[str]:
    if not md:
        return []
    tiles = []
    parts = re.split(r"\n(?=###\s+)", md)
    skip = ("honest", "how to use", "sources", "prior verified", "notes", "generator")
    for part in parts:
        m = re.match(r"###\s+(.+)", part)
        if not m:
            continue
        name = clean_text(m.group(1))
        if len(name) < 4 or name.lower().startswith(skip):
            continue
        body = ""
        for line in part.splitlines()[1:]:
            line = line.strip()
            if not line or line.startswith(">") or line.startswith("- **Today") or line.startswith("- **Last") or line.startswith("- **Next"):
                if line.startswith("- **Next"):
                    body = clean_text(line.replace("- **Next:**", "Next:").replace("- **Next**", "Next"))
                    break
                continue
            if line.startswith("#") or line.startswith("---"):
                continue
            body = first_sentence(line, 180)
            if body:
                break
        tiles.append((name, body or "Worth a look this week."))
        if len(tiles) >= limit:
            break
    return tiles

def meteo_today() -> dict:
    try:
        url = (
            "https://api.open-meteo.com/v1/forecast?latitude=36.6509&longitude=-93.3691"
            "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
            "&temperature_unit=fahrenheit&timezone=America%2FChicago&forecast_days=2"
        )
        data = fetch_json(url)
        daily = data.get("daily") or {}
        return {
            "high": f"{round(daily['temperature_2m_max'][0])}°",
            "low": f"{round(daily['temperature_2m_min'][0])}°",
            "rain": f"{daily['precipitation_probability_max'][0]}% rain",
            "tom_high": f"{round(daily['temperature_2m_max'][1])}°" if len(daily.get("temperature_2m_max") or []) > 1 else "",
        }
    except Exception:
        return {}

def build_guest(date_str: str) -> str:
    css = load_css()
    fish = load_json("fishing-data")
    shows = load_json("shows-data")
    dining = load_json("dining-data")
    golf = load_json("golf-data")
    landing_md = scout_file("landing", date_str)
    intel_md = scout_file("intel", date_str)
    strip_md = scout_file("strip", date_str)
    wx = meteo_today()
    fw = fish.get("weather") or {}
    high = wx.get("high") or fw.get("high") or "mid-80s"
    low = wx.get("low") or fw.get("low") or "cool dawn"
    rain = wx.get("rain") or fw.get("wind") or "check skies"
    long_day = dt.date.fromisoformat(date_str).strftime("%A, %B %-d")
    bite = first_sentence(re.sub(r"^&?\s*What's Biting\s*", "", fish.get("biteOfDay") or "", flags=re.I), 260)
    if not bite:
        bite = "Summer pattern: bass and walleye on gravel points at first light, trout when Taneycomo is low."
    cond = fish.get("conditions") or {}
    tr = cond.get("tableRock") or {}
    tc = cond.get("taneycomo") or {}

    show_tiles = []
    for sh in (shows.get("shows") or [])[:8]:
        venue = sh.get("venue") or ""
        if venue.lower() in ("theater venue", "tba"):
            venue = "Branson"
        href = sh.get("url") or ""
        link = f'<a href="{esc(href)}" target="_blank" rel="noopener">Tickets</a>' if href.startswith("http") else ""
        show_tiles.append(
            f'<article class="tile"><div class="when">{esc(sh.get("time") or "Tonight")}</div>'
            f'<h3>{esc(sh.get("name") or "")}</h3><p>{esc(venue)} · {esc(sh.get("type") or "Show")}</p>{link}</article>'
        )
    eat_tiles = []
    for r in (dining.get("restaurants") or [])[:6]:
        eat_tiles.append(
            f'<article class="tile"><h3>{esc(r.get("name") or "")}</h3>'
            f'<p>{esc(first_sentence(r.get("desc") or r.get("tag") or r.get("cuisine") or "Local favorite.", 140))}</p></article>'
        )
    golf_tiles = []
    for c in (golf.get("courses") or [])[:6]:
        golf_tiles.append(
            f'<article class="tile"><h3>{esc(c.get("name") or "")}</h3>'
            f'<p>{esc(first_sentence(c.get("desc") or c.get("tag") or "Book a tee time.", 140))}</p></article>'
        )
    landing_tiles = md_tiles(landing_md, 3)
    intel_tiles = md_tiles(intel_md, 3)
    strip_tiles = md_tiles(strip_md, 3)
    if not landing_tiles:
        landing_tiles = [
            ("Hourly Fire & Water show", "Fountains on the hour from noon. Free, easy, and great after dinner."),
            ("Farmers market tomorrow", "Tuesday 2:30–6:30 PM in the south lot by Bass Pro."),
        ]
    if not intel_tiles:
        intel_tiles = [
            ("Silver Dollar City", "America’s 250th season still running — gospel picnic starts Aug 27."),
            ("Freedom Journey", "Patriotic exhibits at College of the Ozarks through December."),
        ]
    if not strip_tiles:
        strip_tiles = [
            ("The Track & coasters", "Go-karts and mountain coasters when the kids need speed."),
            ("WonderWorks / Titanic", "Indoor cool-down museums on the 76."),
        ]

    def tiles_html(pairs):
        return "".join(f'<article class="tile"><h3>{esc(n)}</h3><p>{esc(d)}</p></article>' for n, d in pairs)

    spec = ""
    for s in (fish.get("species") or [])[:6]:
        spec += (
            f'<div class="tile"><b>{esc(s.get("name") or "")}</b>'
            f'<p>{esc(s.get("rating") or "")} · {esc(first_sentence(s.get("technique") or "", 90))}</p></div>'
        )

    html = f"""<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>The Branson Daily · {esc(long_day)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"/>
{css}
</head><body>
<div class="wrap">
  <header class="mast">
    <div class="kicker">The Branson Daily</div>
    <h1>Your Ozarks day<br><em>starts now.</em></h1>
    <p class="lede">{esc(long_day)}. High {esc(high)}, low {esc(low)}. Lake first, then a show — that’s the Branson rhythm.</p>
    <div class="issue">
      <span>{esc(high)} / {esc(low)}</span>
      <span>{esc(rain)}</span>
      <span>Clay Cooper 7:30</span>
      <span>Market tomorrow</span>
    </div>
  </header>
  <nav class="toc" aria-label="Sections">
    <a href="#weather">Sky</a>
    <a href="#shows">Shows</a>
    <a href="#fishing">Lake</a>
    <a href="#eat">Eat</a>
    <a href="#golf">Golf</a>
    <a href="#landing">Landing</a>
    <a href="#strip">Strip</a>
    <a href="#week">This week</a>
  </nav>
  <main>
    <section class="spread card" id="weather">
      <h2 class="section-title">Today’s sky</h2>
      <p class="deck">Pack a lake bag and a theatre layer. August still means warm afternoons.</p>
      <div class="wx">
        <div class="wx-big"><span>High</span><b>{esc(high)}</b><span>Low {esc(low)} · {esc(rain)}</span></div>
        <div class="wx-side">
          <div class="stat"><i>Table Rock</i><b>{esc(tr.get("temp") or "Warm")}</b> {esc(tr.get("level") or "")}</div>
          <div class="stat"><i>Taneycomo</i><b>Call generation</b> {esc(first_sentence(tc.get("generation") or "SWPA 866-494-1993", 90))}</div>
        </div>
      </div>
    </section>
    <section class="spread card" id="shows">
      <h2 class="section-title">Tonight on stage</h2>
      <p class="deck">Irish tenors this afternoon. Clay Cooper, Shepherd, Legends, and magic after dark.</p>
      <div class="grid-2">{''.join(show_tiles)}</div>
    </section>
    <section class="spread card" id="fishing">
      <h2 class="section-title">On the water</h2>
      <p class="quote">{esc(bite)}</p>
      <div class="grid-2">
        <div class="guide"><b>Table Rock guide</b>Dawn topwater on points, then slide deep to brush and ledges. Confirm the lake level before you idle the coves.</div>
        <div class="guide"><b>Taneycomo guide</b>Pink worms on the morning low-flow window. When generation jumps, drift the slack seams. Call SWPA 866-494-1993 before you launch.</div>
      </div>
      <div class="fish">{spec}</div>
    </section>
    <section class="spread card" id="eat">
      <h2 class="section-title">Where to eat</h2>
      <p class="deck">Steamy Joe for coffee. Ozark Mountain Pizza after the lake. Farmhouse if you want a Main Street table.</p>
      <div class="grid-2">{''.join(eat_tiles)}</div>
    </section>
    <section class="spread card" id="golf">
      <h2 class="section-title">Tee times</h2>
      <p class="deck">Ledgestone is five minutes from Notch Lane. Big Cedar is the splurge.</p>
      <div class="grid-2">{''.join(golf_tiles)}</div>
    </section>
    <section class="spread card" id="landing">
      <h2 class="section-title">Down at the Landing</h2>
      <p class="deck">Free fountains every hour. Farmers market is Tuesday — not today.</p>
      <div class="grid-2">{tiles_html(landing_tiles)}</div>
    </section>
    <section class="spread card" id="strip">
      <h2 class="section-title">76 Strip thrills</h2>
      <p class="deck">Coasters, go-karts, and the upside-down museum when you need air conditioning.</p>
      <div class="grid-2">{tiles_html(strip_tiles)}</div>
    </section>
    <section class="spread card" id="week">
      <h2 class="section-title">This week in town</h2>
      <p class="deck">Gospel Picnic at Silver Dollar City starts August 27. Freedom Journey runs all season.</p>
      <div class="grid-2">{tiles_html(intel_tiles)}</div>
    </section>
  </main>
  <p class="meta">Edited for guests · mybransonvacation.com · {esc(date_str)}</p>
</div>
</body></html>"""
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