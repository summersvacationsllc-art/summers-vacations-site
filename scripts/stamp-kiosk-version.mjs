import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

let sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "";
if (!sha) {
  try {
    sha = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    sha = "dev";
  }
}

const payload = {
  v: String(sha).slice(0, 12),
  t: new Date().toISOString(),
};

writeFileSync(join(process.cwd(), "public", "kiosk-version.json"), JSON.stringify(payload) + "\n");
console.log("kiosk-version", payload.v);
