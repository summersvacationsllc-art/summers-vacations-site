#!/usr/bin/env python3
"""Merge Food Scout finds into dining-data.json and geocode map pins.

Called by Guest Daily Sync (Hermes + GitHub Actions) so new restaurants/bars
the Food Scout writes land on https://www.mybransonvacation.com/map.

Never fabricates places. A name is added only if it appears in today's (or
the latest) food scout markdown AND we can geocode it inside the Branson box.
Existing dining rows keep their coords unless lat/lng are missing.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
DINING = SITE / "public" / "reports" / "dining-data.json"
SHOWS = SITE / "public" / "reports" / "shows-data.json"
VENUES = SITE / "public" / "reports" / "map-venues.json"
FOOD_DIR = Path(
    os.environ.get("FOOD_SCOUT_DIR")
    or str(Path.home() / "projects" / "branson-content-engine" / "data" / "food")
)
GOLF_DIR = Path(
    os.environ.get("GOLF_SCOUT_DIR")
    or str(Path.home() / "projects" / "branson-content-engine" / "data" / "golf")
)
FISH_DIR = Path(
    os.environ.get("FISH_SCOUT_DIR")
    or str(Path.home() / "projects" / "branson-content-engine" / "data" / "fishing")
)
INTEL_DIR = Path(
    os.environ.get("INTEL_SCOUT_DIR")
    or str(Path.home() / "projects" / "branson-content-engine" / "data" / "intel")
)
STRIP_DIR = Path(
    os.environ.get("STRIP_SCOUT_DIR")
    or str(Path.home() / "projects" / "branson-content-engine" / "data" / "strip")
)
LANDING_DIR = Path(
    os.environ.get("LANDING_SCOUT_DIR")
    or str(Path.home() / "projects" / "branson-content-engine" / "data" / "landing")
)
GOLF = SITE / "public" / "reports" / "golf-data.json"
ATTRACTIONS = SITE / "public" / "reports" / "attractions-data.json"
FISHING_SPOTS = SITE / "public" / "reports" / "fishing-spots.json"
SHOWS_DIR = Path(
    os.environ.get("SHOWS_SCOUT_DIR")
    or str(Path.home() / "projects" / "branson-content-engine" / "data" / "shows")
)

# Reject geocodes that land outside greater Branson / Table Rock.
BBOX = (36.48, 36.76, -93.52, -93.10)  # south, north, west, east
UA = "SummersVacationsMapSync/1.0 (summersvacationsllc@gmail.com)"


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def in_box(lat: float, lng: float) -> bool:
    s, n, w, e = BBOX
    return s <= lat <= n and w <= lng <= e


def get_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=18) as r:
        return json.loads(r.read().decode())


def geocode(query: str) -> tuple[float, float, str] | None:
    q = query.strip()
    if not q:
        return None
    # Photon first (POI names), then Census (street addresses).
    try:
        url = "https://photon.komoot.io/api/?" + urllib.parse.urlencode(
            {"q": q + " Branson Missouri", "limit": 3, "lat": "36.64", "lon": "-93.28"}
        )
        data = get_json(url)
        for feat in data.get("features") or []:
            lon, lat = feat["geometry"]["coordinates"]
            lat, lon = float(lat), float(lon)
            if in_box(lat, lon):
                props = feat.get("properties") or {}
                venue = " ".join(
                    x
                    for x in (
                        props.get("street"),
                        props.get("city") or props.get("county"),
                    )
                    if x
                )
                return lat, lon, venue or "Branson"
    except Exception:
        pass
    try:
        url = (
            "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?"
            + urllib.parse.urlencode(
                {
                    "address": q + ", Branson, MO",
                    "benchmark": "Public_AR_Current",
                    "format": "json",
                }
            )
        )
        data = get_json(url)
        matches = (data.get("result") or {}).get("addressMatches") or []
        if matches:
            c = matches[0]["coordinates"]
            lat, lon = float(c["y"]), float(c["x"])
            if in_box(lat, lon):
                return lat, lon, matches[0].get("matchedAddress") or "Branson"
    except Exception:
        pass
    return None


HEADING_RE = re.compile(
    r"^#{2,3}\s+(.+?)(?:\s+[—–-]\s+|\s+\(|$)", re.M
)
TAG_RE = re.compile(r"^\*\*Tag:\*\*\s*(.+)$", re.M)
SOURCE_RE = re.compile(r"^\*\*Source:\*\*\s*(\S+)", re.M)
KNOWN_RE = re.compile(r"^\*\*Known for:\*\*\s*(.+)$", re.M)


def parse_food_md(text: str) -> list[dict]:
    """Pull restaurant blocks from a Food Scout markdown file."""
    found: list[dict] = []
    # Split on ### headings that look like a venue
    parts = re.split(r"\n(?=###\s+)", text)
    for part in parts:
        m = re.match(r"###\s+(.+)", part)
        if not m:
            continue
        raw = m.group(1).strip()
        # "Name (Place) — cuisine" or "Name — cuisine"
        name = re.split(r"\s+[—–-]\s+|\s+\(", raw)[0].strip()
        name = re.sub(r"\*\*", "", name).strip()
        if len(name) < 3 or name.lower().startswith(
            ("sunday", "notes", "popular", "this ", "verify", "output")
        ):
            continue
        tag_m = TAG_RE.search(part)
        src_m = SOURCE_RE.search(part)
        known_m = KNOWN_RE.search(part)
        loc_m = re.search(r"\(([^)]+)\)", raw)
        url = ""
        if src_m:
            url = src_m.group(1).split(",")[0].strip().rstrip(".,)")
            if not url.startswith("http"):
                url = ""
        found.append(
            {
                "name": name,
                "cuisine": raw[len(name) :].strip(" —–-()"),
                "tag": (tag_m.group(1).strip() if tag_m else "Scout find"),
                "desc": (known_m.group(1).strip() if known_m else ""),
                "url": url,
                "venue": loc_m.group(1).strip() if loc_m else "",
            }
        )
    return found


def load_dining() -> dict:
    if DINING.exists():
        return json.loads(DINING.read_text())
    return {"updated": "", "restaurants": []}


GOLF_SEEDS = {
    "branson-hills-golf-club": (36.66953, -93.22545, "203 Branson Hills Pkwy"),
    "payne-s-valley-big-cedar": (36.5308, -93.2684, "Big Cedar Lodge · Ridgedale"),
    "ozarks-national-big-cedar": (36.55946, -93.17929, "Ozarks National · Ridgedale"),
    "buffalo-ridge-springs": (36.5482, -93.2415, "Hwy 165 · Ridgedale"),
    "ledgestone-country-club": (36.69277, -93.32388, "Branson West"),
    "top-of-the-rock-big-cedar": (36.53735, -93.27632, "Top of the Rock"),
    "cliffhangers-at-big-cedar": (36.5364, -93.2778, "Top of the Rock"),
    "thousand-hills-golf-resort": (36.63449, -93.2643, "245 S Wildwood Dr"),
    "holiday-hills-golf-club": (36.63338, -93.1866, "630 E Rockford Dr"),
    "mountain-top-big-cedar": (36.5382, -93.2749, "Top of the Rock"),
}

FISH_SEEDS_COORDS = {
    "dewey-short-visitor-center": (36.59395, -93.31236, "Table Rock Dam"),
    "table-rock-dam-tailwater": (36.59597, -93.31105, "Lake Taneycomo"),
    "aunts-creek-recreation-area": (36.5912, -93.4015, "Aunts Creek · Table Rock"),
    "campbell-point-recreation-area": (36.6045, -93.355, "Campbell Point · Table Rock"),
}


def seed_coords(name: str) -> tuple[float, float, str] | None:
    key = slug(name)
    if key in GOLF_SEEDS:
        return GOLF_SEEDS[key]
    if key in FISH_SEEDS_COORDS:
        return FISH_SEEDS_COORDS[key]
    for k, v in {**GOLF_SEEDS, **FISH_SEEDS_COORDS}.items():
        if k in key or key in k:
            return v
    return None


def already(rows: list[dict], name: str) -> dict | None:
    key = slug(name)
    for r in rows:
        other = slug(r.get("name") or "")
        if not other:
            continue
        if other == key or other in key or key in other:
            return r
    return None


def fill_coords(rows: list[dict], kind: str) -> int:
    filled = 0
    for r in rows:
        seeded = seed_coords(r.get("name") or "")
        if seeded:
            lat, lng, venue = seeded
            r["lat"], r["lng"] = lat, lng
            r.setdefault("venue", venue)
            filled += 1
            print(f"{kind} seed: {r.get('name')} @ {lat:.5f},{lng:.5f}")
            continue
        if isinstance(r.get("lat"), (int, float)) and isinstance(r.get("lng"), (int, float)):
            continue
        hit = geocode(r.get("name") or "")
        if not hit:
            print(f"skip {kind} (no geo): {r.get('name')}")
            continue
        lat, lng, venue = hit
        r["lat"], r["lng"] = lat, lng
        r.setdefault("venue", venue)
        filled += 1
        print(f"{kind} coord: {r.get('name')} @ {lat:.5f},{lng:.5f}")
    return filled


def latest_md(folder: Path) -> Path | None:
    if not folder.is_dir():
        return None
    files = sorted(folder.glob("20*.md"))
    return files[-1] if files else None


SKIP_HEADINGS = (
    "notes",
    "popular",
    "this ",
    "verify",
    "output",
    "sunday",
    "sources",
    "weather",
    "highlights",
    "also checked",
    "other notable",
    "additional",
    "upcoming",
    "tournament",
    "championship",
    "junior golf",
    "events",
)


def parse_named_md(
    text: str,
    skip_prefixes: tuple[str, ...] = (),
    strip_prefixes: tuple[str, ...] = (),
) -> list[dict]:
    found: list[dict] = []
    parts = re.split(r"\n(?=###\s+)", text)
    for part in parts:
        m = re.match(r"###\s+(.+)", part)
        if not m:
            continue
        raw = re.sub(r"[*#]", "", m.group(1)).strip()
        for pref in strip_prefixes:
            if raw.lower().startswith(pref):
                raw = raw[len(pref) :].strip()
        name = re.split(r"\s+[—–-]\s+|\s+\(", raw)[0].strip()
        if len(name) < 4:
            continue
        low = name.lower()
        if low.startswith(SKIP_HEADINGS + skip_prefixes):
            continue
        src_m = SOURCE_RE.search(part)
        url = ""
        if src_m:
            url = src_m.group(1).split(",")[0].strip().rstrip(".,)")
            if not url.startswith("http"):
                url = ""
        loc_m = re.search(r"\(([^)]+)\)", raw)
        found.append(
            {
                "name": name,
                "tag": "Scout find",
                "desc": "",
                "url": url,
                "venue": loc_m.group(1).strip() if loc_m else "",
            }
        )
    return found


def sync_named_list(
    path: Path,
    key: str,
    scout_dir: Path | None,
    extra_dirs: tuple[Path, ...] = (),
    skip_prefixes: tuple[str, ...] = (),
    strip_prefixes: tuple[str, ...] = (),
    kind: str = "place",
) -> None:
    data = json.loads(path.read_text()) if path.exists() else {"updated": "", key: []}
    rows: list[dict] = list(data.get(key) or [])
    filled = fill_coords(rows, kind)
    added = 0
    dirs = []
    if scout_dir:
        dirs.append(scout_dir)
    dirs.extend(extra_dirs)
    for folder in dirs:
        latest = latest_md(folder)
        if not latest:
            continue
        for cand in parse_named_md(
            latest.read_text(errors="replace"),
            skip_prefixes=skip_prefixes,
            strip_prefixes=strip_prefixes,
        ):
            if already(rows, cand["name"]):
                continue
            hit = geocode(cand["name"])
            if not hit:
                print(f"skip {kind} find (no geo): {cand['name']}")
                continue
            lat, lng, venue = hit
            rows.append(
                {
                    "name": cand["name"],
                    "tag": cand.get("tag") or "Scout find",
                    "desc": cand.get("desc") or f"New find from scout ({latest.stem}).",
                    "url": cand.get("url") or "",
                    "venue": cand.get("venue") or venue,
                    "lat": lat,
                    "lng": lng,
                    "source": f"scout:{latest.stem}",
                }
            )
            added += 1
            print(f"added {kind}: {cand['name']} @ {lat:.5f},{lng:.5f}")
    if added or filled:
        data[key] = rows
        data["updated"] = date.today().isoformat()
        path.write_text(json.dumps(data, indent=2) + "\n")
        print(f"wrote {path.name} added={added} filled={filled} total={len(rows)}")
    else:
        print(f"no {kind} map changes (existing={len(rows)})")


FISH_SEEDS = [
    {
        "name": "Dewey Short Visitor Center",
        "tag": "Dam overlook",
        "desc": "Table Rock Dam visitor center — tailwater trout just below, lake above.",
        "url": "https://www.swl.usace.army.mil/",
        "venue": "Table Rock Dam",
    },
    {
        "name": "Table Rock Dam tailwater",
        "tag": "Trout",
        "desc": "Taneycomo trout water immediately below Table Rock Dam.",
        "url": "https://mdc.mo.gov/",
        "venue": "Lake Taneycomo",
    },
    {
        "name": "Aunts Creek Recreation Area",
        "tag": "Ramp",
        "desc": "USACE ramp and park on Table Rock — bass and crappie access.",
        "url": "https://www.swl.usace.army.mil/",
        "venue": "Table Rock Lake",
    },
    {
        "name": "Campbell Point Recreation Area",
        "tag": "Ramp",
        "desc": "USACE campground and boat ramp on Table Rock.",
        "url": "https://www.swl.usace.army.mil/",
        "venue": "Table Rock Lake",
    },
]


def looks_like_fish_place(name: str) -> bool:
    low = name.lower()
    keys = (
        "marina",
        "ramp",
        "landing",
        "creek",
        "dam",
        "visitor",
        "point",
        "park",
        "lake",
        "access",
        "dock",
        "harbor",
        "cove",
    )
    return any(k in low for k in keys)


def sync_fishing_spots() -> None:
    data = json.loads(FISHING_SPOTS.read_text()) if FISHING_SPOTS.exists() else {"updated": "", "spots": []}
    spots: list[dict] = list(data.get("spots") or [])
    for seed in FISH_SEEDS:
        if not already(spots, seed["name"]):
            spots.append(dict(seed))
    filled = fill_coords(spots, "fish")
    added = 0
    latest = latest_md(FISH_DIR)
    if latest:
        for cand in parse_named_md(latest.read_text(errors="replace")):
            if not looks_like_fish_place(cand["name"]):
                continue
            if already(spots, cand["name"]):
                continue
            hit = geocode(cand["name"])
            if not hit:
                print(f"skip fish find (no geo): {cand['name']}")
                continue
            lat, lng, venue = hit
            spots.append(
                {
                    "name": cand["name"],
                    "tag": "Scout find",
                    "desc": f"Named in fishing scout ({latest.stem}).",
                    "url": cand.get("url") or "",
                    "venue": cand.get("venue") or venue,
                    "lat": lat,
                    "lng": lng,
                    "source": f"fishing-scout:{latest.stem}",
                }
            )
            added += 1
            print(f"added fish: {cand['name']} @ {lat:.5f},{lng:.5f}")
    if added or filled or spots:
        data["spots"] = spots
        data["updated"] = date.today().isoformat()
        FISHING_SPOTS.write_text(json.dumps(data, indent=2) + "\n")
        print(f"wrote fishing-spots.json added={added} filled={filled} total={len(spots)}")


def latest_food_file() -> Path | None:
    if not FOOD_DIR.is_dir():
        return None
    files = sorted(FOOD_DIR.glob("20*.md"))
    return files[-1] if files else None


def main() -> int:
    data = load_dining()
    restaurants: list[dict] = list(data.get("restaurants") or [])
    added = 0
    filled = 0

    # Fill missing coords on existing app list
    for r in restaurants:
        if isinstance(r.get("lat"), (int, float)) and isinstance(r.get("lng"), (int, float)):
            continue
        hit = geocode(r.get("name") or "")
        if not hit:
            continue
        lat, lng, venue = hit
        r["lat"], r["lng"] = lat, lng
        r.setdefault("venue", venue)
        filled += 1

    food = latest_food_file()
    if food:
        for cand in parse_food_md(food.read_text(errors="replace")):
            if already(restaurants, cand["name"]):
                continue
            hit = geocode(cand["name"])
            if not hit:
                print(f"skip (no geo): {cand['name']}")
                continue
            lat, lng, venue = hit
            restaurants.append(
                {
                    "name": cand["name"],
                    "cuisine": cand.get("cuisine") or "Dining",
                    "price": "",
                    "tag": cand.get("tag") or "Scout find",
                    "desc": cand.get("desc") or f"New find from Food Scout ({food.stem}).",
                    "url": cand.get("url") or "",
                    "venue": cand.get("venue") or venue,
                    "lat": lat,
                    "lng": lng,
                    "source": f"food-scout:{food.stem}",
                }
            )
            added += 1
            print(f"added: {cand['name']} @ {lat:.5f},{lng:.5f}")

    if added or filled:
        data["restaurants"] = restaurants
        data["updated"] = date.today().isoformat()
        DINING.write_text(json.dumps(data, indent=2) + "\n")
        print(f"wrote {DINING} added={added} filled={filled} total={len(restaurants)}")
    else:
        print(
            f"no dining map changes (food={'missing' if not food else food.name} "
            f"existing={len(restaurants)})"
        )

    sync_show_venues()
    sync_named_list(
        GOLF,
        "courses",
        GOLF_DIR,
        skip_prefixes=(
            "other notable",
            "additional",
            "also checked",
            "upcoming",
            "tournament",
            "championship",
            "junior",
            "events",
            "other events",
            "other tournaments",
        ),
        strip_prefixes=("course spotlight:",),
        kind="golf",
    )
    sync_named_list(
        ATTRACTIONS,
        "attractions",
        None,
        extra_dirs=(INTEL_DIR, STRIP_DIR, LANDING_DIR),
        skip_prefixes=(
            "notes",
            "weather",
            "this ",
            "verify",
            "sources",
            "output",
            "highlights",
            "events",
            "also",
            "sunday",
            "monday",
            "today",
            "intel",
            "strip",
            "landing",
        ),
        kind="attraction",
    )
    sync_fishing_spots()
    return 0


VENUE_SEEDS = {
    "clay cooper theatre": (36.63733, -93.27964, "3216 W 76 Country Blvd"),
    "clay cooper theater": (36.63733, -93.27964, "3216 W 76 Country Blvd"),
    "king s castle theatre": (36.64044, -93.26808, "2701 W 76 Country Blvd"),
    "kings castle theatre": (36.64044, -93.26808, "2701 W 76 Country Blvd"),
    "shepherd of the hills": (36.667, -93.30589, "5586 W 76 Country Blvd"),
    "pepsi legends theater": (36.64151, -93.24753, "1600 W 76 Country Blvd"),
    "legends in concert": (36.64151, -93.24753, "1600 W 76 Country Blvd"),
    "presleys country jubilee": (36.64035, -93.24015, "1209 W 76 Country Blvd"),
    "presley s country jubilee": (36.64035, -93.24015, "1209 W 76 Country Blvd"),
    "hamners theater": (36.65395, -93.27957, "3090 Shepherd of the Hills Expwy"),
    "hamners theatre": (36.65395, -93.27957, "3090 Shepherd of the Hills Expwy"),
    "hamners magic": (36.65395, -93.27957, "3090 Shepherd of the Hills Expwy"),
    "moon river theatre": (36.6401, -93.2658, "2500 W 76 Country Blvd"),
    "dutton family theater": (36.64244, -93.28687, "3454 W 76 Country Blvd"),
    "sight sound": (36.6654, -93.26219, "1001 Shepherd of the Hills Expwy"),
    "hughes brothers theatre": (36.64046, -93.28431, "3425 W 76 Country Blvd"),
    "baldknobbers": (36.63854, -93.27153, "2835 W 76 Country Blvd"),
    "grand shanghai theatre": (36.64161, -93.28505, "3455 W 76 Country Blvd"),
    "grand shanghai theater": (36.64161, -93.28505, "3455 W 76 Country Blvd"),
    "reza live theatre": (36.63218, -93.28011, "645 State Hwy 165"),
    "reza live theater": (36.63218, -93.28011, "645 State Hwy 165"),
}


def venue_key(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (name or "").lower()).strip()


def load_venues() -> dict:
    if VENUES.exists():
        try:
            return json.loads(VENUES.read_text())
        except Exception:
            pass
    return {"updated": "", "venues": {}}


def lookup_venue(cache: dict, name: str) -> dict | None:
    key = venue_key(name)
    venues = cache.get("venues") or {}
    if key in venues:
        return venues[key]
    for k, v in VENUE_SEEDS.items():
        if k in key or key in k:
            lat, lng, addr = v
            return {"lat": lat, "lng": lng, "address": addr}
    for k, v in venues.items():
        if k and (k in key or key in k):
            return v
    return None


def sync_show_venues() -> None:
    if not SHOWS.exists():
        print("no shows-data.json — skip show venue sync")
        return
    shows_data = json.loads(SHOWS.read_text())
    shows = list(shows_data.get("shows") or [])
    cache = load_venues()
    venues = dict(cache.get("venues") or {})
    stamped = 0
    new_geo = 0
    for show in shows:
        venue = (show.get("venue") or "").strip()
        if not venue or venue.lower() in ("various / dinner venue", "theater venue", "tba"):
            continue
        hit = lookup_venue({"venues": venues}, venue)
        if not hit:
            geo = geocode(venue + " Theatre")
            if not geo:
                geo = geocode(venue)
            if not geo:
                print(f"skip show venue (no geo): {venue}")
                continue
            lat, lng, addr = geo
            hit = {"lat": lat, "lng": lng, "address": addr}
            venues[venue_key(venue)] = hit
            new_geo += 1
            print(f"show venue: {venue} @ {lat:.5f},{lng:.5f}")
        show["lat"] = hit["lat"]
        show["lng"] = hit["lng"]
        if hit.get("address"):
            show.setdefault("venueAddress", hit["address"])
        stamped += 1
    cache["venues"] = venues
    cache["updated"] = date.today().isoformat()
    VENUES.write_text(json.dumps(cache, indent=2) + "\n")
    SHOWS.write_text(json.dumps(shows_data, indent=2) + "\n")
    print(f"show venues stamped={stamped} newly-geocoded={new_geo} cache={len(venues)}")


if __name__ == "__main__":
    sys.exit(main())
