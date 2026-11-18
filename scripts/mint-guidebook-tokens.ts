/**
 * Mint guidebook link tokens for upcoming Rustic Ozark Retreat reservations.
 *
 * DISABLED by default. This file does not enable itself.
 *
 * Enable for Rustic only, in the shell that runs this command (preview credentials,
 * never production), and only after Brian approves writing to live Guesty:
 *
 *   GUIDEBOOK_TOKEN_MINT=rustic-ozark-retreat \
 *   GUIDEBOOK_TOKEN_FIELD_ID=<the Guesty custom field id> \
 *   npx tsx scripts/mint-guidebook-tokens.ts
 *
 * Also required, already used by the site: GUESTY_CLIENT_ID, GUESTY_CLIENT_SECRET,
 * and BLOB_READ_WRITE_TOKEN so the shared Guesty OAuth token is reused.
 *
 * GUIDEBOOK_TOKEN_MINT must be exactly rustic-ozark-retreat. "1", "true", or
 * another slug does not write. The job refuses every listing except Rustic.
 * It does not print tokens, codes, names, or phones.
 */
import { mintRusticGuidebookTokens } from "../src/lib/guidebook-test/token-job";

const result = await mintRusticGuidebookTokens();
console.log(JSON.stringify({
  enabled: result.enabled,
  scanned: result.scanned,
  minted: result.minted,
  skipped: result.skipped,
  blocked: result.blocked,
}));
