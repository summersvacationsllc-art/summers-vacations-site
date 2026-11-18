"""Checks that public guest feeds do not carry guest names or reservation ids.

Used by scripts/verify_public_guest_privacy.py and scripts/tests. Findings are
paths and field names only — values are never included.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

FORBIDDEN_KEYS = {
    "guest",
    "guest_name",
    "guestName",
    "reservation_id",
    "reservationId",
    "guesty_reservation_id",
    "confirmationCode",
    "confirmation_code",
}
RES_ID = re.compile(r"\bres_[a-z0-9]{4,}\b", re.I)
TABLE_RE = re.compile(r"<table\b[^>]*>.*?</table>", re.I | re.S)
ROW_RE = re.compile(r"<tr\b[^>]*>.*?</tr>", re.I | re.S)
CELL_RE = re.compile(r"<t([dh])\b[^>]*>(.*?)</t\1>", re.I | re.S)
BLANK_GUEST = {"", "—", "-", "–", "n/a"}


def forbidden_key_paths(value, path: str = "") -> list[str]:
    found: list[str] = []
    if isinstance(value, dict):
        for key, child in value.items():
            here = f"{path}.{key}" if path else str(key)
            if key in FORBIDDEN_KEYS:
                found.append(here)
            else:
                found.extend(forbidden_key_paths(child, here))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(forbidden_key_paths(child, f"{path}[{index}]"))
    elif isinstance(value, str) and RES_ID.search(value):
        found.append(f"{path or 'value'} has a reservation-id value")
    return found


def sync_status_issues(data: dict, path: str = "") -> list[str]:
    issues: list[str] = []
    prefix = f"{path}." if path else ""
    for index, item in enumerate(data.get("expectedInHouse") or []):
        if isinstance(item, str) and " @ " in item:
            issues.append(f"{prefix}expectedInHouse[{index}] still uses name @ property")
    units = data.get("kioskUnits") or {}
    if isinstance(units, dict):
        for unit, label in units.items():
            if isinstance(label, str) and re.match(r"^.+\([^()]+\)$", label):
                issues.append(f"{prefix}kioskUnits.{unit} still uses name (property)")
    for index, err in enumerate(data.get("errors") or []):
        if isinstance(err, str) and re.search(r"\(guest\s", err, re.I):
            issues.append(f"{prefix}errors[{index}] still includes a guest name")
    return issues


def nested_sync_issues(value, path: str = "") -> list[str]:
    issues: list[str] = []
    if isinstance(value, dict):
        if "expectedInHouse" in value or "kioskUnits" in value:
            issues.extend(sync_status_issues(value, path))
        for key, child in value.items():
            here = f"{path}.{key}" if path else str(key)
            issues.extend(nested_sync_issues(child, here))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            issues.extend(nested_sync_issues(child, f"{path}[{index}]"))
    return issues


def _cells(row: str) -> list[tuple[str, str]]:
    cells = []
    for match in CELL_RE.finditer(row):
        text = re.sub(r"<[^>]+>", "", match.group(2))
        text = re.sub(r"\s+", " ", text).strip()
        cells.append((match.group(1).lower(), text))
    return cells


def html_guest_column_issues(html: str) -> list[str]:
    issues: list[str] = []
    for table in TABLE_RE.findall(html):
        guest_index = None
        for row in ROW_RE.findall(table):
            cells = _cells(row)
            if any(kind == "h" for kind, _text in cells):
                headers = [text.lower() for kind, text in cells if kind == "h"]
                guest_index = headers.index("guest") if "guest" in headers else None
                continue
            if guest_index is None:
                continue
            values = [text for kind, text in cells if kind == "d"]
            if guest_index >= len(values):
                continue
            text = values[guest_index]
            if text not in BLANK_GUEST and re.search(r"[A-Za-z]", text):
                issues.append("guest column still contains a name")
                return issues
    return issues


def kiosk_issues(html: str) -> list[str]:
    issues: list[str] = []
    if "stay.guest" in html or "stayCache.guest" in html or "firstName(" in html:
        issues.append("kiosk still reads a guest name from the public feed")
    if "Welcome!" not in html:
        issues.append("kiosk occupied welcome no longer includes generic Welcome!")
    if "/api/guest-today" not in html:
        issues.append("kiosk no longer loads /api/guest-today")
    if 'searchParams.set("checkin"' not in html:
        issues.append("kiosk no longer passes the stay check-in date to the guidebook")
    return issues


def check_json_payload(label: str, data) -> list[str]:
    issues = [f"{label}: {item}" for item in forbidden_key_paths(data)]
    issues.extend(f"{label}: {item}" for item in nested_sync_issues(data))
    return issues


def check_public_tree(root: Path) -> list[str]:
    issues: list[str] = []
    public = root / "public"
    for path in sorted(public.rglob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            issues.append(f"{path.relative_to(root)}: unreadable json ({type(exc).__name__})")
            continue
        issues.extend(check_json_payload(str(path.relative_to(root)), data))
    for path in sorted(public.rglob("*.html")):
        text = path.read_text(encoding="utf-8", errors="replace")
        rel = str(path.relative_to(root))
        for item in html_guest_column_issues(text):
            issues.append(f"{rel}: {item}")
        if path.name == "kiosk.html":
            for item in kiosk_issues(text):
                issues.append(f"{rel}: {item}")
        if RES_ID.search(text):
            issues.append(f"{rel}: contains a reservation-id value")
    return issues
