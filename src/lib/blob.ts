/**
 * Thin wrapper over @vercel/blob.
 * On Vercel (and anywhere LOCAL_BLOB_DIR is unset) it is a pass-through.
 * For local testing only: set LOCAL_BLOB_DIR=/some/dir (ignored when VERCEL is set)
 * and private blobs are read/written as plain files under that folder.
 */
import * as vb from "@vercel/blob";
import { mkdir, readFile, readdir, stat, writeFile } from "fs/promises";
import path from "path";

type PutOpts = {
  access: "private" | "public";
  contentType?: string;
  addRandomSuffix?: boolean;
  allowOverwrite?: boolean;
};

function localDir(): string {
  if (process.env.VERCEL) return "";
  return (process.env.LOCAL_BLOB_DIR || "").trim();
}

function safeLocalPath(root: string, pathname: string): string {
  const full = path.resolve(/* turbopackIgnore: true */ root, pathname);
  if (!full.startsWith(path.resolve(/* turbopackIgnore: true */ root) + path.sep)) throw new Error("Bad blob path.");
  return full;
}

export async function put(pathname: string, body: string | Buffer | Uint8Array, opts: PutOpts) {
  const root = localDir();
  if (!root) {
    // @vercel/blob types only accept "public" in older typings; private stores accept "private".
    return vb.put(pathname, body as Buffer, opts as Parameters<typeof vb.put>[2]);
  }
  const full = safeLocalPath(root, pathname);
  await mkdir(path.dirname(full), { recursive: true });
  try {
    await writeFile(full, body, { flag: opts.allowOverwrite ? "w" : "wx" });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error("This blob already exists (allowOverwrite is false).");
    }
    throw e;
  }
  if (opts.contentType) await writeFile(`${full}.ctype`, opts.contentType);
  return { pathname, url: `file://${full}` };
}

export async function get(pathname: string, opts: { access: "private" | "public" }) {
  const root = localDir();
  if (!root) return vb.get(pathname, opts as Parameters<typeof vb.get>[1]);
  const full = safeLocalPath(root, pathname);
  let buf: Buffer;
  try {
    buf = await readFile(full);
  } catch {
    return null;
  }
  let ctype = "application/octet-stream";
  try {
    ctype = (await readFile(`${full}.ctype`, "utf8")).trim() || ctype;
  } catch {
    /* default */
  }
  return {
    statusCode: 200,
    stream: new Response(new Uint8Array(buf)).body as ReadableStream<Uint8Array>,
    headers: new Headers({ "content-type": ctype }),
  };
}

async function walk(dir: string): Promise<string[]> {
  let names: string[] = [];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const n of names) {
    const full = path.join(dir, n);
    const st = await stat(full);
    if (st.isDirectory()) out.push(...(await walk(full)));
    else if (!n.endsWith(".ctype")) out.push(full);
  }
  return out;
}

export async function list(opts: { prefix?: string; cursor?: string; limit?: number }) {
  const root = localDir();
  if (!root) return vb.list(opts);
  const prefix = opts.prefix || "";
  const base = path.resolve(/* turbopackIgnore: true */ root);
  const all = (await walk(base))
    .map((f) => path.relative(base, f).split(path.sep).join("/"))
    .filter((p) => p.startsWith(prefix));
  return { blobs: all.map((pathname) => ({ pathname })), hasMore: false, cursor: undefined as string | undefined };
}
