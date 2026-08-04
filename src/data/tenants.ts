/**
 * Multi-tenant registry for the Branson live card (/branson).
 * Guest stay guidebooks (/guidebook/[property]) are NOT multi-tenant — leave them alone.
 *
 * Billing rule (funnel):
 *   active | trial (unexpired) | past_due within grace → tenant's properties
 *   lapsed | cancelled | trial expired | past_due past grace → Summers Vacations default catalog
 *
 * Future markets (Pigeon Forge, Tampa, …): set `marketId` + scout locators later.
 * Intel APIs stay Branson-scoped until market packs exist.
 */

import { BOOK_URL, PHONE, PROPERTIES, type PropertyCard } from "@/lib/site";

export type BillingStatus = "active" | "trial" | "past_due" | "lapsed" | "cancelled";

/** Market pack id — scouts/intel attach here later (branson now; pigeon-forge / tampa later). */
export type MarketId = "branson" | "pigeon-forge" | "tampa" | (string & {});

export type TenantProperty = PropertyCard & {
  /** Override direct-book URL for this unit; falls back to tenant.bookUrl */
  bookUrl?: string;
};

export type Tenant = {
  id: string;
  slug: string;
  displayName: string;
  /** Short mark in the app header, e.g. SV */
  brandShort: string;
  marketId: MarketId;
  status: BillingStatus;
  /** ISO date YYYY-MM-DD — trial ends end-of-day CT conceptually (date-only compare) */
  trialEndsAt?: string;
  /** ISO date YYYY-MM-DD — paid through */
  paidThrough?: string;
  /** Days after paidThrough/trialEnds before funnel swap */
  graceDays: number;
  bookUrl: string;
  phone?: string;
  tagline?: string;
  properties: TenantProperty[];
  /** Platform owner — catalog fallback target */
  isPlatformDefault?: boolean;
  notes?: string;
};

const SUMMERS_PROPERTIES: TenantProperty[] = PROPERTIES.map((p) => ({ ...p }));

/** Platform default — always available as funnel fallback. */
export const PLATFORM_DEFAULT_SLUG = "summers";

export const TENANTS: Tenant[] = [
  {
    id: "tenant_summers",
    slug: PLATFORM_DEFAULT_SLUG,
    displayName: "Summers Vacations",
    brandShort: "SV",
    marketId: "branson",
    status: "active",
    graceDays: 14,
    bookUrl: BOOK_URL,
    phone: PHONE,
    tagline: "Family stays · Branson West & Indian Point",
    properties: SUMMERS_PROPERTIES,
    isPlatformDefault: true,
    notes: "Platform owner. Never lapse-swap away from self.",
  },
  {
    id: "tenant_trial_partner",
    slug: "trial-partner",
    displayName: "Trial Partner",
    brandShort: "TP",
    marketId: "branson",
    status: "trial",
    // ~45-day trial from setup — extend in this file when she starts
    trialEndsAt: "2026-09-05",
    graceDays: 14,
    bookUrl: BOOK_URL, // replace with her direct-book or Airbnb link
    phone: undefined,
    tagline: "Trial host · Branson area",
    properties: [
      {
        name: "Partner Unit (edit me)",
        tag: "Trial · Edit in tenants.ts",
        sleeps: "6",
        beds: "2BR",
        area: "Branson",
        slug: "trial-partner-unit",
        photo: null,
        blurb:
          "Placeholder for your friend's unit. Edit name, photo path, sleeps, bookUrl in src/data/tenants.ts.",
        badge: "🧪 Trial",
      },
    ],
    notes:
      "Friend trial. Share https://<site>/branson?t=trial-partner — edit unit fields before she goes live.",
  },
];

export function getTenantBySlug(slug: string | null | undefined): Tenant | null {
  if (!slug) return null;
  const s = slug.trim().toLowerCase();
  return TENANTS.find((t) => t.slug === s) ?? null;
}

export function getPlatformDefaultTenant(): Tenant {
  const t = TENANTS.find((x) => x.isPlatformDefault) ?? TENANTS[0];
  return t;
}

function parseDateOnly(iso?: string): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999);
}

export type CatalogResolution = {
  /** Tenant whose brand is shown (may be platform if funnel swap) */
  displayTenant: Tenant;
  /** Properties actually listed */
  properties: TenantProperty[];
  /** True when we substituted Summers catalog because trial/sub lapsed */
  usingPlatformFunnel: boolean;
  /** Original requested tenant (for messaging) */
  requestedTenant: Tenant;
  reason: "active" | "trial" | "grace" | "platform_default" | "funnel_fallback";
  statusLabel: string;
};

/**
 * Resolve which property catalog to show for a tenant at `now`.
 * Summers (platform default) always keeps its own list.
 */
export function resolveCatalog(tenant: Tenant, now: Date = new Date()): CatalogResolution {
  const platform = getPlatformDefaultTenant();

  if (tenant.isPlatformDefault || tenant.slug === platform.slug) {
    return {
      displayTenant: tenant,
      properties: tenant.properties,
      usingPlatformFunnel: false,
      requestedTenant: tenant,
      reason: "platform_default",
      statusLabel: "Platform",
    };
  }

  const graceMs = Math.max(0, tenant.graceDays) * 24 * 60 * 60 * 1000;

  if (tenant.status === "active") {
    const paidThrough = parseDateOnly(tenant.paidThrough);
    if (!paidThrough || paidThrough.getTime() >= now.getTime()) {
      return {
        displayTenant: tenant,
        properties: tenant.properties,
        usingPlatformFunnel: false,
        requestedTenant: tenant,
        reason: "active",
        statusLabel: "Active",
      };
    }
    // paidThrough in the past → treat as past_due window
    if (paidThrough.getTime() + graceMs >= now.getTime()) {
      return {
        displayTenant: tenant,
        properties: tenant.properties,
        usingPlatformFunnel: false,
        requestedTenant: tenant,
        reason: "grace",
        statusLabel: "Past due (grace)",
      };
    }
    return funnel(tenant, platform, "Subscription ended");
  }

  if (tenant.status === "trial") {
    const ends = parseDateOnly(tenant.trialEndsAt);
    if (ends && ends.getTime() >= now.getTime()) {
      return {
        displayTenant: tenant,
        properties: tenant.properties,
        usingPlatformFunnel: false,
        requestedTenant: tenant,
        reason: "trial",
        statusLabel: "Trial",
      };
    }
    if (ends && ends.getTime() + graceMs >= now.getTime()) {
      return {
        displayTenant: tenant,
        properties: tenant.properties,
        usingPlatformFunnel: false,
        requestedTenant: tenant,
        reason: "grace",
        statusLabel: "Trial grace",
      };
    }
    return funnel(tenant, platform, "Trial ended");
  }

  if (tenant.status === "past_due") {
    const paidThrough = parseDateOnly(tenant.paidThrough) ?? now;
    if (paidThrough.getTime() + graceMs >= now.getTime()) {
      return {
        displayTenant: tenant,
        properties: tenant.properties,
        usingPlatformFunnel: false,
        requestedTenant: tenant,
        reason: "grace",
        statusLabel: "Past due (grace)",
      };
    }
    return funnel(tenant, platform, "Past due");
  }

  // lapsed | cancelled
  return funnel(tenant, platform, tenant.status === "cancelled" ? "Cancelled" : "Lapsed");
}

function funnel(requested: Tenant, platform: Tenant, label: string): CatalogResolution {
  return {
    displayTenant: platform,
    properties: platform.properties,
    usingPlatformFunnel: true,
    requestedTenant: requested,
    reason: "funnel_fallback",
    statusLabel: `${label} → Summers featured`,
  };
}

/** Resolve from ?t= slug; unknown slug → Summers. */
export function resolveFromSlug(slug: string | null | undefined, now?: Date): CatalogResolution {
  const platform = getPlatformDefaultTenant();
  const tenant = getTenantBySlug(slug) ?? platform;
  return resolveCatalog(tenant, now);
}
