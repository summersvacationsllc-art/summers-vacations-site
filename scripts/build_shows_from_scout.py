#!/usr/bin/env python3
"""Build public/reports/shows-data.json from the Shows Scout markdown.

Why (2026-10-16): the guest show grid was carried forward unchanged from
2026-10-02 for two weeks while the daily scout listed different shows.
This script makes the scout file the only source of show names and times.

Rules
  - Source = branson-content-engine data/shows/YYYY-MM-DD.md (same lookup
    order as tonight_in_branson.find_scout).
  - Today's scout first. If missing, fall back to the newest scout that is at
    most --max-age-days old (default 2) and label it with its date.
  - If no scout is fresh enough, write an EMPTY, honest board
    (status "no_fresh_scout"). Never reuse the previous shows-data list.
  - A show without a confirmed clock time gets time "Check times"
    (sortMinutes null, bucket "anytime"). Times are never invented.
  - Dedupe by normalized name + time; sort by time, "Check times" last.
  - Prior shows-data.json is used ONLY to enrich parsed shows with venue
    coordinates/address/url/type. It never adds a show.

Output keeps the shape the site already consumes (/api/shows, Shows tab,
map pins, tonight_in_branson.py) and adds metadata fields the UI ignores:
scoutDate, scoutFile, status, source, listHash, note.

Usage
  python3 scripts/build_shows_from_scout.py --date YYYY-MM-DD [--dry-run]
  python3 scripts/build_shows_from_scout.py --scout path/to/file.md --dry-run
Exit codes: 0 ok (fresh or labeled fallback), 3 no fresh scout (board emptied).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

CT = ZoneInfo("America/Chicago")
SITE = Path(__file__).resolve().parents[1]
REPORTS = SITE / "public" / "reports"
MIN_SCOUT_BYTES = 400

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tonight_in_branson import enrich_shows, parse_minutes  # noqa: E402

DASH = r"\s*[–—-]\s*"
CLOCK = re.compile(r"^\s*(\d{1,2}(?::\d{2})?\s*[AaPp]\.?[Mm]\.?)")
HEDGE = re.compile(r"typically|usually|approx|around|tba|tbd|check|varies|evening|afternoon|morning|window", re.I)
VENUEISH = re.compile(r"theat|hall|center|centre|castle|jubilee|arena|playhouse|mansion|landing|resort|church|park|opry|palace|auditorium", re.I)
PAREN_HEDGE = re.compile(r"confirm|select|some |may |check|\bor\b|slot|varies|tba|tbd|active|dates", re.I)
# Recovery stubs / honest carry-forward shells (content engine's
# honest_scout_fallback.py, scout_exit_gate --allow-stub) re-label an older
# lineup under today's date. They are not a show list for today: skip them.
NOT_A_SCOUT = re.compile(
    r"HONEST CARRY-FORWARD BASELINE|Generator:\s*scripts/honest_scout_fallback\.py|"
    r"EXIT[-\s]?GATE STUB|honest recovery\. Sources incomplete", re.I)
STOP_HEADINGS = re.compile(r"^##\s+(insider|desk note|notes|tips|sources|free|outdoor|indoor)", re.I)


def today_ct() -> str:
    return datetime.now(CT).strftime("%Y-%m-%d")


# ---------- scout lookup ----------
def scout_dirs() -> list[Path]:
    dirs: list[Path] = []
    env = os.environ.get("SHOW_SCOUT_DIR") or os.environ.get("SHOWS_SCOUT_DIR")
    if env:
        dirs.append(Path(env))
    engine = os.environ.get("BRANSON_ENGINE")
    if engine:
        dirs.append(Path(engine) / "data" / "shows")
    dirs.append(SITE / "_food_scouts" / "data" / "shows")
    dirs.append(Path.home() / "projects" / "branson-content-engine" / "data" / "shows")
    dirs.append(REPORTS / "shows-scouts")
    return dirs


def find_scout(day: str, max_age_days: int) -> tuple[Path | None, str | None]:
    want = datetime.strptime(day, "%Y-%m-%d").date()
    for back in range(0, max_age_days + 1):
        d = (want - timedelta(days=back)).isoformat()
        for base in scout_dirs():
            p = base / f"{d}.md"
            if p.is_file() and p.stat().st_size >= MIN_SCOUT_BYTES:
                head = p.read_text(encoding="utf-8", errors="replace")[:3000]
                if NOT_A_SCOUT.search(head):
                    continue
                return p, d
    return None, None


# ---------- parsing ----------
def clean(s: str) -> str:
    s = re.sub(r"\*\*|__|`", "", s or "")
    return re.sub(r"\s+", " ", s).strip(" -–—:;,.")


def norm_time(raw: str) -> tuple[str, bool]:
    """Return (display_time, confirmed). Confirmed only for a bare clock time."""
    raw = (raw or "").strip()
    m = CLOCK.match(raw)
    if m and not HEDGE.search(raw[: m.start()]):
        t = m.group(1).upper().replace(".", "").replace(" ", "")
        t = re.sub(r"(AM|PM)$", r" \1", t)
        if ":" not in t:
            t = t.replace(" ", ":00 ")
        return t, True
    return "Check times", False


def split_venue_addr(text: str) -> tuple[str, str]:
    text = clean(text)
    m = re.match(r"^(.*?)\s*\(([^)]*\d[^)]*)\)\s*$", text)
    if m:
        return clean(m.group(1)), clean(m.group(2))
    return text, ""


def parse_price(text: str) -> str:
    m = re.search(r"\$\s?\d+(?:\s*[–—-]\s*\$?\s?\d+)?", text)
    return m.group(0).replace(" ", "") if m else ""


def parse_heading_line(line: str) -> list[dict]:
    """'**Name** – 7:30 PM (Venue)' ; may hold several joined by ' / **'."""
    parts = re.split(r"\s+/\s+(?=\*\*)", line.strip())
    out = []
    for part in parts:
        m = re.match(r"^\*\*([^*]{2,90}?)\*\*" + DASH + r"(.+)$", part.strip())
        if not m or m.group(1).strip().endswith(":"):
            continue
        name = clean(m.group(1))
        rest = m.group(2).strip()
        time_str, confirmed = norm_time(rest)
        venue = ""
        vm = re.search(r"\(([^()]*[A-Za-z][^()]*)\)\s*$", rest)
        if vm:
            inner = vm.group(1)
            if PAREN_HEDGE.search(inner):
                confirmed, time_str = False, "Check times"   # "8:00 PM (select dates; confirm)"
            elif VENUEISH.search(inner) and not re.search(r"\d{1,2}:\d{2}|typically", inner, re.I):
                venue = clean(inner)
        row = {"name": name, "time": time_str, "_confirmed": confirmed, "venue": venue}
        if not confirmed:
            row["timeNote"] = clean(rest)[:80]
        out.append(row)
    return out


def parse_scout(text: str) -> list[dict]:
    shows: list[dict] = []
    current_venue_hdr = ("", "")
    last: list[dict] = []
    in_shows = True
    for raw in text.splitlines():
        line = raw.rstrip()
        s = line.strip()
        if not s:
            continue
        if s.startswith("## "):
            in_shows = not STOP_HEADINGS.match(s)
            last = []
            current_venue_hdr = ("", "")
            continue
        if not in_shows:
            continue
        # Format B: '### Venue (address)' then '- **Name** — 2:00 PM (desc)'
        if s.startswith("### "):
            current_venue_hdr = split_venue_addr(s[4:])
            last = []
            continue
        mb = re.match(r"^[-*]\s+\*\*([^*]{2,90}?)\*\*" + DASH + r"(.+)$", s)
        if mb and current_venue_hdr[0] and not re.match(r"(?i)additional|other|recurring", current_venue_hdr[0]):
            name = clean(mb.group(1))
            rest = mb.group(2)
            time_str, confirmed = norm_time(rest)
            desc = ""
            dm = re.search(r"\(([^)]{15,})\)\s*\.?\s*$", rest)
            if dm and not re.search(r"\d{1,2}:\d{2}", dm.group(1)):
                desc = clean(dm.group(1))
            row = {"name": name, "time": time_str, "_confirmed": confirmed,
                   "venue": current_venue_hdr[0], "venueAddress": current_venue_hdr[1], "desc": desc}
            if not confirmed:
                row["timeNote"] = clean(rest)[:80]
            shows.append(row)
            last = []
            continue
        # Format A heading line
        if s.startswith("**") and re.search(r"\*\*" + DASH, s):
            rows = parse_heading_line(s)
            shows.extend(rows)
            last = rows
            continue
        # Format A detail bullets apply to the single show just above
        if last and len(last) == 1 and re.match(r"^[-*]\s+", s):
            b = clean(re.sub(r"^[-*]\s+", "", s))
            row = last[0]
            if b.lower().startswith("source"):
                row["sources"] = clean(b.split(":", 1)[-1])
            elif re.search(r"ticket|\$\d|seats|sold out|available", b, re.I):
                row.setdefault("price", parse_price(b))
                row.setdefault("ticketNote", b[:140])
            elif not row.get("venue") and re.search(r"theat|hall|arena|music|castle|jubilee|\(\d", b, re.I):
                row["venue"], row["venueAddress"] = split_venue_addr(b)
            elif not row.get("desc"):
                row["desc"] = b[:220]
            elif not row.get("venueAddress") and re.search(r"\(\d", b):
                pass
    return shows


# ---------- normalize / dedupe / enrich ----------
def name_key(name: str) -> str:
    n = name.lower().replace("’", "").replace("'", "")
    n = re.sub(r"[^a-z0-9 ]", " ", n)
    n = re.sub(r"\b(the|show|a|and|tribute)\b", " ", n)
    return re.sub(r"\s+", " ", n).strip()


def venue_key(v: str) -> str:
    v = (v or "").lower().replace("’", "").replace("'", "")
    v = re.sub(r"[^a-z0-9 ]", " ", v)
    v = re.sub(r"\b(the|theatre|theater|for|performing|arts)\b", " ", v)
    return re.sub(r"\s+", " ", v).strip()


def dedupe(rows: list[dict]) -> list[dict]:
    by_key: dict[tuple, dict] = {}
    for r in rows:
        k = (name_key(r["name"]), parse_minutes(r["time"]) if r["_confirmed"] else None)
        if k in by_key:
            old = by_key[k]
            for f in ("venue", "venueAddress", "desc", "price", "sources", "ticketNote"):
                if not old.get(f) and r.get(f):
                    old[f] = r[f]
        else:
            by_key[k] = r
    out = list(by_key.values())
    confirmed_names = {name_key(r["name"]) for r in out if r["_confirmed"]}
    return [r for r in out if r["_confirmed"] or name_key(r["name"]) not in confirmed_names]


def enrichment_index(prior: dict) -> tuple[dict, dict]:
    by_venue, by_name = {}, {}
    for s in (prior or {}).get("shows") or []:
        if s.get("venue"):
            by_venue.setdefault(venue_key(s["venue"]), s)
        if s.get("name"):
            by_name.setdefault(name_key(s["name"]), s)
    return by_venue, by_name


def enrich_from_prior(rows: list[dict], prior: dict) -> list[dict]:
    by_venue, by_name = enrichment_index(prior)
    for r in rows:
        v = by_venue.get(venue_key(r.get("venue", "")))
        if v:
            for f in ("lat", "lng"):
                if v.get(f) is not None:
                    r.setdefault(f, v[f])
            if v.get("venueAddress"):
                r.setdefault("venueAddress", v["venueAddress"])
            if v.get("url"):
                r.setdefault("url", v["url"])
        n = by_name.get(name_key(r["name"]))
        if n:
            for f in ("type", "url"):
                if n.get(f):
                    r.setdefault(f, n[f])
        if not r.get("venueAddress"):
            r.pop("venueAddress", None)
    return rows


def list_hash(rows: list[dict]) -> str:
    sig = json.dumps([(r["name"], r["time"]) for r in rows], ensure_ascii=False)
    return hashlib.sha1(sig.encode()).hexdigest()[:12]


def build(day: str, scout_override: Path | None, max_age: int, prior: dict) -> dict:
    if scout_override:
        scout, sdate = scout_override, re.search(r"\d{4}-\d{2}-\d{2}", scout_override.name).group(0)
    else:
        scout, sdate = find_scout(day, max_age)
    base = {"date": day, "freeEvents": [], "source": "scout",
            "generated_at": datetime.now(CT).isoformat(timespec="seconds")}
    if not scout:
        return {**base, "shows": [], "status": "no_fresh_scout", "scoutDate": None, "scoutFile": None,
                "listHash": list_hash([]), "last_verified": datetime.now(CT).isoformat(timespec="seconds"),
                "note": f"No shows scout from the last {max_age} days. Board left empty on purpose; check box offices."}
    rows = parse_scout(scout.read_text(encoding="utf-8", errors="replace"))
    rows = dedupe(rows)
    rows = enrich_from_prior(rows, prior)
    for r in rows:
        r.pop("_confirmed", None)
    enriched = enrich_shows(rows)
    shows = [{k: v for k, v in s.items() if not str(k).startswith("_")} for s in enriched]
    status = "fresh" if sdate == day else "fallback"
    note = None if status == "fresh" else f"Show list from the {sdate} scout (today's scout missing). Confirm times at the box office."
    return {**base, "shows": shows, "status": status, "scoutDate": sdate, "scoutFile": scout.name,
            "listHash": list_hash(shows), "last_verified": datetime.now(CT).isoformat(timespec="seconds"),
            **({"note": note} if note else {})}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=today_ct())
    ap.add_argument("--scout", type=Path, help="parse this file instead of looking one up")
    ap.add_argument("--max-age-days", type=int, default=2)
    ap.add_argument("--out", type=Path, default=REPORTS / "shows-data.json")
    ap.add_argument("--dry-run", action="store_true", help="print JSON, write nothing")
    a = ap.parse_args()
    prior = {}
    if a.out.is_file():
        try:
            prior = json.loads(a.out.read_text(encoding="utf-8"))
        except Exception:
            prior = {}
    data = build(a.date, a.scout, a.max_age_days, prior)
    if prior.get("magazineBuilt"):
        data["magazineBuilt"] = prior["magazineBuilt"]
    if a.dry_run:
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        a.out.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"build_shows_from_scout status={data['status']} scout={data.get('scoutFile')} "
          f"shows={len(data['shows'])} hash={data['listHash']}", file=sys.stderr)
    return 3 if data["status"] == "no_fresh_scout" else 0


if __name__ == "__main__":
    raise SystemExit(main())
