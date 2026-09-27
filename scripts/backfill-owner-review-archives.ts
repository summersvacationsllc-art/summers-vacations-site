/**
 * One-shot: rewrite inquiry archives + link Scott's signed contract to his review card.
 * Run: npx tsx scripts/backfill-owner-review-archives.ts
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i);
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.production.local"));

async function main() {
  const { getContract, listContracts, saveContract } = await import("../src/lib/contracts-store");
  const { listInquiries, saveInquiry } = await import("../src/lib/owner-inquiries");

  const inquiries = await listInquiries();
  console.log("inquiries", inquiries.length);
  for (const inq of inquiries) {
    await saveInquiry(inq, true);
    console.log("archived", inq.id, inq.status, inq.name);
  }

  const contracts = await listContracts();
  console.log("contracts", contracts.length);
  for (const sum of contracts) {
    const rec = await getContract(sum.id);
    if (!rec) continue;
    if (rec.inquiryId && rec.inquirySnapshot) {
      console.log("already linked", rec.id);
      continue;
    }
    const match = inquiries.find(
      (i) =>
        i.email.toLowerCase() === rec.fields.email.toLowerCase() ||
        (i.name.toLowerCase() === rec.fields.subscriberName.toLowerCase() &&
          i.address.toLowerCase().includes(rec.fields.accommodationsAddress.toLowerCase().slice(0, 12))),
    );
    if (!match) {
      console.log("no inquiry match", rec.fields.subscriberName);
      continue;
    }
    rec.inquiryId = match.id;
    rec.inquirySnapshot = {
      name: match.name,
      email: match.email,
      phone: match.phone,
      address: match.address,
      area: match.area,
      listingUrl: match.listingUrl,
      sleeps: match.sleeps,
      beds: match.beds,
      notes: match.notes,
      source: match.source,
      photoCount: match.photoPathnames?.length || 0,
      submittedAt: match.submittedAt,
    };
    await saveContract(rec, true);
    match.status = "signed";
    match.contractId = rec.id;
    match.signedAt = match.signedAt || rec.submittedAt;
    await saveInquiry(match, true);
    console.log("linked", rec.id, "<-", match.id);
  }
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
