# Performance notes — 2026-07-24 fix sprint

These are the **stable wins** from today's rebuild. Recorded here so that a)
they survive a `~/.hermes/` wipe and b) future agents read them before
re-running the same slow paths.

## 1. Live Guesty feeds instead of static HTML

**Before** (the slow path):
- Build a 50–120 KB static HTML file from scratch → push to Vercel →
  wait 30–60s for redeploy → check manifest.

**After** (this PR):
- Two new API routes read pre-built JSON snapshots (4–6 KB each):
  - `/api/guest-today` ← `public/reports/guest-today.json`
  - `/api/fleet-today` ← `public/reports/fleet-today.json`
- Two new SSR pages (`/reports/guest`, `/reports/fleet`) render them.
- Snapshots are populated by `scripts/build_guest_today.py` and
  `scripts/build_fleet_today.py` from `str-manager-one` live endpoints,
  with a `Cache-Control: no-store` header so the data is always fresh.

**Result:** the user sees live Guesty state instantly and we never time out
shipping 50 KB HTML blobs.

## 2. Resident `.py` scripts instead of bash heredocs

`bash <<'PY' ... PY` is **unreliably approved** in this shell. Use instead:

```
python3 /Users/briansummers/projects/summers-vacations-site/scripts/build_guest_today.py --date 2026-07-24
python3 /Users/briansummers/projects/summers-vacations-site/scripts/build_fleet_today.py --date 2026-07-24
bash /Users/briansummers/projects/branson-content-engine/scripts/push_reports.sh
```

Each script is ≤ 80 lines, has `if __name__ == "__main__":` discipline, and
exits fast.

## 3. Cache `/tmp/*.json` aggressively across the run

One NWS `api.weather.gov` pull + one str-manager calendar/tasks fetch is
enough for the whole conversation. Re-using `/tmp/nws.json`,
`/tmp/cal.json`, `/tmp/tasks.json` beats re-calling HTTP in every turn.

## 4. Don't approve long HTML blobs through `write_file`

A 100 KB HTML body has hit the bash idle cutoff three times this session.
**Solution:** build the HTML in small Python scripts that write via
`Path.write_text()` — fast, retry-safe, never time out.

## 5. Cron responsibilities (NEXT — pending Brian approve)

- The Guest Daily Sync cron (`9a214fd36d38`, 5:30 AM CT) must run:
  1. `python3 scripts/build_fleet_today.py` (after str-manager 5:45 sync)
  2. `python3 scripts/build_guest_today.py`
  3. the existing writeout → `push_reports.sh`

- The Social Watchdog cron (`e6c449425b03`) should verify both
  `guest-today.json` and `fleet-today.json` exist before declaring
  READY/NOT, and re-run those scripts as part of its pri # 1 (model/404 heal)
  — same priority as preflight.

- The Morning Brief cron (`d13051a2f893`) should read `/api/fleet-today`
  and `/api/guest-today` and surface the cleaner-unassigned count
  directly in the brief — that's the new hard requirement (Brian 2026-07-24).

## File map

| Path | Purpose |
|---|---|
| `scripts/build_guest_today.py` | live Guesty → guest-today.json |
| `scripts/build_fleet_today.py` | live Guesty tasks → fleet-today.json |
| `scripts/build_today_reports.py` | first-cut HTML builder (kept for reference; live path uses SSR pages) |
| `src/app/api/guest-today/route.ts` | API: reads guest-today.json |
| `src/app/api/fleet-today/route.ts` | API: reads fleet-today.json |
| `src/app/reports/page.tsx` | live ops strip + "Open Guest / Fleet →" rows |
| `src/app/reports/guest/page.tsx` | SSR live guest page |
| `src/app/reports/fleet/page.tsx` | SSR live fleet page |
