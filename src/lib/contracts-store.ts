import { get, list, put } from "@vercel/blob";
import type { ContractFields } from "@/lib/cohosting-agreement";

export type StoredContract = {
  id: string;
  submittedAt: string;
  ip: string;
  userAgent: string;
  fields: ContractFields;
  agreement: string;
  emailVia: string | null;
  emailError: string | null;
};

export type ContractSummary = {
  id: string;
  submittedAt: string;
  subscriberName: string;
  coSubscriberName: string;
  email: string;
  phone: string;
  accommodationsAddress: string;
  startDate: string;
  signatureName: string;
  signatureDate: string;
};

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function newContractId(name: string): string {
  const t = new Date().toISOString().replace(/[:.]/g, "-");
  const rand = crypto.randomUUID().slice(0, 8);
  return `${t}-${slug(name) || "owner"}-${rand}`;
}

function pathnameFor(id: string): string {
  return `contracts/${id}.json`;
}

export async function saveContract(record: StoredContract, overwrite = false): Promise<void> {
  await put(pathnameFor(record.id), JSON.stringify(record), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: overwrite,
  });
}

async function readJson(pathname: string): Promise<StoredContract | null> {
  const res = await get(pathname, { access: "private" });
  if (!res || res.statusCode !== 200) return null;
  const text = await new Response(res.stream).text();
  return JSON.parse(text) as StoredContract;
}

export async function getContract(id: string): Promise<StoredContract | null> {
  if (!/^[A-Za-z0-9._-]+$/.test(id)) return null;
  try {
    return await readJson(pathnameFor(id));
  } catch {
    return null;
  }
}

export async function listContracts(): Promise<ContractSummary[]> {
  const out: ContractSummary[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "contracts/", cursor, limit: 100 });
    for (const blob of page.blobs) {
      if (!blob.pathname.endsWith(".json")) continue;
      try {
        const rec = await readJson(blob.pathname);
        if (!rec) continue;
        out.push({
          id: rec.id,
          submittedAt: rec.submittedAt,
          subscriberName: rec.fields.subscriberName,
          coSubscriberName: rec.fields.coSubscriberName,
          email: rec.fields.email,
          phone: rec.fields.phone,
          accommodationsAddress: rec.fields.accommodationsAddress,
          startDate: rec.fields.startDate,
          signatureName: rec.fields.signatureName,
          signatureDate: rec.fields.signatureDate,
        });
      } catch {
        /* skip a bad file */
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  out.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return out;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
}
