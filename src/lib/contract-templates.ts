import { AGREEMENT_SECTIONS, CONTRACT_TITLE } from "@/lib/cohosting-agreement";
import {
  KLEIN_ADVENTURE_ESCAPE_SECTIONS,
  KLEIN_ADVENTURE_ESCAPE_TITLE,
  KLEIN_SILVER_DOLLAR_SUITE_SECTIONS,
  KLEIN_SILVER_DOLLAR_SUITE_TITLE,
  type AgreementSection,
} from "@/lib/klein-agreements";

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
  /** Agreement text shown on the signing page and saved with the signed record. */
  sections: AgreementSection[];
};

export const OWNER_COHOSTING_TEMPLATE_ID = "owner-cohosting";
export const KLEIN_ADVENTURE_ESCAPE_TEMPLATE_ID = "klein-adventure-escape-cohosting";
export const KLEIN_SILVER_DOLLAR_SUITE_TEMPLATE_ID = "klein-silver-dollar-suite-cohosting";

export const CONTRACT_TEMPLATES: Record<string, ContractTemplate> = {
  [OWNER_COHOSTING_TEMPLATE_ID]: {
    id: OWNER_COHOSTING_TEMPLATE_ID,
    title: CONTRACT_TITLE,
    signPath: "/contracts",
    autoCountersign: true,
    sections: AGREEMENT_SECTIONS,
  },
  [KLEIN_ADVENTURE_ESCAPE_TEMPLATE_ID]: {
    id: KLEIN_ADVENTURE_ESCAPE_TEMPLATE_ID,
    title: KLEIN_ADVENTURE_ESCAPE_TITLE,
    signPath: "/contracts",
    autoCountersign: true,
    sections: KLEIN_ADVENTURE_ESCAPE_SECTIONS,
  },
  [KLEIN_SILVER_DOLLAR_SUITE_TEMPLATE_ID]: {
    id: KLEIN_SILVER_DOLLAR_SUITE_TEMPLATE_ID,
    title: KLEIN_SILVER_DOLLAR_SUITE_TITLE,
    signPath: "/contracts",
    autoCountersign: true,
    sections: KLEIN_SILVER_DOLLAR_SUITE_SECTIONS,
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
