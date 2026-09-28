/** Thin wrapper around the gtag() set up in src/app/layout.tsx (GA4 G-LGZ67283DT). */

type GtagFn = (command: "event", name: string, params?: Record<string, unknown>) => void;

export type BookChannel = "direct" | "airbnb" | "vrbo" | "phone" | "email";

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof gtag === "function") gtag("event", name, params);
}

/** GA4 `book_click` — which channel a guest chose, for which home, from where on the page. */
export function trackBookClick(
  channel: BookChannel,
  property: string,
  placement: string,
): void {
  trackEvent("book_click", { channel, property, placement });
}
