# Guest sync → kiosk pipeline

**Writers of `public/reports/guest-today.json` (all push to GitHub `main`):**
- Mac / Hermes cron "Branson Guest Daily Sync" (5:30 AM CT, LLM agent) → `~/.hermes/scripts/push_reports.sh` (commit, push, `npx vercel --prod` from the Mac checkout).
- GitHub Actions "Branson Guest Daily Sync" (`.github/workflows/guest-daily-sync.yml`, nominal 5:30 AM CT, GitHub often starts it hours late). Commits as "Summers Vacations Bot" with `GITHUB_TOKEN`, no deploy.
- GitHub Actions "Guest Sync Monitor" (`.github/workflows/guest-sync-monitor.yml`, 7:15 AM / 10:45 AM / 2:30 PM / 5:30 PM CDT) rebuilds guest-today.json from str-manager-one.

**Readers:** the kiosk (`public/kiosk.html`) and `/reports*` all call `/api/guest-today`.
That route (`src/lib/live-report-json.ts`) reads guest-today.json from GitHub `main`
at request time (raw.githubusercontent.com, ~5 min CDN cache) and falls back to the copy
bundled in the deployment, whichever is fresher. **No Vercel deploy is needed for guest data.**
The Vercel project is not Git-connected, so code/HTML changes still need `vercel --prod`.

**Verification / alerting:** `scripts/verify_guest_live.py` checks production
`/api/guest-today` equals the sync's JSON and that every in-house Guesty property maps to a
kiosk unit (kiosk alias matching). Both workflows run it and fail on any problem; GitHub
emails the account owning the workflow schedule (summersvacationsllc-art) on a failed run.
Results are committed to `public/reports/sync-status.json`; live health:
`https://www.mybransonvacation.com/api/sync-status` (`?strict=1` → HTTP 503 when not ok).
