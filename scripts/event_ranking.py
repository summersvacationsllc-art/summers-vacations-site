#!/usr/bin/env python3
"""event_ranking.py — audience filter + ranking for Branson event tiles.

Brian's rule (2026-09-27): guest-facing event picks lead with
  TIER 1  = family-friendly  (kids' activities, family festivals/markets,
            free kid-friendly community events)
          + maker / hands-on   (craft fairs, artisan markets, quilting,
            woodworking, pottery, paint nights, craftsmen demos) — SAME tier,
            not below family. A paint night aimed at adults is still Tier 1.
  TIER 2  = general community / local happenings with no adult-only flag
  TIER 3  = (also civic/business items: aldermen meetings, chamber luncheons,
            ribbon cuttings) and adult-only nightlife, 21+ shows, bar/pub crawls, events with no
            family or maker angle that are adult-oriented  → EXCLUDED from
            guest outputs (kept only in a debug list).

Scouts should tag each event explicitly (preferred, see prompts/intel_scout.md):
    - **Audience:** family, maker            (any of: family, maker, general, adult-only)
    - **Free:** yes
If no tag is present we fall back to keyword heuristics below.

Stdlib only. Same file lives in:
  branson-content-engine/scripts/event_ranking.py
  summers-vacations-site/scripts/event_ranking.py
Keep them identical.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

FAMILY_KW = (
    "kid", "kids", "children", "child", "family", "families", "all ages",
    "petting zoo", "hayride", "hay ride", "corn maze", "pumpkin patch",
    "pumpkin painting", "pumpkin decorating", "face painting", "bounce",
    "inflatable", "trick-or-treat", "trick or treat", "trunk or treat",
    "costume contest", "storytime", "story time", "lego", "scavenger hunt",
    "playground", "fall festival", "harvest festival", "farmers market",
    "farmer's market", "farmers' market", "grape stomp", "s'mores", "smores",
    "movie night", "balloon artist", "candy", "boonanza", "pumpkinfest",
    "owl", "nature walk", "junior ranger", "carnival", "parade",
)
MAKER_KW = (
    "craft", "crafts", "crafter", "crafters", "craftsmen", "craftsman",
    "artisan", "artisans", "maker", "makers", "handmade", "hand-made",
    "handcrafted", "quilt", "quilting", "woodwork", "woodworking",
    "woodcarv", "whittl", "pottery", "potter", "ceramic", "glassblow",
    "blacksmith", "weaving", "spinning", "fiber art", "basket making",
    "paint night", "paint & sip", "paint and sip", "paint n sip",
    "painting class", "art class", "workshop", "demonstrat",
    "art show", "art fair", "art walk", "gallery", "plein air",
    "garden class", "master gardener", "book sale", "flea market",
    "antique", "vintage market",
)
ADULT_KW = (
    "21+", "21 and over", "21 & over", "adults only", "adult only",
    "adults-only", "18+", "bar crawl", "pub crawl", "wine crawl",
    "nightclub", "night club", "burlesque", "happy hour", "drag brunch",
    "beer fest", "beerfest", "brew fest", "bourbon tasting",
    "whiskey tasting", "late-night party", "after dark party", "strip club",
    "gentlemen's club", "casino night", "bachelorette", "sports bar",
    "at the bar", "live dj", "ladies night",
)
# Chamber/civic business items that show up on community calendars but are
# not guest events (Table Rock Lake Chamber calendar lists these daily).
NOT_GUEST_KW = (
    "board of aldermen", "commission meeting", "council meeting",
    "board meeting", "member luncheon", "member mingle", "ribbon cutting",
    "coffee and conversations", "legislative update", "blood drive",
    "golf scramble", "gala", "vendor application", "vendor registration",
    "closure", "court date", "suicide prevention training",
)
# Adult flags that a maker angle can override (paint & sip at a winery is fine).
SOFT_ADULT_KW = ("wine tasting", "winery", "brewery", "taproom", "cocktail")

TAG_AUDIENCE = re.compile(r"\*\*\s*audience\s*:?\s*\*\*\s*:?\s*(.+)", re.I)
TAG_FREE = re.compile(r"\*\*\s*free\s*:?\s*\*\*\s*:?\s*(.+)", re.I)
SKIP_HEADS = ("honest", "how to use", "sources", "prior verified", "notes",
              "generator", "search log", "dead sources", "summary")


@dataclass
class ScoredEvent:
    name: str
    body: str
    text: str
    tier: int
    score: int
    tags: set = field(default_factory=set)
    free: bool = False
    order: int = 0

    @property
    def tier_label(self) -> str:
        if self.tier == 3:
            return "not-guest" if "not-guest" in self.tags else "adult-only"
        return {1: "family/maker", 2: "general"}[self.tier]


_NOT_MAKER = re.compile(r"craft (beer|brew|brews|cocktail|cocktails|spirits|distill\w*)|craft-brew\w*")


def _has(text: str, kws) -> bool:
    """Word-start match so 'owl' doesn't hit 'bowl' and 'kid' doesn't hit 'skid'."""
    return any(re.search(r"(?<![a-z])" + re.escape(k), text) for k in kws)


def classify(text: str) -> tuple[int, set, bool]:
    """Return (tier, tags, free) for one event's full markdown text."""
    low = text.lower()
    tags: set = set()
    m = TAG_AUDIENCE.search(text)
    if m:
        raw = m.group(1).lower()
        for t in ("family", "maker", "general", "adult-only", "adult only", "21+"):
            if t in raw:
                tags.add("adult-only" if t in ("adult only", "21+") else t)
    else:
        if _has(low, FAMILY_KW):
            tags.add("family")
        if _has(_NOT_MAKER.sub(" ", low), MAKER_KW):
            tags.add("maker")
        if _has(low, ADULT_KW):
            tags.add("adult-only")
        elif _has(low, SOFT_ADULT_KW) and not tags:
            tags.add("adult-only")
    if _has(low, NOT_GUEST_KW) and "maker" not in tags and "family" not in tags:
        tags.add("not-guest")
    fm = TAG_FREE.search(text)
    free = bool(fm and fm.group(1).strip().lower().startswith(("yes", "free", "y")))
    if not fm:
        free = bool(re.search(r"\bfree (admission|entry|event|to attend)\b|admission (is )?free|fee:\s*free|\$0\b", low))

    if "maker" in tags:
        tier = 1            # maker beats adult flag (paint night is fine)
    elif "adult-only" in tags or "not-guest" in tags:
        tier = 3
    elif "family" in tags:
        tier = 1
    else:
        tier = 2
    return tier, tags, free


def _split_sections(md: str):
    for part in re.split(r"\n(?=###\s+)", "\n" + (md or "")):
        m = re.match(r"\s*###\s+(.+)", part)
        if m:
            yield m.group(1), part


def _clean(s: str) -> str:
    s = re.sub(r"[*_`>#]+", "", s or "")
    return re.sub(r"\s+", " ", s).strip()


def _short(s: str, n: int = 180) -> str:
    s = _clean(s)
    if len(s) <= n:
        return s
    cut = s[:n].rsplit(" ", 1)[0]
    return cut.rstrip(" ,;:") + "…"


def _body(part: str) -> str:
    """Prefer the host-tone prose line; else When + Where bullets."""
    when = where = angle = free = ""
    prose = ""
    for line in part.splitlines()[1:]:
        s = line.strip()
        if not s or s.startswith(("#", "---", ">")):
            continue
        low = s.lower()
        if s.startswith("-"):
            if "**when" in low:
                when = re.sub(r"(?i)^-\s*\*\*when:?\*\*:?", "", s)
            elif "**where" in low:
                where = re.sub(r"(?i)^-\s*\*\*where:?\*\*:?", "", s)
            elif "angle" in low and "**" in low:
                angle = re.sub(r"^-\s*\*\*[^*]+\*\*:?", "", s)
            elif "**free" in low and _clean(s).lower().split(":", 1)[-1].strip().startswith(("yes", "free")):
                free = "Free"
            continue
        if not prose:
            prose = s
    when_short = _clean(when).split("(")[0].strip(" ,;")
    if prose:
        lead = " · ".join(b for b in (when_short, free) if b)
        return _short(f"{lead} — {_clean(prose)}" if lead else prose, 220)
    bits = [b.strip() for b in (when_short, free, where, angle) if b.strip()]
    return _short(" · ".join(bits), 220) if bits else "Worth a look this week."


def score_events(md: str) -> list[ScoredEvent]:
    out = []
    for i, (head, part) in enumerate(_split_sections(md)):
        name = _clean(head)
        if len(name) < 4 or name.lower().startswith(SKIP_HEADS):
            continue
        tier, tags, free = classify(part)
        score = {1: 100, 2: 50, 3: 0}[tier]
        if tier == 1 and {"family", "maker"} <= tags:
            score += 10     # both audiences served
        if free and tier < 3:
            score += 8
        out.append(ScoredEvent(name, _body(part), part, tier, score, tags, free, i))
    out.sort(key=lambda e: (-e.score, e.order))
    return out


def ranked_event_tiles(md: str, limit: int = 4, include_adult: bool = False) -> list[tuple[str, str]]:
    """(name, body) pairs, Tier 1 first, adult-only removed unless include_adult."""
    evs = [e for e in score_events(md) if include_adult or e.tier < 3]
    return [(e.name, e.body) for e in evs[:limit]]


if __name__ == "__main__":  # quick CLI: python3 event_ranking.py data/intel/2026-09-27.md
    import sys
    md = open(sys.argv[1], encoding="utf-8").read() if len(sys.argv) > 1 else sys.stdin.read()
    for e in score_events(md):
        flag = "EXCLUDED" if e.tier == 3 else f"tier {e.tier}"
        print(f"{e.score:>4}  {flag:<9} {e.tier_label:<13} {'FREE ' if e.free else '     '}{e.name}  [{','.join(sorted(e.tags))}]")
