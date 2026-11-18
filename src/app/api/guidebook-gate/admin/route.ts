import { NextResponse } from "next/server";
import { isGateAdmin } from "@/lib/gate-admin-auth";
import { listSubmissions, toCsv, gateEnv } from "@/lib/guidebook-gate-store";

export const dynamic = "force-dynamic";
const H = { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(req: Request) {
  if (!isGateAdmin(req)) return NextResponse.json({ ok: false, error: "PIN required." }, { status: 401, headers: H });
  try {
    const rows = await listSubmissions();
    const u = new URL(req.url);
    if (u.searchParams.get("format") === "csv") {
      const only = u.searchParams.get("only") === "review" ? rows.filter((r) => r.review) : rows;
      return new Response(toCsv(only), {
        headers: { ...H, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="guidebook-signups-${gateEnv()}.csv"` },
      });
    }
    return NextResponse.json({ ok: true, env: gateEnv(), rows }, { headers: H });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load submissions." }, { status: 500, headers: H });
  }
}
