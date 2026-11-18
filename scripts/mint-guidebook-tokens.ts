/**
 * Minting does not run from this file.
 *
 * Guesty credentials live only in the Vercel Preview environment. After that
 * preview is deployed, with these Preview env vars set:
 *
 *   GUIDEBOOK_TOKEN_MINT=rustic-ozark-retreat
 *   GUIDEBOOK_TOKEN_FIELD_ID=<the Guesty custom field id>
 *   GUIDEBOOK_MINT_KEY=<a long random secret>
 *
 * and the existing GUESTY_CLIENT_ID, GUESTY_CLIENT_SECRET, and
 * BLOB_READ_WRITE_TOKEN available to Preview, call:
 *
 *   curl -X POST -H "x-mint-key: $GUIDEBOOK_MINT_KEY" \
 *     https://<preview-host>/api/guidebook-test/mint
 *
 * The route is Rustic only, writes just the Guidebook link token field, skips
 * reservations that already have a value, and returns counts. It 404s on the
 * live site and on any deployment that is not a Vercel preview.
 */
console.log(JSON.stringify({
  enabled: false,
  run: "POST /api/guidebook-test/mint on the preview deployment",
}));
