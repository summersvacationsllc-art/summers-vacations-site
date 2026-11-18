import { NextResponse } from "next/server";
import { mintKeyMatches, mintRouteAllowed } from "@/lib/guidebook-test/access";
import { verifyRusticGuidebookTokens } from "@/lib/guidebook-test/lookup";
import { mintPublicCounts, mintRusticGuidebookTokens } from "@/lib/guidebook-test/token-job";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };

function missing(): NextResponse {
  return new NextResponse(null, { status: 404, headers: NO_STORE });
}

/**
 * Mint or verify Rustic guidebook tokens.
 * 404 unless this is a Vercel preview or production deployment, the Rustic
 * flag is set, and x-mint-key matches GUIDEBOOK_MINT_KEY.
 * POST ?verify=1 only reads. The body is counts only.
 */
export async function POST(request: Request) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!mintRouteAllowed({
    vercelEnv: process.env.VERCEL_ENV,
    hostHeader: host,
    mintFlag: process.env.GUIDEBOOK_TOKEN_MINT,
  })) return missing();
  if (!mintKeyMatches(request.headers.get("x-mint-key"), process.env.GUIDEBOOK_MINT_KEY)) return missing();

  const verify = new URL(request.url).searchParams.get("verify") === "1";
  if (verify) {
    const counts = await verifyRusticGuidebookTokens();
    return NextResponse.json(
      { tokensFound: counts.tokensFound, resolved: counts.resolved, failed: counts.failed },
      { headers: NO_STORE },
    );
  }

  const result = await mintRusticGuidebookTokens();
  if (!result.enabled) return missing();
  return NextResponse.json(mintPublicCounts(result), { headers: NO_STORE });
}

export function GET() {
  return missing();
}
