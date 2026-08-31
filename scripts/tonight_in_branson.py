#!/usr/bin/env python3
"""Tonight in Branson — always-on shows desk (lid-closed safe).

Like hooked_on_branson.py for fishing:
  - Runs on GitHub Actions at 5:30 CT without Brian's Mac
  - Rebuilds shows-magazine.json (editor pick + time buckets + chips)
  - Soft-enriches shows-data.json (sort minutes, chip, for, clean freeEvents)
  - Uses editor-notes featured when `for` == today
  - Uses today's scout markdown when present (GHA checkout or local)
  - Never invents showtimes; carry list is ok with honest desk note

Usage:
  python3 scripts/tonight_in_branson.py --date YYYY-MM-DD
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

CT = ZoneInfo("America/Chicago")
SITE = Path(__file__).resolve().parents[1]
REPORTS = SITE / "public" / "reports"
GENERIC_URL_MARKERS = (
    "showbydate.cfm",
    "bransonshows.com/show",
    "bransonshows.com/",
)
VAGUE_VENUE = re.compile(
    r"^(theater venue|various|various\s*/.*|tbd|check.*|venue)$", re.I
)

CHIP_RULES = [
    (re.compile(r"magic|illusion|reza|hamner|rick thomas", re.I), "magic", "🪄"),
    (re.compile(r"acrobat|circus|shanghai", re.I), "thrill", "🤸"),
    (re.compile(r"dinner|mystery|stampede|chuckwagon", re.I), "dinner", "🍽️"),
    (re.compile(r"comedy|baldknobber|jubilee", re.I), "comedy", "😂"),
    (re.compile(r"narnia|family|kids|children", re.I), "family", "👨‍👩‍👧"),
    (re.compile(r"outdoor|shepherd of the hills|drama", re.I), "outdoor", "🌙"),
    (re.compile(r"irish|celtic|tenor", re.I), "music", "🎶"),
    (re.compile(r"80|rock|anthem|legends|tribute|elvis|patsy|country|clay cooper|presley", re.I), "classic", "🎸"),
]


def today_ct() -> str:
    return datetime.now(CT).strftime("%Y-%m-%d")


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def parse_minutes(time_str: str | None) -> int | None:
    if not time_str:
        return None
    # first clock in string e.g. "7:30 PM & 8:00 PM"
    m = re.search(r"(\d{1,2}):(\d{2})\s*(AM|PM)", time_str, re.I)
    if not m:
        m2 = re.search(r"(\d{1,2})\s*(AM|PM)", time_str, re.I)
        if not m2:
            return None
        h = int(m2.group(1))
        ap = m2.group(2).upper()
        if ap == "PM" and h != 12:
            h += 12
        if ap == "AM" and h == 12:
            h = 0
        return h * 60
    h, mi, ap = int(m.group(1)), int(m.group(2)), m.group(3).upper()
    if ap == "PM" and h != 12:
        h += 12
    if ap == "AM" and h == 12:
        h = 0
    return h * 60 + mi


def bucket_for(mins: int | None) -> str:
    if mins is None:
        return "anytime"
    if mins < 16 * 60:  # before 4pm
        return "matinee"
    if mins < 19 * 60:  # before 7pm
        return "late_afternoon"
    return "evening"


def classify(show: dict) -> tuple[str, str]:
    blob = " ".join(
        str(show.get(k) or "")
        for k in ("name", "type", "tag", "venue", "desc", "why")
    )
    for rx, chip, icon in CHIP_RULES:
        if rx.search(blob):
            return chip, icon
    return "music", "🎭"


def url_is_specific(url: str | None) -> bool:
    if not url or not str(url).startswith("http"):
        return False
    u = str(url).lower()
    if "showbydate.cfm" in u:
        return False
    # bare bransonshows.com root / calendar only
    if re.search(r"bransonshows\.com/?$", u):
        return False
    return True


def clean_free_events(raw) -> list:
    out = []
    if not isinstance(raw, list):
        return out
    for item in raw:
        if isinstance(item, str):
            s = item.strip()
            if not s:
                continue
            if re.search(r"deadline[- ]guard|carried/partial|confirm box office", s, re.I):
                continue
            out.append({"name": s, "detail": ""})
        elif isinstance(item, dict):
            name = (item.get("name") or item.get("title") or "").strip()
            if not name:
                continue
            if re.search(r"deadline[- ]guard", name, re.I):
                continue
            out.append(
                {
                    "name": name,
                    "detail": (item.get("detail") or item.get("desc") or "").strip(),
                    "url": item.get("url") or "",
                    "when": item.get("when") or item.get("time") or "",
                }
            )
    return out


def find_scout(day: str) -> Path | None:
    candidates = []
    env = os.environ.get("SHOW_SCOUT_DIR") or os.environ.get("SHOWS_SCOUT_DIR")
    if env:
        candidates.append(Path(env) / f"{day}.md")
    engine = os.environ.get("BRANSON_ENGINE")
    if engine:
        candidates.append(Path(engine) / "data" / "shows" / f"{day}.md")
    candidates.append(REPORTS / "shows-scouts" / f"{day}.md")
    candidates.append(
        Path.home() / "projects" / "branson-content-engine" / "data" / "shows" / f"{day}.md"
    )
    for p in candidates:
        if p.exists() and p.stat().st_size >= 400:
            return p
    return None


def scout_blurb(path: Path | None) -> str:
    if not path:
        return ""
    text = path.read_text(encoding="utf-8", errors="replace")
    # Notes section or first meaty paragraph
    m = re.search(r"## Notes\s*\n+(.+?)(?:\n## |\n---|\Z)", text, re.S | re.I)
    if m:
        para = re.sub(r"\s+", " ", m.group(1)).strip()
        if len(para) > 40:
            return para[:420].rstrip(" .") + ("…" if len(para) > 420 else "")
    for line in text.splitlines():
        line = line.strip()
        if len(line) > 80 and not line.startswith("#") and not line.startswith("**Research"):
            return line[:420]
    return ""


def weekday_pack(day: str) -> dict:
    dt = datetime.strptime(day, "%Y-%m-%d").replace(tzinfo=CT)
    wd = dt.weekday()  # Mon=0
    packs = {
        0: (
            "Monday matinees, then the Strip lights up",
            "Early week is tribute-and-magic friendly — grab a 2 PM seat, dinner, then an 8 o’clock curtain.",
        ),
        1: (
            "Tuesday ticket window",
            "Good night to lock seats before the weekend rush. Matinee for heat escape, evening for the mainstage.",
        ),
        2: (
            "Midweek on the 76",
            "Hump-day boards mix country classics, illusion, and family productions — confirm times at the box office.",
        ),
        3: (
            "Thursday warm-up",
            "Pre-weekend energy on the Strip. Pick one matinee or go straight to an evening show.",
        ),
        4: (
            "Friday night Branson",
            "Curtains stack after dinner. Arrive early for parking; popular houses sell the best seats first.",
        ),
        5: (
            "Saturday full board",
            "Biggest day of the week for live entertainment — matinees for kids, evening for date night.",
        ),
        6: (
            "Sunday show day",
            "Family-friendly boards and indoor A/C picks. Verify Sunday times — some houses run a different schedule.",
        ),
    }
    hed, deck = packs.get(wd, packs[0])
    return {"hed": hed, "deck": deck}


def pick_from_editor(notes: dict, shows: list[dict]) -> dict | None:
    if not notes or notes.get("for") != notes.get("_day"):
        # caller sets _day
        pass
    feat = notes.get("featured") if isinstance(notes.get("featured"), dict) else None
    if not feat:
        return None
    title = (feat.get("title") or "").strip()
    if not title:
        return None
    # try match existing show
    match = None
    tlow = title.lower()
    for s in shows:
        n = (s.get("name") or "").lower()
        if tlow in n or n in tlow or any(
            tok in n for tok in re.findall(r"[a-z0-9]{4,}", tlow)[:3]
        ):
            match = s
            break
    return {
        "title": title,
        "when": feat.get("when") or (match or {}).get("time") or "",
        "where": feat.get("where") or (match or {}).get("venue") or "",
        "why": feat.get("why") or "",
        "url": feat.get("url")
        or ((match or {}).get("url") if url_is_specific((match or {}).get("url")) else "")
        or "",
        "source": "night-editor",
    }


def pick_from_list(shows: list[dict]) -> dict | None:
    """Deterministic editor-ish pick when no night editor: prefer evening + specific URL."""
    if not shows:
        return None
    ranked = []
    for s in shows:
        score = 0
        mins = s.get("_mins")
        if mins is not None and mins >= 19 * 60:
            score += 3
        if url_is_specific(s.get("url")):
            score += 2
        chip = s.get("chip") or ""
        if chip in ("magic", "outdoor", "classic", "family"):
            score += 1
        venue = s.get("venue") or ""
        if venue and not VAGUE_VENUE.match(venue.strip()):
            score += 1
        ranked.append((score, mins if mins is not None else 99 * 60, s))
    ranked.sort(key=lambda x: (-x[0], x[1]))
    s = ranked[0][2]
    why_map = {
        "magic": "Illusion and live stage craft — a sure crowd-pleaser.",
        "outdoor": "Ozarks outdoor drama — check weather and arrive early.",
        "classic": "Core Branson mainstage energy.",
        "family": "Easy multi-age pick.",
        "dinner": "Show + supper in one outing.",
        "thrill": "High-visual spectacle.",
        "comedy": "Laughs without homework.",
        "music": "Live music on the 76.",
    }
    return {
        "title": s.get("name") or "Tonight’s pick",
        "when": s.get("time") or "",
        "where": s.get("venue") or "",
        "why": why_map.get(s.get("chip") or "", "Solid board pick — confirm at the box office."),
        "url": s.get("url") if url_is_specific(s.get("url")) else (s.get("url") or ""),
        "source": "desk",
    }


def enrich_shows(shows: list[dict]) -> list[dict]:
    out = []
    for raw in shows:
        s = dict(raw)
        mins = parse_minutes(s.get("time"))
        s["_mins"] = mins
        s["sortMinutes"] = mins
        s["bucket"] = bucket_for(mins)
        chip, icon = classify(s)
        s["chip"] = chip
        s["icon"] = icon
        s["for"] = chip  # alias for filters
        # soften generic CTA — keep url but flag
        s["ticketOk"] = url_is_specific(s.get("url"))
        venue = (s.get("venue") or "").strip()
        if venue and VAGUE_VENUE.match(venue):
            s["venueNote"] = "Confirm venue"
        out.append(s)
    out.sort(key=lambda s: (s.get("sortMinutes") is None, s.get("sortMinutes") or 0, s.get("name") or ""))
    return out


def build_buckets(shows: list[dict]) -> list[dict]:
    order = [
        ("matinee", "Matinee", "Before 4 PM"),
        ("late_afternoon", "Late afternoon", "4–7 PM"),
        ("evening", "Evening", "7 PM and after"),
        ("anytime", "Time TBA", "Confirm box office"),
    ]
    buckets = []
    for key, label, blurb in order:
        items = [s for s in shows if s.get("bucket") == key]
        if not items:
            continue
        buckets.append(
            {
                "id": key,
                "label": label,
                "blurb": blurb,
                "count": len(items),
                "shows": [
                    {
                        "name": s.get("name"),
                        "time": s.get("time"),
                        "venue": s.get("venue"),
                        "type": s.get("type"),
                        "url": s.get("url") or "",
                        "chip": s.get("chip"),
                        "icon": s.get("icon"),
                        "ticketOk": s.get("ticketOk"),
                        "desc": s.get("desc") or s.get("why") or "",
                        "price": s.get("price") or "",
                    }
                    for s in items
                ],
            }
        )
    return buckets


def build_magazine(day: str, shows: list[dict], notes: dict, scout_path: Path | None) -> dict:
    pack = weekday_pack(day)
    notes = dict(notes or {})
    notes["_day"] = day
    feat_ok = notes.get("for") == day
    pick = pick_from_editor(notes, shows) if feat_ok else None
    if not pick:
        pick = pick_from_list(shows)

    hed = pack["hed"]
    deck = pack["deck"]
    if feat_ok and notes.get("headline"):
        hed = str(notes["headline"]).strip() or hed
    if feat_ok and notes.get("lede"):
        deck = str(notes["lede"]).strip() or deck
    blurb = scout_blurb(scout_path)
    if blurb and not feat_ok:
        deck = blurb

    chips = []
    seen = set()
    for s in shows:
        c = s.get("chip")
        if c and c not in seen:
            seen.add(c)
            chips.append({"id": c, "label": c.replace("_", " ").title(), "count": 0})
    for c in chips:
        c["count"] = sum(1 for s in shows if s.get("chip") == c["id"])

    indoor = []
    if feat_ok and isinstance(notes.get("indoor"), list):
        for it in notes["indoor"]:
            if isinstance(it, dict) and it.get("name"):
                indoor.append(
                    {
                        "name": it.get("name"),
                        "detail": it.get("detail") or "",
                        "url": it.get("url") or "",
                    }
                )

    source_bits = []
    if feat_ok:
        source_bits.append("night editor")
    if scout_path:
        source_bits.append(f"scout {scout_path.name}")
    source_bits.append("shows-data board")

    return {
        "date": day,
        "kicker": "Tonight in Branson",
        "brand": "The daily board",
        "hed": hed,
        "deck": deck,
        "pick": pick,
        "buckets": build_buckets(shows),
        "chips": chips,
        "indoor": indoor,
        "free": [],  # filled by caller
        "tomorrow": "Boards reshuffle overnight — open this tab tomorrow for a fresh pick and times.",
        "editor": {
            "stamp": "Tonight in Branson desk",
            "checked": day,
            "note": (
                "Times and seats change — confirm at the box office before you drive. "
                f"Sources: {', '.join(source_bits)}. "
                + (
                    "Scout prose on file."
                    if scout_path
                    else "No fresh shows scout on the runner — board may be carry-forward under today’s date."
                )
            ),
        },
        "counts": {
            "shows": len(shows),
            "withTickets": sum(1 for s in shows if s.get("ticketOk")),
        },
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=today_ct())
    args = ap.parse_args()
    day = args.date

    shows_path = REPORTS / "shows-data.json"
    mag_path = REPORTS / "shows-magazine.json"
    notes_path = REPORTS / "editor-notes.json"

    data = load_json(shows_path)
    shows_in = list(data.get("shows") or [])
    if not shows_in:
        print("tonight_in_branson: no shows in shows-data.json", file=sys.stderr)
        # still write a thin honest magazine so UI doesn't blank forever
        mag = {
            "date": day,
            "kicker": "Tonight in Branson",
            "hed": "Board still loading",
            "deck": "No shows file on the desk yet — check back after the morning sync.",
            "pick": None,
            "buckets": [],
            "chips": [],
            "free": [],
            "editor": {
                "stamp": "Tonight in Branson desk",
                "checked": day,
                "note": "Empty shows-data.json",
            },
        }
        write_json(mag_path, mag)
        return 0

    enriched = enrich_shows(shows_in)
    notes = load_json(notes_path)
    scout = find_scout(day)
    if scout:
        # keep a copy for lid-closed GHA week
        dest = REPORTS / "shows-scouts" / f"{day}.md"
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(scout.read_text(encoding="utf-8"), encoding="utf-8")
        except Exception as e:
            print(f"scout copy skip: {e}", file=sys.stderr)

    mag = build_magazine(day, enriched, notes, scout)
    free = clean_free_events(data.get("freeEvents"))
    mag["free"] = free

    # Write magazine
    write_json(mag_path, mag)

    # Soft-update shows-data: keep names/times, add helper fields, clean freeEvents
    cleaned_shows = []
    for s in enriched:
        row = {k: v for k, v in s.items() if not str(k).startswith("_")}
        cleaned_shows.append(row)
    out_data = {
        "date": data.get("date") or day,
        "shows": cleaned_shows,
        "freeEvents": free,
        "magazineBuilt": day,
        "last_verified": data.get("last_verified") or day,
    }
    # If file date is stale but we're building today, stamp date only when shows look today's
    # Don't silently claim a fossil board is "today" without note — magazine editor.note covers it.
    write_json(shows_path, out_data)

    print(
        f"tonight_in_branson ok date={day} shows={len(cleaned_shows)} "
        f"pick={(mag.get('pick') or {}).get('title')} scout={bool(scout)} "
        f"buckets={len(mag.get('buckets') or [])}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
