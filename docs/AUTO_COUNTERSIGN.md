# Signed-copy emails + automatic countersignature

## What happens when a client signs
Every client-signable template (registry: `src/lib/contract-templates.ts`) goes through
`executeSignedContract()` in `src/lib/contract-execute.ts`, called from `POST /api/contracts`:

1. The signed record is saved (`contracts/<id>.json`, private Vercel Blob), same as before.
2. A PDF is built (`buildContractPdf`) with a final **signature page**: each signer's typed
   e-signature, date, timestamp/IP, and the Host block.
3. **Owner co-hosting agreement only** (`autoCountersign: true`) **and** `AUTO_COUNTERSIGN=true`
   **and** a signature image is configured: Brian's signature image is stamped in the Host block
   with "Brian Summers, Summers Vacations LLC — Authorized Person" and the date/time in CT.
   The record gets `execution.status = "countersigned"`. Otherwise the PDF says
   "Host countersignature: pending" and the reason is saved in `execution.countersignSkipped`.
4. The PDF is stored at `contracts/executed/<id>.pdf` (private Blob). The log's "Save PDF"
   returns this stored copy.
5. One email to the signer (PDF attached) and one email to Brian (PDF attached + all details +
   full agreement text). A one-time blob lock (`contracts/executed/<id>.signed-copy-email.lock`)
   prevents duplicate sends on retries or double submits.
6. The browser FormSubmit copies (sign, review request, contract-link) now fire **only** when the
   server email failed, so Brian gets one email per event instead of two.

Contract log (`/contracts/log`, PIN): each signed agreement shows countersign + email status and
has **Email PDF to owner** / **Email PDF to me** (re-sends the stored PDF; 60 s cooldown). Re-send
never adds Brian's signature to a record that was not already countersigned.

## Environment variables
| Var | Default | Meaning |
|---|---|---|
| `AUTO_COUNTERSIGN` | off | Exactly `true` turns on Brian's automatic countersignature (owner co-hosting template only). |
| `EMAIL_SIGNED_COPY` | on | `false` stops the signed-copy email to the signer (Brian still gets his). |
| `HOST_SIGNATURE_BLOB_PATH` | `private/host-signature.png` | Private-blob path of Brian's signature PNG. |
| `HOST_SIGNATURE_PNG_BASE64` | — | Alternative: the PNG as base64 in a Sensitive env var (checked first). |
| `HOST_SIGNATURE_PNG_PATH` | — | Local testing only (ignored on Vercel). |
| `LOCAL_BLOB_DIR` | — | Local testing only: store blobs as files (ignored on Vercel). |
| `MAIL_DRY_RUN_DIR` | — | Local testing only: write emails + attachments to disk instead of sending (ignored on Vercel). |

The signature image is never in the repo, `/public`, or the client bundle. It is read server-side only.

## Go live
1. Merge this branch and deploy production (`vercel deploy --prod` from the merged main).
   This alone turns on the signed-copy PDF emails for signers and the go-live tech-fee wording.
   Countersigning stays off.
2. To turn on automatic countersignature (needs Brian's OK — it replaces his
   per-document signature rule for this template):
   - Upload the signature PNG to the private blob store, e.g.
     `vercel blob put brian-signature.png --pathname private/host-signature.png --access private`
     (or set `HOST_SIGNATURE_PNG_BASE64`, Sensitive, Production only).
   - `vercel env add AUTO_COUNTERSIGN production` → `true`, then redeploy production.
3. Turn off: remove `AUTO_COUNTERSIGN` (or set anything but `true`) and redeploy.

## Local test
```
LOCAL_BLOB_DIR=/tmp/blob MAIL_DRY_RUN_DIR=/tmp/mail AUTO_COUNTERSIGN=true \
HOST_SIGNATURE_PNG_PATH=/path/to/test-signature.png CONTRACTS_LOG_PIN=1234 npx next start
```
Put an invite JSON at `/tmp/blob/invites/<token>.json`, POST the form to `/api/contracts`, and
read the PDF + email payloads in `/tmp/blob/contracts/executed/` and `/tmp/mail/`.
