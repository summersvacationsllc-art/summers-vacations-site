export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("supersekret");
  if (t !== "yeppers") return new Response("nope");

  const GUESTY_BASE = "https://open-api.guesty.com";
  const clientId = process.env.GUESTY_CLIENT_ID || "";
  const clientSecret = process.env.GUESTY_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) return new Response("Missing creds");

  try {
    const res = await fetch(`${GUESTY_BASE}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) return new Response("Auth fail: " + res.status);
    const json = await res.json();
    const token = json.access_token;

    const res2 = await fetch(`${GUESTY_BASE}/v1/reservations?limit=15`, {
      headers: {
        Authorization: "Bearer " + token,
        accept: "application/json",
      }
    });

    if (!res2.ok) return new Response("API fail: " + res2.status);
    const data = await res2.json();
    let s = "Found past reservations: " + data.count + "\n";
    for (const r of data.results) {
        s += `- ${r.guest?.fullName} (${r.status}): ${r.checkIn} to ${r.checkOut}\n`;
    }
    return new Response(s);
  } catch (e) {
    return new Response("Err: " + String(e));
  }
}
