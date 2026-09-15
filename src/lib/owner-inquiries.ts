import { get, list, put } from "@vercel/blob";
import { clientIp } from "@/lib/contracts-store";

export type InquirySource = "met" | "website";
export type InquiryStatus = "pending" | "approved" | "declined" | "signed";

export type OwnerInquiry = {
  id: string;
  submittedAt: string;
  source: InquirySource;
  name: string;
  email: string;
  phone: string;
  address: string;
  listingUrl: string;
  sleeps: string;
  beds: string;
  notes: string;
  photoPathnames: string[];
  status: InquiryStatus;
  inviteToken: string | null;
  declinedNote: string;
  ip: string;
};

export type ContractInvite = {
  token: string;
  inquiryId: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  usedAt: string | null;
  contractId: string | null;
};

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function readJson<T>(pathname: string): Promise<T | null> {
  const res = await get(pathname, { access: "private" });
  if (!res || res.statusCode !== 200) return null;
  const text = await new Response(res.stream).text();
  return JSON.parse(text) as T;
}

async function writeJson(pathname: string, data: unknown, overwrite = false): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: overwrite,
  });
}

export function newInquiryId(name: string): string {
  const t = new Date().toISOString().replace(/[:.]/g, "-");
  return `${t}-${slug(name) || "owner"}-${crypto.randomUUID().slice(0, 8)}`;
}

export function inquiryPath(id: string): string {
  return `inquiries/${id}.json`;
}

export function invitePath(token: string): string {
  return `invites/${token}.json`;
}

export function isPhotoPath(path: string): boolean {
  return /^inquiries\/photos\/[A-Za-z0-9._/-]+$/.test(path);
}

export async function saveInquiry(rec: OwnerInquiry, overwrite = false): Promise<void> {
  await writeJson(inquiryPath(rec.id), rec, overwrite);
}

export async function getInquiry(id: string): Promise<OwnerInquiry | null> {
  if (!/^[A-Za-z0-9._-]+$/.test(id)) return null;
  try {
    return await readJson<OwnerInquiry>(inquiryPath(id));
  } catch {
    return null;
  }
}

export async function listInquiries(): Promise<OwnerInquiry[]> {
  const out: OwnerInquiry[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "inquiries/", cursor, limit: 100 });
    for (const blob of page.blobs) {
      if (!blob.pathname.endsWith(".json") || blob.pathname.includes("/photos/")) continue;
      try {
        const rec = await readJson<OwnerInquiry>(blob.pathname);
        if (rec) out.push(rec);
      } catch {
        /* skip */
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  out.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return out;
}

export async function savePhoto(inquiryId: string, file: File, index: number): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const pathname = `inquiries/photos/${inquiryId}/${index}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await put(pathname, buf, {
    access: "private",
    contentType: file.type || "application/octet-stream",
    addRandomSuffix: false,
  });
  return pathname;
}

export async function readPrivateFile(pathname: string): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!isPhotoPath(pathname)) return null;
  const res = await get(pathname, { access: "private" });
  if (!res || res.statusCode !== 200) return null;
  const buf = Buffer.from(await new Response(res.stream).arrayBuffer());
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  return { body: buf, contentType };
}

export async function getInvite(token: string): Promise<ContractInvite | null> {
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(token)) return null;
  try {
    return await readJson<ContractInvite>(invitePath(token));
  } catch {
    return null;
  }
}

export async function saveInvite(inv: ContractInvite, overwrite = false): Promise<void> {
  await writeJson(invitePath(inv.token), inv, overwrite);
}

export function newInviteToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

export function inviteUrl(token: string): string {
  return `https://mybransonvacation.com/contracts?invite=${token}`;
}

export { clientIp };
