#!/usr/bin/env python3
"""Show that the public guest feed and status payload have no name or reservation-id fields.

Checks the committed files under public/. With --base, also checks the live
responses (JSON is parsed and only field paths are reported):

  /api/guest-today
  /api/sync-status
  /api/fleet-today
  /reports/guest-today.json
  /reports/sync-status.json
  /reports/fleet-today.json
  /kiosk.html

Exit 0 when every checked payload is clean. Values are never printed.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import public_guest_privacy as privacy  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
JSON_PATHS = (
    "/api/guest-today",
    "/api/sync-status",
    "/api/fleet-today",
    "/reports/guest-today.json",
    "/reports/sync-status.json",
    "/reports/fleet-today.json",
)
HTML_PATHS = ("/kiosk.html",)


def fetch(url: str) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": "summers-guest-privacy-check", "Cache-Control": "no-cache"})
    with urllib.request.urlopen(req, timeout=20) as response:
        return response.status, response.read().decode("utf-8", "replace")


def check_base(base: str) -> list[str]:
    issues: list[str] = []
    root = base.rstrip("/")
    for path in JSON_PATHS:
        url = root + path
        try:
            status, body = fetch(url)
        except Exception as exc:  # noqa: BLE001
            issues.append(f"{path}: request failed ({type(exc).__name__})")
            continue
        if status != 200:
            issues.append(f"{path}: HTTP {status}")
            continue
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            issues.append(f"{path}: response was not JSON")
            continue
        issues.extend(privacy.check_json_payload(path, data))
    for path in HTML_PATHS:
        url = root + path
        try:
            status, body = fetch(url)
        except Exception as exc:  # noqa: BLE001
            issues.append(f"{path}: request failed ({type(exc).__name__})")
            continue
        if status != 200:
            issues.append(f"{path}: HTTP {status}")
            continue
        for item in privacy.kiosk_issues(body):
            issues.append(f"{path}: {item}")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="", help="optional origin, e.g. http://127.0.0.1:3000")
    parser.add_argument("--root", default=str(ROOT))
    args = parser.parse_args()
    issues = privacy.check_public_tree(Path(args.root))
    if args.base:
        issues.extend(check_base(args.base))
    if issues:
        print(f"public guest privacy: {len(issues)} problem(s)")
        for item in issues:
            print(f"- {item}")
        return 1
    where = "files"
    if args.base:
        where = f"files and {args.base}"
    print(f"public guest privacy: clean ({where})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
