import { get, list, put } from "@/lib/blob";
import type { ContractFields } from "@/lib/cohosting-agreement";

/** Post-signature state: executed PDF, countersignature, and the signed-copy emails. */
export type ContractExecution = {
  templateId: string;
  /** "signed" = client signed only; "countersigned" = Host signature applied too. */
  status: "signed" | "countersigned";
  countersignedAt: string | null;
  countersignedBy: string | null;
  countersignMethod: "auto" | null;
  /** Why the Host signature was not applied (flag off, template not eligible, no signature image). */
  countersignSkipped: string | null;
  pdfPathname: string | null;
  pdfSha256: string | null;
  pdfBuiltAt: string | null;
  signerEmailedTo: string[];
  signerEmailedAt: string | null;
  signerEmailVia: string | null;
  signerEmailError: string | null;
  brianEmailedAt: string | null;
  brianEmailVia: string | null;
  brianEmailError: string | null;
  resends: { at: string; to: string[]; via: string | null; error: string | null }[];
};

export type StoredContract = {
  id: string;
  /** Which signable template this is. Missing on older records = owner co-hosting agreement. */
  templateId?: string;
  execution?: ContractExecution | null;
  submittedAt: string;
  ip: string;
  userAgent: string;
  fields: ContractFields;
  agreement: string;
  emailVia: string | null;
  emailError: string | null;
  /** Link back to the owner review card (never delete that card on sign). */
  inquiryId?: string | null;
  inquirySnapshot?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    area?: string;
    listingUrl?: string;
    sleeps?: string;
    beds?: string;
    notes?: string;
    source?: string;
    photoCount?: number;
    submittedAt?: string;
  } | null;
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
  inquiryId?: string | null;
  executionStatus?: ContractExecution["status"] | null;
  countersignedAt?: string | null;
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
      if (!blob.pathname.endsWith(".json") || blob.pathname.startsWith("contracts/executed/")) continue;
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
          inquiryId: rec.inquiryId || null,
          executionStatus: rec.execution?.status || null,
          countersignedAt: rec.execution?.countersignedAt || null,
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

function executedPdfPathname(id: string): string {
  return `contracts/executed/${id}.pdf`;
}

/** Store the executed PDF next to the contract record (private blob). */
export async function saveExecutedPdf(id: string, pdf: Buffer): Promise<string> {
  const pathname = executedPdfPathname(id);
  await put(pathname, pdf, {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return pathname;
}

export async function readExecutedPdf(rec: StoredContract): Promise<Buffer | null> {
  const pathname = rec.execution?.pdfPathname;
  if (!pathname || pathname !== executedPdfPathname(rec.id)) return null;
  try {
    const res = await get(pathname, { access: "private" });
    if (!res || res.statusCode !== 200) return null;
    return Buffer.from(await new Response(res.stream).arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * One-time claim used to make the automatic signed-copy emails idempotent.
 * Returns true only for the first caller; later calls (retries, double submits) get false.
 */
export async function claimOnce(id: string, step: string): Promise<boolean> {
  const pathname = `contracts/executed/${id}.${step}.lock`;
  try {
    await put(pathname, new Date().toISOString(), {
      access: "private",
      contentType: "text/plain",
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    return true;
  } catch {
    // Already claimed → the lock exists. Any other failure (network) → proceed rather than drop the email.
    try {
      const res = await get(pathname, { access: "private" });
      return !(res && res.statusCode === 200);
    } catch {
      return true;
    }
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
}
