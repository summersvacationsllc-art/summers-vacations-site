#!/usr/bin/env python3
"""Send co-hosting desk mail via Mail.app on this Mac.

Vercel cannot reach FormSubmit or Resend on this project. This pump logs into
the owner desk and emails Brian (new reviews) and the owner (approved contract
links). Dedupes in ~/.hermes/cohost-mail-sent.json. Never prints the PIN.
"""
from __future__ import annotations

import json
import ssl
import subprocess
import urllib.error
import urllib.request
from http.cookiejar import CookieJar
from pathlib import Path

HOME = Path.home()
PIN_FILE = HOME / "projects/summers-vacations-site/.contracts-log-pin"
SENT_FILE = HOME / ".hermes/cohost-mail-sent.json"
BASE = "https://mybransonvacation.com"
BRIAN = "summersvacationsllc@gmail.com"
SENDER = "summersvacationsllc@gmail.com"


def load_pin() -> str:
    if not PIN_FILE.exists():
        raise SystemExit("pin file missing")
    pin = PIN_FILE.read_text(encoding="utf-8").strip()
    if not pin:
        raise SystemExit("pin empty")
    return pin


def load_sent() -> set[str]:
    if not SENT_FILE.exists():
        return set()
    try:
        data = json.loads(SENT_FILE.read_text(encoding="utf-8"))
        return set(data if isinstance(data, list) else data.get("ids", []))
    except Exception:
        return set()


def save_sent(ids: set[str]) -> None:
    SENT_FILE.parent.mkdir(parents=True, exist_ok=True)
    SENT_FILE.write_text(json.dumps(sorted(ids)), encoding="utf-8")


def apple_mail(to: str, subject: str, body: str) -> None:
    def q(s: str) -> str:
        return (
            s.replace("\\", "\\\\")
            .replace('"', '\\"')
            .replace("\n", '" & return & "')
        )

    script = f'''
tell application "Mail"
  set msg to make new outgoing message with properties {{subject:"{q(subject)}", visible:false, sender:"{q(SENDER)}"}}
  tell msg
    make new to recipient at end of to recipients with properties {{address:"{q(to)}"}}
    set content to "{q(body)}"
  end tell
  send msg
end tell
'''
    r = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "mail failed").strip()[:200])


def desk() -> dict:
    pin = load_pin()
    jar = CookieJar()
    ctx = ssl.create_default_context()
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(jar),
        urllib.request.HTTPSHandler(context=ctx),
    )
    req = urllib.request.Request(
        BASE + "/api/contracts/log/login",
        data=json.dumps({"pin": pin}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with opener.open(req, timeout=30) as resp:
        login = json.loads(resp.read().decode())
    if not login.get("ok"):
        raise SystemExit("desk login failed")
    req = urllib.request.Request(BASE + "/api/contracts/log", method="GET")
    with opener.open(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    if not data.get("ok"):
        raise SystemExit("desk load failed")
    return data


def main() -> None:
    sent = load_sent()
    data = desk()
    out: list[str] = []
    for it in data.get("inquiries") or []:
        iid = str(it.get("id") or "")
        if not iid:
            continue
        name = (it.get("name") or "Owner").strip()
        email = (it.get("email") or "").strip()
        address = (it.get("address") or "").strip()
        status = it.get("status") or ""
        token = it.get("inviteToken") or ""
        pending_key = f"pending:{iid}"
        invite_key = f"invite:{iid}"
        if status == "pending" and pending_key not in sent:
            apple_mail(
                BRIAN,
                f"Property review request: {name} — {address}",
                "\n".join(
                    [
                        "An owner asked you to review a property before any contract.",
                        "",
                        "Open: https://mybransonvacation.com/contracts/log",
                        f"Name: {name}",
                        f"Email: {email}",
                        f"Phone: {it.get('phone') or '(none)'}",
                        f"Address: {address}",
                        f"Area: {it.get('area') or '(blank)'}",
                        f"Listing: {it.get('listingUrl') or '(none)'}",
                        "",
                        (it.get("notes") or "").strip() or "(no notes)",
                    ]
                ),
            )
            sent.add(pending_key)
            out.append(f"emailed Brian review {name}")
        if status in ("approved", "signed") and token and invite_key not in sent and email:
            url = f"https://mybransonvacation.com/contracts?invite={token}"
            apple_mail(
                email,
                f"Your Summers Vacations co-hosting agreement — {address}",
                "\n".join(
                    [
                        f"Hi {name},",
                        "",
                        f"Brian reviewed {address} and is sending you the Summers Vacations co-hosting agreement.",
                        "",
                        "Open this private link. It is one-time — do not forward it:",
                        url,
                        "",
                        "Fill any blanks, read the terms, then type your name to sign. Print a copy for your records. Brian countersigns after he receives it.",
                        "",
                        "Questions: call or text 314-565-0589, or reply to this email.",
                        "",
                        "Brian Summers",
                        "Summers Vacations",
                    ]
                ),
            )
            apple_mail(
                BRIAN,
                f"Contract link emailed: {name} — {address}",
                f"The private agreement link was emailed to {email}.\n\n{url}",
            )
            sent.add(invite_key)
            out.append(f"emailed owner contract {name}")
    save_sent(sent)
    if out:
        print("\n".join(out))


if __name__ == "__main__":
    main()
