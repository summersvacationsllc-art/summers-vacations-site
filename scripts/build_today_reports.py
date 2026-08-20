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


def resolve_engine() -> Path:
    """Find branson-content-engine scouts on Mac host OR GitHub Actions checkout.

    2026-08-17: GH Actions Guest Daily used hardcoded ~/projects/... which does
    not exist on ubuntu-latest → empty scout_file() → ~6.5KB thin HTML that
    overwrote Hermes' full ~33KB magazine mid-morning. Prefer env, then local
    _food_scouts checkout, then the Mac absolute path.
    """
    env = os.environ.get("BRANSON_ENGINE") or os.environ.get("CONTENT_ENGINE")
    candidates: list[Path] = []
    if env:
        candidates.append(Path(env).expanduser())
    candidates.extend(
        [
            SITE / "_food_scouts",  # GH Actions sparse checkout path
            SITE.parent / "branson-content-engine",
            Path.home() / "projects/branson-content-engine",
            Path("/Users/briansummers/projects/branson-content-engine"),
        ]
    )
    for c in candidates:
        if (c / "data").is_dir():
            return c
    return candidates[-1]


ENG = resolve_engine()
DATE_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})\.md$")
# Floor for "real magazine" vs thin guard/GH-empty shell (2026-08-17 clobber)
MAGAZINE_MIN_BYTES = 14000

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
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

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

def meteo_week() -> list[dict]:
    try:
        url = (
            "https://api.open-meteo.com/v1/forecast?latitude=36.6509&longitude=-93.3691"
            "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
            "&temperature_unit=fahrenheit&timezone=America%2FChicago&forecast_days=7"
        )
        data = fetch_json(url)
        daily = data.get("daily") or {}
        out = []
        for i, day in enumerate(daily.get("time") or []):
            out.append({
                "date": day,
                "high_n": daily["temperature_2m_max"][i],
                "low_n": daily["temperature_2m_min"][i],
                "high": f"{round(daily['temperature_2m_max'][i])}°",
                "low": f"{round(daily['temperature_2m_min'][i])}°",
                "rain": f"{daily['precipitation_probability_max'][i]}% rain",
                "code": daily["weather_code"][i],
            })
        return out
    except Exception:
        return []


def meteo_for(date_str: str) -> dict:
    week = meteo_week()
    for row in week:
        if row.get("date") == date_str:
            return row
    return week[0] if week else {}


def load_editor_notes(date_str: str) -> dict:
    notes = load_json("editor-notes")
    if notes.get("for") == date_str:
        return notes
    return {}


def weekday_spotlight(restaurants: list[dict], date_str: str) -> dict:
    day = dt.date.fromisoformat(date_str).weekday()
    want = {
        0: "ozark mountain pizza",
        1: "farmhouse",
        2: "steamy joe",
        3: "white river",
        4: "big d",
        5: "lake house",
        6: "steamy joe",
    }[day]
    for r in restaurants:
        if want in (r.get("name") or "").lower():
            return r
    favorites = [r for r in restaurants if "favorite" in (r.get("tag") or "").lower()]
    return favorites[0] if favorites else (restaurants[0] if restaurants else {})


def day_desk(date_str: str, wx: dict) -> dict:
    notes = load_editor_notes(date_str)
    if notes:
        return notes
    d = dt.date.fromisoformat(date_str)
    high_n = wx.get("high_n") or 0
    heat = isinstance(high_n, (int, float)) and high_n >= 95
    if d.weekday() == 1:
        headline = "Steal the cool morning. Own the market."
        lede = f"{d.strftime('%A, %B %-d')}. High {wx.get('high') or 'hot'}, low {wx.get('low') or 'cooler at dawn'}. Farmers market 2:30–6:30 at the Landing — peaches, tomatoes, and shade if you time it right."
        featured = {
            "title": "Branson Farmers Market",
            "when": "2:30–6:30 PM",
            "where": "South lot by Bass Pro · Branson Landing",
            "why": "The only Tuesday that feels like a small town. Produce, jellies, live music. Free.",
            "url": "https://www.explorebranson.com/blog-explore/blog/post/branson-farmers-markets-2026/",
        }
        plan = [
            ("Dawn", "Lake or coffee", "Table Rock before the heat, or Steamy Joe at 7. Do not start this day at noon."),
            ("2:30 PM", "Landing market", "Park once. Walk the stalls. Then Farmhouse on Main if you want a real table."),
            ("Dusk", "A show, not a hike", "Theatres are air-conditioned. Confirm tonight’s board before you drive in."),
        ]
    else:
        headline = "Your Ozarks day starts now."
        lede = f"{d.strftime('%A, %B %-d')}. High {wx.get('high') or 'warm'}, low {wx.get('low') or 'cool dawn'}. Lake first, then a show — that’s the Branson rhythm."
        featured = {
            "title": "Fire & Water fountains",
            "when": "Hourly from noon",
            "where": "Branson Landing promenade",
            "why": "Free, easy, and the kids will ask to stay for one more.",
            "url": "https://bransonlanding.com/events",
        }
        plan = [
            ("Morning", "On the water", "Bass at first light. Trout when Taneycomo is low. Call SWPA before you launch."),
            ("Afternoon", "Shade and a show", "Museums, a matinee, or the pool. Save the Strip for after 5."),
            ("Evening", "Dinner, then a theatre", "Pizza on 265 or Main Street. Then Clay, Shepherd, or magic."),
        ]
    indoor = [
        ("WonderWorks", "Upside-down museum on the 76. Air conditioning that actually works.", "https://www.wonderworksonline.com/branson/"),
        ("Titanic Museum", "Cool, dark, and a two-hour story. Book ahead on busy weeks.", "https://titanicattraction.com/branson"),
        ("Aquarium at the Boardwalk", "Indoor tanks when the asphalt shimmers.", "https://www.aquariumattheboardwalk.com/"),
    ]
    return {
        "for": date_str,
        "headline": headline,
        "lede": lede,
        "heat": heat,
        "featured": featured,
        "plan": [{"when": a, "title": b, "detail": c} for a, b, c in plan],
        "indoor": [{"name": a, "detail": b, "url": c} for a, b, c in indoor],
        "honesty": "",
    }

def catalog_photo(name: str) -> dict:
    """Only a real catalog shot of this venue. No stock, no Pexels, no Unsplash, no AI."""
    p = SITE / "public" / "photos-catalog.json"
    if not p.exists():
        return {}
    try:
        photos = json.loads(p.read_text())
    except Exception:
        return {}
    key = re.sub(r"[^a-z0-9]+", " ", (name or "").lower()).strip()
    if len(key) < 6:
        return {}
    banned = (
        "representational",
        "generic stock",
        "generated",
        "ai generated",
        "flux",
        "imagine",
        "pexels",
        "unsplash",
        "stock tagged",
    )
    for photo in photos if isinstance(photos, list) else []:
        title = (photo.get("title") or "").lower()
        cat = (photo.get("category") or "").lower()
        blob = f"{title} {cat} {photo.get('url') or ''} {photo.get('source') or ''}".lower()
        if any(b in blob for b in banned):
            continue
        if "pexels.com" in blob or "unsplash.com" in blob:
            continue
        if key and key in re.sub(r"[^a-z0-9]+", " ", title):
            return photo
    return {}


def ext_link(url: str, label: str) -> str:
    if url and str(url).startswith("http"):
        return f'<a href="{esc(url)}" target="_blank" rel="noopener">{esc(label)}</a>'
    return ""


def map_link(name: str, label: str = "Map") -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (name or "").lower()).strip("-")
    return f'<a href="https://www.mybransonvacation.com/map?spot=eat-{esc(slug)}">{esc(label)}</a>'


def build_guest(date_str: str) -> str:
    css = load_css()
    fish = load_json("fishing-data")
    shows = load_json("shows-data")
    dining = load_json("dining-data")
    golf = load_json("golf-data")
    landing_md = scout_file("landing", date_str)
    intel_md = scout_file("intel", date_str)
    strip_md = scout_file("strip", date_str)
    week = meteo_week()
    wx = meteo_for(date_str)
    fw = fish.get("weather") or {}
    high = wx.get("high") or fw.get("high") or "mid-80s"
    low = wx.get("low") or fw.get("low") or "cool dawn"
    rain = wx.get("rain") or fw.get("wind") or "check skies"
    long_day = dt.date.fromisoformat(date_str).strftime("%A, %B %-d")
    desk = day_desk(date_str, wx)
    bite = first_sentence(re.sub(r"^&?\s*What's Biting\s*", "", fish.get("biteOfDay") or "", flags=re.I), 260)
    if not bite:
        bite = "Summer pattern: bass and walleye on gravel points at first light, trout when Taneycomo is low."
    cond = fish.get("conditions") or {}
    tr = cond.get("tableRock") or {}
    tc = cond.get("taneycomo") or {}

    show_tiles = []
    for sh in (shows.get("shows") or []):
        venue = sh.get("venue") or ""
        if venue.lower() in ("theater venue", "tba"):
            venue = "Branson"
        links = " ".join(x for x in (ext_link(sh.get("url") or "", "Tickets"),) if x)
        show_tiles.append(
            f'<article class="tile"><div class="when">{esc(sh.get("time") or "Tonight")}</div>'
            f'<h3>{esc(sh.get("name") or "")}</h3><p>{esc(venue)} · {esc(sh.get("type") or "Show")}</p>'
            f'<p class="more">{links}</p></article>'
        )
    restaurants = list(dining.get("restaurants") or [])
    spotlight = weekday_spotlight(restaurants, date_str)
    photo = catalog_photo(spotlight.get("name") or "")
    photo_url = photo.get("url") or photo.get("thumb") or ""
    spot_html = ""
    if spotlight:
        credit = photo.get("title") or ""
        img_tag = f'<img src="{esc(photo_url)}" alt="{esc(spotlight.get("name") or "")}">' if photo_url else ""
        credit_html = f'<div class="credit">{esc(credit)}</div>' if photo_url and credit else ""
        spot_html = (
            '<div class="spot">'
            f"{img_tag}"
            '<div class="spot-copy">'
            '<div class="kicker">Restaurant spotlight</div>'
            f'<h3>{esc(spotlight.get("name") or "")}</h3>'
            f'<p>{esc(spotlight.get("desc") or spotlight.get("tag") or "")}</p>'
            f'<p>{esc(spotlight.get("venue") or "")} · {esc(spotlight.get("cuisine") or "")} · {esc(spotlight.get("price") or "")}</p>'
            f'{ext_link(spotlight.get("url") or "", "Menu / hours")}'
            f'{map_link(spotlight.get("name") or "")}'
            f"{credit_html}"
            "</div></div>"
        )
    eat_tiles = []
    for r in restaurants:
        if spotlight and r.get("name") == spotlight.get("name"):
            continue
        links = " ".join(x for x in (ext_link(r.get("url") or "", "Site"), map_link(r.get("name") or "")) if x)
        eat_tiles.append(
            f'<article class="tile"><h3>{esc(r.get("name") or "")}</h3>'
            f'<p>{esc(r.get("venue") or "")} · {esc(r.get("cuisine") or r.get("tag") or "")}</p>'
            f'<p>{esc(first_sentence(r.get("desc") or "", 160))}</p>'
            f'<p class="more">{links}</p></article>'
        )
    golf_tiles = []
    for c in (golf.get("courses") or []):
        links = ext_link(c.get("url") or "", "Tee times")
        golf_tiles.append(
            f'<article class="tile"><h3>{esc(c.get("name") or "")}</h3>'
            f'<p>{esc(first_sentence(c.get("desc") or c.get("tag") or "Book a tee time.", 150))}</p>'
            f'<p class="more">{links}</p></article>'
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

    def tiles_html(pairs, extra_href: str = "", extra_label: str = "More"):
        out = []
        for n, d in pairs:
            more = f'<p class="more">{ext_link(extra_href, extra_label)}</p>' if extra_href else ""
            out.append(f'<article class="tile"><h3>{esc(n)}</h3><p>{esc(d)}</p>{more}</article>')
        return "".join(out)

    spec = ""
    for s in (fish.get("species") or [])[:6]:
        spec += (
            f'<div class="tile"><b>{esc(s.get("name") or "")}</b>'
            f'<p>{esc(s.get("rating") or "")} · {esc(first_sentence(s.get("technique") or "", 90))}</p></div>'
        )

    feat = desk.get("featured") or {}
    plan_html = "".join(
        f'<article class="tile"><div class="when">{esc(p.get("when") or "")}</div>'
        f'<h3>{esc(p.get("title") or "")}</h3><p>{esc(p.get("detail") or "")}</p></article>'
        for p in (desk.get("plan") or [])[:3]
    )
    indoor_html = "".join(
        f'<article class="tile"><h3>{esc(x.get("name") or "")}</h3><p>{esc(x.get("detail") or "")}</p>'
        f'<p class="more">{ext_link(x.get("url") or "", "Details")}</p></article>'
        for x in (desk.get("indoor") or [])[:3]
    )
    heat_html = ""
    if desk.get("heat") or (isinstance(wx.get("high_n"), (int, float)) and wx["high_n"] >= 95):
        heat_html = (
            '<div class="heat"><b>Heat desk</b>This is a 95°+ afternoon. Lake at dawn. '
            "Indoor 11–4. Water in the car. Theatres after 5. Do not hike Dogwood Canyon at 2 PM.</div>"
        )
    beat_photo = catalog_photo(feat.get("title") or "")
    beat_url = beat_photo.get("url") or beat_photo.get("thumb") or ""
    hero = ""
    if beat_url:
        hero = (
            f'<div class="hero-photo"><img src="{esc(beat_url)}" alt="{esc(feat.get("title") or "")}">'
            f'<span>{esc(beat_photo.get("title") or feat.get("title") or "")}</span></div>'
        )
    week_html = ""
    for row in week[:5]:
        dayname = dt.date.fromisoformat(row["date"]).strftime("%a")
        cls = "tile today" if row["date"] == date_str else "tile"
        week_html += f'<div class="{cls}"><i>{esc(dayname)}</i><b>{esc(row["high"])}</b><p>{esc(row["rain"])}</p></div>'
    show_stamp = shows.get("date") or ""
    honesty = desk.get("honesty") or ""
    if show_stamp and show_stamp != date_str:
        honesty = honesty or f"Showtimes last verified {show_stamp} — confirm the box office for {long_day}."
    feat_chip = feat.get("title") or "Tonight"
    headline = desk.get("headline") or "Your Ozarks day starts now."
    # split last sentence-ish for italic
    if "." in headline:
        h1, h2 = headline.rsplit(".", 1)[0], ""
        head_html = f"{esc(h1)}."
    else:
        parts = headline.rsplit(" ", 3)
        head_html = esc(" ".join(parts[:-3])) + "<br><em>" + esc(" ".join(parts[-3:])) + "</em>" if len(parts) > 3 else esc(headline)
    lede = desk.get("lede") or f"{long_day}. High {high}, low {low}."

    html = f"""<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>The Branson Daily · {esc(long_day)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"/>
{css}
</head><body>
<div class="wrap">
  <header class="mast">
    <div class="kicker">The Branson Daily · {esc(long_day)}</div>
    <h1>{head_html}</h1>
    <p class="lede">{esc(lede)}</p>
    <div class="issue">
      <span>{esc(high)} / {esc(low)}</span>
      <span>{esc(rain)}</span>
      <span>{esc(feat_chip)}</span>
    </div>
  </header>
  <nav class="toc" aria-label="Sections">
    <a href="#plan">Plan</a>
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
    <section class="spread card" id="plan">
      <h2 class="section-title">If you only do three things</h2>
      <p class="deck">First time in town? Follow this and you will not waste the cool hours.</p>
      {heat_html}
      {hero}
      <div class="plan">{plan_html}</div>
    </section>
    <section class="spread card" id="feature">
      <h2 class="section-title">Today’s highlight</h2>
      <p class="deck">{esc(feat.get("when") or "")} · {esc(feat.get("where") or "")}</p>
      <div class="spot">
        <div class="spot-copy">
          <div class="kicker">Editor’s pick</div>
          <h3>{esc(feat.get("title") or "")}</h3>
          <p>{esc(feat.get("why") or "")}</p>
          {ext_link(feat.get("url") or "", "Details")}
        </div>
      </div>
    </section>
    <section class="spread card" id="weather">
      <h2 class="section-title">Today’s sky</h2>
      <p class="deck">Pack a lake bag and a theatre layer. This week still runs hot.</p>
      <div class="wx">
        <div class="wx-big"><span>High</span><b>{esc(high)}</b><span>Low {esc(low)} · {esc(rain)}</span></div>
        <div class="wx-side">
          <div class="stat"><i>Table Rock</i><b>{esc(tr.get("temp") or "Warm")}</b> {esc(tr.get("level") or "")}</div>
          <div class="stat"><i>Taneycomo</i><b>Call generation</b> {esc(first_sentence(tc.get("generation") or "SWPA 866-494-1993", 90))}</div>
        </div>
      </div>
      <div class="weekstrip" style="margin-top:1rem">{week_html}</div>
      <p class="more">{ext_link("https://www.swpa.gov/", "SWPA generation")} · <a href="https://www.mybransonvacation.com/map">Open the live map</a></p>
    </section>
    <section class="spread card" id="shows">
      <h2 class="section-title">The full board</h2>
      <p class="deck">{len(show_tiles)} showtimes. {esc(honesty or "Confirm the box office before you drive in.")}</p>
      <div class="grid-2">{''.join(show_tiles)}</div>
      <p class="more">{ext_link("https://www.bransonshows.com/showByDate.cfm", "All Branson showtimes")}</p>
    </section>
    <section class="spread card" id="fishing">
      <h2 class="section-title">On the water</h2>
      <p class="quote">{esc(bite)}</p>
      <div class="grid-2">
        <div class="guide"><b>Table Rock guide</b>Dawn topwater on points, then slide deep to brush and ledges. Confirm the lake level before you idle the coves.</div>
        <div class="guide"><b>Taneycomo guide</b>Pink worms on the morning low-flow window. When generation jumps, drift the slack seams. Call SWPA 866-494-1993 before you launch.</div>
      </div>
      <div class="fish">{spec}</div>
      <p class="more">{ext_link("tel:8664941993", "Call SWPA")} · <a href="https://www.mybransonvacation.com/map?spot=fall-creek-marina">Fall Creek on the map</a></p>
    </section>
    <section class="spread card" id="eat">
      <h2 class="section-title">Where to eat</h2>
      <p class="deck">{len(restaurants)} spots we actually send guests. Spotlight rotates so it doesn’t feel like the same printout every day.</p>
      {spot_html}
      <div class="grid-2">{''.join(eat_tiles)}</div>
    </section>
    <section class="spread card" id="golf">
      <h2 class="section-title">Tee times</h2>
      <p class="deck">Ledgestone is five minutes from Notch Lane. Big Cedar is the splurge.</p>
      <div class="grid-2">{''.join(golf_tiles)}</div>
    </section>
    <section class="spread card" id="landing">
      <h2 class="section-title">Down at the Landing</h2>
      <p class="deck">{"Farmers market today 2:30–6:30 by Bass Pro. Fountains still run hourly." if dt.date.fromisoformat(date_str).weekday()==1 else "Free fountains every hour. Farmers market is Tuesday."}</p>
      <div class="grid-2">{tiles_html(landing_tiles, "https://bransonlanding.com/events", "Landing events")}</div>
    </section>
    <section class="spread card" id="strip">
      <h2 class="section-title">76 Strip thrills</h2>
      <p class="deck">Coasters, go-karts, and the upside-down museum when you need air conditioning.</p>
      <div class="grid-2">{tiles_html(strip_tiles, "https://www.mybransonvacation.com/map", "Open the map")}</div>
    </section>
    <section class="spread card" id="week">
      <h2 class="section-title">This week in town</h2>
      <p class="deck">Gospel Picnic at Silver Dollar City starts August 27. Freedom Journey runs all season.</p>
      <div class="grid-2">{tiles_html(intel_tiles, "https://www.silverdollarcity.com/", "Silver Dollar City")}</div>
    </section>
    <section class="spread card" id="shade">
      <h2 class="section-title">When the asphalt shimmers</h2>
      <p class="deck">Indoor backups so the afternoon does not wreck the trip.</p>
      <div class="grid-3">{indoor_html}</div>
    </section>
  </main>
  <p class="meta">Edited for first-time guests · <a href="https://www.mybransonvacation.com/branson">City card</a> · <a href="https://www.mybransonvacation.com/map">Map</a> · {esc(date_str)}{(" · " + esc(honesty)) if honesty else ""}</p>
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
def _is_magazine_body(text: str, size: int) -> bool:
    if size < 10000:
        return False
    head = (text or "")[:4000]
    if "Deadline guard edition" in head or "guest_deadline_guard.py" in head:
        return False
    return True


def write_guest_html(path: Path, new_html: str) -> tuple[int, str]:
    """Write guest magazine HTML with no-shrink protect.

    Never replace an existing full magazine with a thinner shell (GH Actions
    empty-scout builds, deadline-guard race). Returns (bytes_on_disk, action).
    """
    new_bytes = new_html.encode("utf-8")
    new_size = len(new_bytes)
    if path.is_file():
        try:
            old = path.read_text(encoding="utf-8", errors="replace")
            old_size = path.stat().st_size
        except OSError:
            old, old_size = "", 0
        if _is_magazine_body(old, old_size):
            # Keep prior magazine when new is thinner or under floor
            shrink = new_size < int(old_size * 0.85) or (
                new_size < MAGAZINE_MIN_BYTES and old_size >= MAGAZINE_MIN_BYTES
            )
            if shrink:
                print(
                    f"KEEP guest magazine {path.name}: existing {old_size}B > new {new_size}B "
                    f"(no-shrink protect; engine={ENG})"
                )
                return old_size, "kept-existing-magazine"
    path.write_text(new_html, encoding="utf-8")
    return new_size, "wrote"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date")
    args = ap.parse_args()
    today = args.date or dt.date.today().isoformat()
    out_dir = SITE / "public/reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"ENG scouts root: {ENG} (data exists={(ENG / 'data').is_dir()})")
    guest_html = build_guest(today)
    fleet_html = build_fleet(today)
    guest_path = out_dir / f"{today}.html"
    gsz, gact = write_guest_html(guest_path, guest_html)
    (out_dir / f"fleet-{today}.html").write_text(fleet_html, encoding="utf-8")
    print(f"Guest {guest_path.name}: {gsz} bytes ({gact}); built={len(guest_html)}B")
    print(f"Wrote fleet {len(fleet_html)} bytes")
    if gsz < MAGAZINE_MIN_BYTES:
        print(
            f"WARNING: guest HTML {gsz}B < {MAGAZINE_MIN_BYTES} magazine floor "
            f"— check scout path / dual writers"
        )

if __name__ == "__main__":
    main()