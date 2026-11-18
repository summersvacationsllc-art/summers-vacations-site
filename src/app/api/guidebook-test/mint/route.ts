import { NextResponse } from "next/server";
import { mintKeyMatches, mintRouteAllowed } from "@/lib/guidebook-test/access";
import { mintPublicCounts, mintRusticGuidebookTokens } from "@/lib/guidebook-test/token-job";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };

function missing(): NextResponse {
  return new NextResponse(null, { status: 404, headers: NO_STORE });
}

/**
 * Preview-only mint for Rustic guidebook tokens.
 * 404 unless the deployment is a Vercel preview, the Rustic flag is set,
 * the mint key matches, and the host is not the live site.
 * The body is counts only.
 */
export async function POST(request: Request) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!mintRouteAllowed({
    vercelEnv: process.env.VERCEL_ENV,
    hostHeader: host,
    mintFlag: process.env.GUIDEBOOK_TOKEN_MINT,
  })) return missing();
  if (!mintKeyMatches(request.headers.get("x-mint-key"), process.env.GUIDEBOOK_MINT_KEY)) return missing();

  const result = await mintRusticGuidebookTokens();
  if (!result.enabled) return missing();
  return NextResponse.json(mintPublicCounts(result), { headers: NO_STORE });
}

export function GET() {
  return missing();
}
