// Server-only module: import only from API routes / server code.
import { get } from "@/lib/blob";

/**
 * Brian's signature image for automatic countersignature. Server-side only:
 * never imported by client components and never served from /public.
 *
 * Lookup order:
 * 1. HOST_SIGNATURE_PNG_BASE64 (Vercel env var, marked Sensitive)
 * 2. Private Vercel Blob at HOST_SIGNATURE_BLOB_PATH (default "private/host-signature.png")
 * 3. HOST_SIGNATURE_PNG_PATH (local file; local testing only, ignored on Vercel)
 */
export async function loadHostSignaturePng(): Promise<Buffer | null> {
  const b64 = (process.env.HOST_SIGNATURE_PNG_BASE64 || "").trim();
  if (b64) {
    const buf = Buffer.from(b64.replace(/^data:image\/png;base64,/, ""), "base64");
    if (isPng(buf)) return buf;
  }

  const blobPath = (process.env.HOST_SIGNATURE_BLOB_PATH || "private/host-signature.png").trim();
  try {
    const res = await get(blobPath, { access: "private" });
    if (res && res.statusCode === 200) {
      const buf = Buffer.from(await new Response(res.stream).arrayBuffer());
      if (isPng(buf)) return buf;
    }
  } catch {
    /* not configured */
  }

  const localPath = (process.env.HOST_SIGNATURE_PNG_PATH || "").trim();
  if (localPath && !process.env.VERCEL) {
    try {
      const { readFile } = await import("fs/promises");
      const buf = await readFile(localPath);
      if (isPng(buf)) return buf;
    } catch {
      /* missing */
    }
  }
  return null;
}

function isPng(buf: Buffer): boolean {
  return buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}
