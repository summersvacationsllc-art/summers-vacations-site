/**
 * FUTURE job: write one unguessable guidebook token onto a reservation custom field.
 *
 * Designed only. `commitTokenWrite` always throws and performs no network I/O.
 * Nothing in this PR calls it. Do not remove the throw in order to "try it once"
 * against live Guesty.
 *
 * Guesty message templates can insert a reservation custom-field value. Creating
 * the field generates the variable (see Guesty Help Center, "Using variables in
 * messages" and "Best practices: Custom fields"). The exact placeholder is the
 * string in the custom field's Variable column. For a field named
 * "Guidebook link token" the best-practices spelling rule (spaces become
 * underscores, dashes are rejected) points at {{guidebook_link_token}}. Confirm
 * that column before any automated message is saved. This file does not create
 * the field and does not send a message.
 *
 * The link, once the field exists, is:
 *   https://www.mybransonvacation.com/guidebook/<unit>?t={{guidebook_link_token}}
 * This test route (/guidebook-test/...) is not the go-live URL.
 */
import { randomBytes, timingSafeEqual } from "node:crypto";

export const GUIDEBOOK_TOKEN_FIELD_NAME = "Guidebook link token";
export const GUIDEBOOK_TOKEN_VARIABLE = "{{guidebook_link_token}}";

/** Write path from the reservations-v3 custom-fields API. Not requested by this module. */
export function tokenWritePath(reservationId: string): string {
  return `/v1/reservations-v3/${reservationId}/custom-fields`;
}

export type TokenWritePlan = {
  method: "PUT";
  path: string;
  body: { customFields: [{ fieldId: string; value: string }] };
};

export function generateGuidebookToken(): string {
  return randomBytes(32).toString("base64url");
}

export function tokensEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Describes the write. Does not perform it. */
export function planTokenWrite(reservationId: string, fieldId: string, token: string): TokenWritePlan {
  return {
    method: "PUT",
    path: tokenWritePath(reservationId),
    body: { customFields: [{ fieldId, value: token }] },
  };
}

/** Hard stop. There is no success path and no fetch. The plan is not sent anywhere. */
export function commitTokenWrite(plan: TokenWritePlan): never {
  if (plan.method !== "PUT") {
    throw new Error("Refusing to write to Guesty.");
  }
  throw new Error(
    "Refusing to write to Guesty. The guidebook test does not update reservations, custom fields, or messages.",
  );
}
