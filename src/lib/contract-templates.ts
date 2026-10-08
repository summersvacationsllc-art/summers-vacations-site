/**
 * Every client-signable contract template on the site.
 * - All templates: after the client signs, the signed PDF is emailed to the signer(s) and to Brian.
 * - autoCountersign: only templates listed here with `autoCountersign: true` may receive Brian's
 *   automatic countersignature, and only while AUTO_COUNTERSIGN=true is set on the server.
 */
export type ContractTemplate = {
  id: string;
  title: string;
  /** Public signing page. */
  signPath: string;
  autoCountersign: boolean;
};

export const OWNER_COHOSTING_TEMPLATE_ID = "owner-cohosting";

export const CONTRACT_TEMPLATES: Record<string, ContractTemplate> = {
  [OWNER_COHOSTING_TEMPLATE_ID]: {
    id: OWNER_COHOSTING_TEMPLATE_ID,
    title: "Summers Vacations LLC Co-Hosting Agreement",
    signPath: "/contracts",
    autoCountersign: true,
  },
};

export function templateFor(id: string | null | undefined): ContractTemplate {
  return CONTRACT_TEMPLATES[id || OWNER_COHOSTING_TEMPLATE_ID] || CONTRACT_TEMPLATES[OWNER_COHOSTING_TEMPLATE_ID];
}

/** Server flag. Defaults OFF: anything other than the exact string "true" leaves countersigning manual. */
export function autoCountersignFlagOn(): boolean {
  return (process.env.AUTO_COUNTERSIGN || "").trim().toLowerCase() === "true";
}

/** Signed-copy emails to the signer. Defaults ON; set EMAIL_SIGNED_COPY=false to turn off. */
export function emailSignedCopyOn(): boolean {
  return (process.env.EMAIL_SIGNED_COPY || "").trim().toLowerCase() !== "false";
}
