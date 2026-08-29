#!/usr/bin/env python3
"""Hooked on Branson — always-on builder for GitHub Actions (no Mac, no LLM).

Pulls live USACE Table Rock gage + last-7 fishing scouts (if present) and
writes public/reports/fishing-magazine.json and patches fishing-data.json.

Scout dirs (first hit wins):
  FISH_SCOUT_DIR
  BRANSON_ENGINE/data/fishing
  _food_scouts/data/fishing
  public/reports/fishing-scouts
"""
from __future__ import annotations

import datetime as dt
import json
import re
import sys
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

CT = ZoneInfo("America/Chicago")
USACE = "https://www.swl-wc.usace.army.mil/pages/data/tabular/htm/tabrock.htm"
ROW_RE = re.compile(
    r"(\d{2}[A-Z]{3}\d{4})\s+(\d{4})\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)"
)
STUB_RE = re.compile(
    r"HONEST CARRY-FORWARD|honest_scout_fallback|Pipeline recovery run",
    re.I,
)
LEVEL_RE = re.compile(
    r"Table Rock Lake Level:\s*[~≈]?\s*([0-9]{3}\.[0-9]{1,2})",
    re.I,
)

SEASON_PACKS = [
    (
        (3, 1), (5, 15), "Spawn",
        "Bass and crappie are in the skinny water for a few weeks. This is the only season we will tell a first-timer to fish a bank in daylight. After the full moon in May, it is over.",
        [
            "Creeks and secondary points, 2–8 feet, on a warming afternoon.",
            "Crappie: docks and brush, minnow or a small jig. Keep what you will eat.",
            "Taneycomo is still a generation game. Spawn on the lake does not change the dam.",
            "If the water is muddy after a spring rain, fish the stain edge, not the mud.",
        ],
        [
            ("Fish the north banks first.", "They warm first in March. A slow-rolled spinnerbait in stained water will outfish a finesse bait until the lake clears."),
            ("Leave the beds alone after lunch.", "If you can see them, so can everyone. Morning, then go. Catch-and-release on the bed fish is how this lake stays a lake."),
            ("Crappie at the dock pilings.", "Vertical. Tiny jig. Don't leave a brush pile that marks."),
        ],
    ),
    (
        (5, 16), (8, 9), "Early summer",
        "Topwater is still honest at daylight. The thermocline is building. Night fishing starts to beat noon.",
        [
            "Walking bait or buzzbait until the sun clears the hills.",
            "Then ledges, 10–20 feet, a jig or a crank that dives.",
            "Taneycomo: low morning generation is the family window.",
            "Hydrate. The heat index here lies.",
        ],
        [
            ("The first hour is the whole trip.", "Be on the water at civil twilight, not 8. A buzzbait around wood is the play until it isn't."),
            ("Night on the points.", "After 9 p.m. the lake belongs to people who brought a headlamp and cut bait."),
            ("Call the dam for the kids.", "Low water on Taneycomo in the morning is the only trout trip that doesn't require a boat."),
        ],
    ),
    (
        (8, 10), (9, 20), "Dog days",
        "This is the hard season on the White River system, and it is also when the fishermen who live here quietly catch fish. Thermocline is set. Shad are deep. Table Rock surface is in the 80s. Taneycomo is still 50-degree tailwater.",
        [
            "Fish the first 45 minutes like it matters. After that, put the topwater away.",
            "Table Rock: 15–35 feet, electronics on. You are looking for bait, not banks.",
            "Taneycomo: two- to six-pound test, pink Power Worm, no hero hookset.",
            "MDC wants spotted bass harvested on Table Rock. Keep the spots. Put the 12-to-20-inch rainbows back.",
            "Noon in August is not a fishing hour. Night on the points is a different lake.",
            "License 16–64, plus a trout permit for Taneycomo. Bass Pro at the Landing sells both.",
        ],
        [
            ("Call the dam before you wet a line.", "SWPA is 866-494-1993. Dial it in the parking lot. Off or near-off: pink worm, wade, kids. Two-thousand-plus cfs: dock or boat, fish the seams."),
            ("Find the shad, not the bank.", "If the graph is empty, keep moving. Late August bass live on bait schools in 15–35 feet. A flutter spoon through them is the grown-up play."),
            ("Pink worm, two-pound, no hero set.", "Taneycomo in this clarity punishes heavy line and a hard hookset. Let them eat. Sweep."),
            ("Leave at 10.", "The honest August trip is over before the strip gets busy. Night is the second shift, not noon."),
            ("Harvest the spots.", "MDC's Table Rock advice: keep spotted bass. The largemouth and smallmouth will thank you. Put slot rainbows back."),
            ("Nightcrawler on gravel after dark.", "Walleye have been the honest bright spot all week. Points, 15–25 feet, after the ski boats quit."),
            ("Don't wad a rising tailrace.", "If you didn't call SWPA, you don't go in. That is not a tip. That is how people get hurt below Table Rock Dam."),
        ],
    ),
    (
        (9, 21), (11, 15), "Fall turnover",
        "The lake turns over and the fish don't read the same book they did in August. Crankbaits get good again. Trout streamers get good. This is the season Branson locals wait for.",
        [
            "Windblown banks and shad-colored cranks, 8–18 feet.",
            "Walleye on the same gravel they used all summer, just shallower.",
            "Taneycomo: streamers and wooly buggers when they generate. Hoppers until the first frost.",
            "A jacket in the boat. Dawn is cold before the strip is.",
        ],
        [
            ("Fish the wind.", "Fall bass set up where the shad get blown. A crankbait that bangs is better than a worm that sits."),
            ("Streamer on the generate.", "When SWPA spins it, Taneycomo becomes a small river. A dark wooly bugger in the seams."),
            ("Don't quit at 10.", "Fall is the opposite of August. The bite can last until lunch."),
        ],
    ),
    (
        (11, 16), (2, 29), "Winter trout",
        "Table Rock gets quiet and vertical. Taneycomo becomes the reason you came. This is Johnny Morris water — cold, clear, and honest.",
        [
            "Spoon or ice jig over 30–50 feet on Table Rock if you must. Most people shouldn't.",
            "Taneycomo is the trip: midges, eggs, pink worms, tiny jigs, 2-pound test.",
            "Generation still rules. A winter blowdown is a drift day.",
            "Felt soles and a staff if you wad. The rocks don't care that you're on vacation.",
        ],
        [
            ("Midge. Down. Slow.", "Winter rainbows eat tiny and they eat on the pause. If you can't see your fly, you're fishing."),
            ("Vertical or go trout.", "A jigging spoon on Table Rock is a specialist's game in January. Taneycomo will treat a first-timer better."),
            ("Warm the hands, not the water.", "Fish the warmest part of the afternoon on the lake. Fish first light on the trout water. Different climates."),
        ],
    ),
]


def today() -> dt.date:
    return dt.datetime.now(CT).date()


def _in_range(md, start, end) -> bool:
    if start <= end:
        return start <= md <= end
    return md >= start or md <= end


def season_pack(day: dt.date) -> dict:
    md = (day.month, day.day)
    for start, end, name, why, tips, plays in SEASON_PACKS:
        if _in_range(md, start, end):
            play = plays[day.timetuple().tm_yday % len(plays)]
            return {"name": name, "why": why, "tips": tips, "play": {"title": play[0], "body": play[1]}}
    start, end, name, why, tips, plays = SEASON_PACKS[2]
    play = plays[day.timetuple().tm_yday % len(plays)]
    return {"name": name, "why": why, "tips": tips, "play": {"title": play[0], "body": play[1]}}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def scout_dirs() -> list[Path]:
    import os
    out: list[Path] = []
    env = os.environ.get("FISH_SCOUT_DIR")
    if env:
        out.append(Path(env))
    engine = os.environ.get("BRANSON_ENGINE")
    if engine:
        out.append(Path(engine) / "data" / "fishing")
    root = repo_root()
    out.append(root / "_food_scouts" / "data" / "fishing")
    out.append(root / "public" / "reports" / "fishing-scouts")
    out.append(Path.home() / "projects" / "branson-content-engine" / "data" / "fishing")
    return out


def load_scout(day: dt.date) -> str:
    name = f"{day.isoformat()}.md"
    for d in scout_dirs():
        p = d / name
        if p.is_file() and p.stat().st_size >= 400:
            return p.read_text(errors="replace")
    return ""


def is_fresh(body: str) -> bool:
    if not body or len(body) < 800:
        return False
    return not STUB_RE.search(body[:1200])


def fetch_usace() -> dict | None:
    html = None
    req = urllib.request.Request(USACE, headers={"User-Agent": "HookedOnBranson/1.0"})
    contexts = []
    try:
        import certifi
        import ssl as _ssl
        contexts.append(_ssl.create_default_context(cafile=certifi.where()))
    except Exception:
        pass
    import ssl as _ssl
    contexts.append(_ssl.create_default_context())
    contexts.append(_ssl._create_unverified_context())  # army.mil chain is often missing on GHA
    last_err = None
    for ctx in contexts:
        try:
            with urllib.request.urlopen(req, timeout=25, context=ctx) as r:
                html = r.read().decode("utf-8", "replace")
            break
        except Exception as exc:
            last_err = exc
            continue
    if not html:
        print(f"USACE fetch failed: {last_err}", file=sys.stderr)
        return None
    rows = []
    for m in ROW_RE.finditer(html):
        rows.append(
            {
                "stamp": m.group(1),
                "hhmm": m.group(2),
                "elev": float(m.group(3)),
                "tail": float(m.group(4)),
                "mwh": int(m.group(5)),
                "turbine": int(m.group(6)),
                "spill": int(m.group(7)),
                "total": int(m.group(8)),
            }
        )
    if not rows:
        print("USACE parse: no rows", file=sys.stderr)
        return None
    last = rows[-1]
    today_rows = [x for x in rows if x["stamp"] == last["stamp"]] or rows[-24:]
    overnight = [x for x in today_rows if int(x["hhmm"]) <= 700]
    afternoon = [x for x in today_rows if 1400 <= int(x["hhmm"]) <= 2100]
    return {
        "elev": last["elev"],
        "cfs": last["total"],
        "turbine": last["turbine"],
        "hhmm": last["hhmm"],
        "stamp": last["stamp"],
        "overnight_cfs": min((x["total"] for x in overnight), default=last["total"]),
        "afternoon_cfs": max((x["total"] for x in afternoon), default=last["total"]),
        "n": len(rows),
    }


def week_from(day: dt.date, gage: dict | None, existing: dict) -> list[dict]:
    prev = {w.get("date"): w for w in (existing.get("week") or []) if w.get("date")}
    out = []
    for i in range(6, -1, -1):
        d = day - dt.timedelta(days=i)
        body = load_scout(d)
        lvl = None
        m = LEVEL_RE.search(body) if body else None
        if m:
            lvl = m.group(1)
        elif d.isoformat() in prev and re.match(r"^[0-9]", str(prev[d.isoformat()].get("level") or "")):
            lvl = str(prev[d.isoformat()]["level"])
        if d == day and gage:
            lvl = f"{gage['elev']:.2f}"
        out.append(
            {
                "date": d.isoformat(),
                "label": d.strftime("%a")[:3],
                "level": lvl or "—",
                "fresh": bool(gage) if d == day else is_fresh(body),
            }
        )
    return out


def week_graf(week: list[dict], gage: dict | None) -> str:
    nums = [w for w in week if re.match(r"^[0-9]", w["level"])]
    bits = []
    if len(nums) >= 2:
        first, last = nums[0]["level"], nums[-1]["level"]
        try:
            delta = round(float(first) - float(last), 2)
        except ValueError:
            delta = None
        if delta and delta > 0.15:
            bits.append(
                f"The pool walked down from {first} early in the week to {last} this morning — "
                f"about {delta} ft off that earlier mark, still under the 915 full pool."
            )
        elif delta and delta < -0.15:
            bits.append(f"The lake ticked up from {first} to {last} this week.")
        else:
            bits.append(f"Table Rock held near {last} ft all week, a hair under full pool (915).")
    if gage:
        bits.append(
            f"Live USACE reading {gage['hhmm'][:2]}:{gage['hhmm'][2:]} CT: "
            f"{gage['elev']:.2f} ft, {gage['cfs']:,} cfs through the dam."
        )
    bits.append("Ramps are still in. Shallow coves feel a falling pool first.")
    return " ".join(bits)


def usace_grafs(gage: dict, pack: dict) -> tuple[list[str], list[str]]:
    cfs = gage["cfs"]
    elev = gage["elev"]
    night = gage["overnight_cfs"]
    dayc = gage["afternoon_cfs"]
    tr = [
        f"Table Rock sits at {elev:.2f} ft this morning — a live USACE number, not a guess. "
        f"Full pool is 915. Heat and a falling or hanging pool put bass on main-lake points, "
        f"gravel, brush, and the first good humps in 15 to 35 feet. If you don't have electronics, you are guessing at bait.",
        f"Generation at the dam right now is {cfs:,} cfs (turbine {gage['turbine']:,}). "
        f"Overnight it backed off to about {night:,}; the afternoon peak on this sheet hit {dayc:,}. "
        f"That pattern — quiet early, lean on it later — is the late-summer White River book.",
        pack["why"],
    ]
    ty = [
        "Below Table Rock Dam this is a trout river that happens to be called a lake. "
        "The water comes out of the bottom cold and gin-clear. The generators decide whether you wade or drift.",
        f"Last printed reading: {cfs:,} cfs at {gage['hhmm'][:2]}:{gage['hhmm'][2:]} CT. "
        "We will not invent the next hour. Southwestern Power keeps the live sheet. "
        "The number is 866-494-1993. Call it in the parking lot. "
        "Off or near-off: pink Power Worm, wade, kids. Two-thousand-plus: dock or boat, fish the seams.",
        "Light line — two to six pound. Rainbows are most of the creel. "
        "Slot in the upper water: put the 12-to-20-inch rainbows back. "
        "Don't horse them in this clarity. Don't wad a rising tailrace.",
    ]
    return tr, ty


def patch_fishing_data(reports: Path, day: dt.date, gage: dict | None) -> None:
    p = reports / "fishing-data.json"
    obj = {}
    if p.is_file():
        try:
            obj = json.loads(p.read_text())
        except Exception:
            obj = {}
    obj["date"] = day.isoformat()
    obj.setdefault("conditions", {})
    obj["conditions"].setdefault("tableRock", {})
    obj["conditions"].setdefault("taneycomo", {})
    if gage:
        obj["conditions"]["tableRock"]["level"] = f"{gage['elev']:.2f} ft (USACE {gage['hhmm'][:2]}:{gage['hhmm'][2:]} CT)"
        obj["conditions"]["taneycomo"]["generation"] = (
            f"~{gage['cfs']:,} cfs at {gage['hhmm'][:2]}:{gage['hhmm'][2:]} CT (USACE live). "
            f"Overnight ~{gage['overnight_cfs']:,}; afternoon peak ~{gage['afternoon_cfs']:,}. "
            "Call SWPA 866-494-1993 before you wad."
        )
        obj["conditions"]["taneycomo"]["clarity"] = "Very clear"
        obj["conditions"]["taneycomo"]["temp"] = "Tailwater cold (typically ~50–54°F). Verify at the bank."
        obj["source"] = "usace-always-on"
    obj["last_verified"] = dt.datetime.now(CT).isoformat(timespec="seconds")
    # kill the rental-brochure tip if it's still in there
    tip = obj.get("tip") or ""
    if "multi-generational" in tip.lower() or "summers vacations rental" in tip.lower():
        obj["tip"] = "Call SWPA 866-494-1993 before you wad Taneycomo. Fish early. Leave when it gets stupid hot."
    p.write_text(json.dumps(obj, indent=2) + "\n")


def build(day: dt.date) -> dict:
    reports = repo_root() / "public" / "reports"
    mag_path = reports / "fishing-magazine.json"
    existing = {}
    if mag_path.is_file():
        try:
            existing = json.loads(mag_path.read_text())
        except Exception:
            existing = {}

    gage = fetch_usace()
    pack = season_pack(day)
    body = load_scout(day)
    fresh = is_fresh(body)
    week = week_from(day, gage, existing)
    lvl = f"{gage['elev']:.2f}" if gage else None

    editor_today = (
        existing.get("date") == day.isoformat()
        and (existing.get("tableRock") or {}).get("body")
        and existing.get("hed")
        and (existing.get("editor") or {}).get("stamp") == "Hooked on Branson"
        and "always-on" not in ((existing.get("editor") or {}).get("note") or "").lower()
    )

    if editor_today:
        obj = dict(existing)
        obj["kicker"] = "Hooked on Branson"
        obj["brand"] = "The daily read"
        obj["week"] = week
        obj["weekGraf"] = week_graf(week, gage)
        if gage:
            tr = dict(obj.get("tableRock") or {})
            now = dict(tr.get("now") or {})
            now["level"] = f"{gage['elev']:.2f} ft (USACE {gage['hhmm'][:2]}:{gage['hhmm'][2:]} CT)"
            tr["now"] = now
            tr["dek"] = f"{gage['elev']:.2f} ft · live USACE"
            obj["tableRock"] = tr
            ty = dict(obj.get("taneycomo") or {})
            tnow = dict(ty.get("now") or {})
            tnow["generation"] = (
                f"~{gage['cfs']:,} cfs at {gage['hhmm'][:2]}:{gage['hhmm'][2:]} CT (USACE live). "
                "Call SWPA 866-494-1993 before you wad."
            )
            ty["now"] = tnow
            obj["taneycomo"] = ty
        return obj

    tr_body, ty_body = usace_grafs(gage, pack) if gage else (
        ["Table Rock: verify level locally. USACE gage did not answer this morning."],
        ["Taneycomo: call SWPA 866-494-1993 before you wad. No live cfs on the desk."],
    )

    hed = "The Water Is Falling" if (lvl and float(lvl) < 914.8) else "Two Lakes, One Dam"
    if gage and gage["cfs"] < 200:
        hed = "The Dam Is Quiet. The Trout Will Eat."
    elif gage and gage["cfs"] > 5000:
        hed = "They're Blowing Water. Stay on the Bank."

    deck = "Hooked on Branson — the daily read. Live USACE numbers. Nothing invented."
    if gage:
        deck = (
            f"Table Rock {gage['elev']:.2f} ft. {gage['cfs']:,} cfs through the dam at "
            f"{gage['hhmm'][:2]}:{gage['hhmm'][2:]} CT. Taneycomo still eats a pink worm "
            "if the generators give you a window."
        )

    return {
        "date": day.isoformat(),
        "kicker": "Hooked on Branson",
        "brand": "The daily read",
        "hed": hed,
        "deck": deck,
        "play": pack["play"],
        "season": {"name": pack["name"], "why": pack["why"], "tips": pack["tips"]},
        "tomorrow": (
            "Tomorrow we print a new USACE level, a new play, and whether the dam spun overnight. "
            "Open it before you drive. The water will have moved."
        ),
        "weekGraf": week_graf(week, gage),
        "week": week,
        "tableRock": {
            "hed": "Table Rock Lake",
            "dek": f"{lvl} ft · live USACE" if lvl else "verify locally",
            "now": {
                "level": f"{gage['elev']:.2f} ft (USACE {gage['hhmm'][:2]}:{gage['hhmm'][2:]} CT)" if gage else "Verify locally",
                "temp": "Verify at the ramp — we do not invent dawn temps",
                "clarity": "Clear near the dam; arms can stain. Verify locally.",
            },
            "body": tr_body,
        },
        "taneycomo": {
            "hed": "Lake Taneycomo — The Trout Water",
            "dek": "Cold tailwater · generation is the whole game",
            "now": {
                "temp": "Tailwater cold (typically ~50–54°F). Verify at the bank.",
                "clarity": "Very clear",
                "generation": (
                    f"~{gage['cfs']:,} cfs at {gage['hhmm'][:2]}:{gage['hhmm'][2:]} CT (USACE live). "
                    "Call SWPA 866-494-1993 before you wad."
                    if gage
                    else "Call SWPA 866-494-1993 before you wad."
                ),
            },
            "working": [
                "Pink Power Worms",
                "Nightcrawlers",
                "Micro jigs",
                "Midges / scuds",
                "Eggs",
                "PowerBait",
            ],
            "body": ty_body,
        },
        "editor": {
            "stamp": "Hooked on Branson",
            "checked": day.isoformat(),
            "note": (
                "Always-on desk: live USACE Little Rock gage (tabrock.htm) plus seasonal playbook. "
                + ("Today's Mac scout was on file." if fresh else "No Mac scout this morning — lid-closed path.")
                + " Call 866-494-1993 before wading Taneycomo."
            ),
        },
    }


def main() -> int:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--date")
    args = ap.parse_args()
    day = dt.date.fromisoformat(args.date) if args.date else today()
    reports = repo_root() / "public" / "reports"
    reports.mkdir(parents=True, exist_ok=True)
    obj = build(day)
    mag = reports / "fishing-magazine.json"
    mag.write_text(json.dumps(obj, indent=2) + "\n")
    gage = fetch_usace()
    patch_fishing_data(reports, day, gage)
    # keep a copy of today's scout in-repo so next GHA run has week history
    body = load_scout(day)
    if body:
        dest = reports / "fishing-scouts"
        dest.mkdir(parents=True, exist_ok=True)
        (dest / f"{day.isoformat()}.md").write_text(body)
    print(
        json.dumps(
            {
                "ok": True,
                "date": day.isoformat(),
                "hed": obj.get("hed"),
                "usace": bool(gage),
                "elev": gage["elev"] if gage else None,
                "cfs": gage["cfs"] if gage else None,
                "bytes": mag.stat().st_size,
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
