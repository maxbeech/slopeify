// What the browser does when Stripe sends a buyer back: report the outcome to
// analytics, and get the Stripe session id out of the address bar.
//
// The session id is a credential. Whoever holds it can open /report and download
// the paid PDF (lib/report/session.ts), so it must not reach analytics, a Referer
// header, a shared screenshot or a copied URL. The pieces here are plain functions
// with their I/O passed in, so they are tested without a browser
// (test/session-id-privacy.test.mts).
import { isSessionId, type CheckoutStatus, type JourneyEvents } from "./analytics-journey";

/** The query parameter Stripe fills from {CHECKOUT_SESSION_ID} in the success URL. */
export const SESSION_ID_PARAM = "session_id";

/**
 * `href` without the session id, as a path + query + hash for history.replaceState,
 * or null when there is no session id to remove. `status` goes too when it came with
 * the id, since it means nothing on its own; any other parameter is kept.
 */
export function urlWithoutSessionId(href: string): string | null {
  const url = new URL(href, "http://localhost");
  if (!url.searchParams.has(SESSION_ID_PARAM)) return null;
  url.searchParams.delete(SESSION_ID_PARAM);
  url.searchParams.delete("status");
  const query = url.searchParams.toString();
  return `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
}

/**
 * sessionStorage key for the report this tab is showing. Scoped to /report: it holds
 * one session id, so a reload of the scrubbed /report URL can rebuild the report
 * (components/ReportRecovery.tsx) without the id going back into the URL.
 * sessionStorage is per tab and is cleared when the tab closes.
 */
export const REPORT_SESSION_KEY = "slopeify:report:session_id";

type KeyStore = Pick<Storage, "getItem" | "setItem">;

/** window.sessionStorage, or null where it is missing or blocked (merely touching it can throw). */
export function sessionStore(): KeyStore | null {
  try {
    return typeof window === "undefined" ? null : (window.sessionStorage ?? null);
  } catch {
    return null;
  }
}

/**
 * First load of /report: keep a valid session id from `href` in `storage`, then hand
 * back the scrubbed URL (or null when the URL has no id). Never throws: with storage
 * blocked the URL is still scrubbed, and a reload falls back to "not found".
 */
export function rememberSessionId(href: string, storage: KeyStore | null): string | null {
  const next = urlWithoutSessionId(href);
  if (next === null) return null;
  const id = new URL(href, "http://localhost").searchParams.get(SESSION_ID_PARAM);
  if (storage && isSessionId(id)) {
    try { storage.setItem(REPORT_SESSION_KEY, id); } catch { /* blocked or full: scrub anyway */ }
  }
  return next;
}

/** Reload of /report without an id: the id this tab stored, or null. Never throws. */
export function recallSessionId(storage: KeyStore | null): string | null {
  if (!storage) return null;
  try {
    const id = storage.getItem(REPORT_SESSION_KEY);
    return isSessionId(id) ? id : null;
  } catch {
    return null;
  }
}

export interface ReturnDeps {
  fetch: typeof fetch;
  track: <K extends keyof JourneyEvents>(event: K, params: JourneyEvents[K]) => unknown;
  identify: (who: { userRef: string; plan: "paid" }) => unknown;
  /** sessionStorage, or null when it is blocked. */
  storage: Pick<Storage, "getItem" | "setItem"> | null;
  /** True once the component that started this has gone away. */
  cancelled: () => boolean;
  onError: (err: unknown) => void;
}

/**
 * Report the return from Stripe. Only a session the status route confirms as paid
 * counts as a purchase, and its transaction id is the hash the route sends back.
 * An id that is, or looks like, a raw session id is refused rather than sent.
 */
export async function reportCheckoutReturn(
  status: string | null,
  sessionId: string | null,
  deps: ReturnDeps,
): Promise<void> {
  if (status === "cancel") {
    deps.track("checkout_cancelled", {});
    return;
  }
  if (status !== "success" || !sessionId) return;

  try {
    const res = await deps.fetch(`/api/checkout/status?${SESSION_ID_PARAM}=${encodeURIComponent(sessionId)}`);
    const data = (await res.json()) as CheckoutStatus;
    if (deps.cancelled()) return;
    if (!res.ok) { deps.track("purchase_failed", { reason: "lookup_failed" }); return; }
    if (!data.paid) { deps.track("purchase_failed", { reason: "unpaid" }); return; }
    const txn = data.transactionId;
    if (!txn || txn === sessionId || txn.includes(sessionId) || isSessionId(txn)) {
      deps.track("purchase_failed", { reason: "lookup_failed" });
      return;
    }

    // A reload or back-forward of the success page must not count a second purchase.
    // Keyed on the hash, so the raw id is not written to storage either.
    const key = `oh_purchase_${txn}`;
    try { if (deps.storage?.getItem(key)) return; } catch { /* storage blocked: fall through */ }

    if (data.userRef) deps.identify({ userRef: data.userRef, plan: "paid" });
    deps.track("purchase", { transaction_id: txn, currency: data.currency ?? "USD", value: data.value ?? 0 });
    try { deps.storage?.setItem(key, "1"); } catch { /* ignore */ }
  } catch (err) {
    deps.onError(err);
    if (!deps.cancelled()) deps.track("purchase_failed", { reason: "lookup_failed" });
  }
}
