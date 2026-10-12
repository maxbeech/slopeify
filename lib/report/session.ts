// Stripe Checkout Session lookup and the one decision everything else hangs on:
// "has this session genuinely paid for a Slopeify Pro report?"
//
// Used by the success page, the PDF download and the webhook, so all three apply
// the same rule. Nothing is granted from a redirect alone: the session is always
// re-read from Stripe with a server-side key, then checked here.
//
// Stripe reference (checked against current docs, 2026-10):
//   https://docs.stripe.com/checkout/fulfillment  (retrieve with line_items expanded,
//                                                  check payment_status before fulfilling)
//   https://docs.stripe.com/api/checkout/sessions/object  (field meanings)
import type { DesignInputs } from "../design";
import { isSessionId } from "../analytics-journey";
import { WALL_METADATA_KEY, parseWall } from "./purchase";

const STRIPE_API = "https://api.stripe.com/v1";
const REQUEST_TIMEOUT_MS = 8000;

/** The parts of a Checkout Session this code reads. Everything is optional: Stripe's JSON is untrusted input. */
export interface CheckoutSession {
  id?: unknown;
  object?: unknown;
  mode?: unknown;
  status?: unknown;
  payment_status?: unknown;
  livemode?: unknown;
  created?: unknown;
  currency?: unknown;
  amount_total?: unknown;
  customer_details?: { email?: unknown } | null;
  metadata?: Record<string, unknown> | null;
  line_items?: { data?: { price?: { id?: unknown } | null; quantity?: unknown }[] } | null;
}

export type FetchResult =
  | { ok: true; session: CheckoutSession }
  | { ok: false; kind: "invalid_id" | "not_found" | "stripe_error" | "network"; httpStatus?: number };

/**
 * Retrieve a session from Stripe with line_items expanded. `fetchImpl` is
 * injectable for tests; production uses the global fetch at call time.
 */
export async function fetchCheckoutSession(
  sessionId: string | null | undefined,
  secretKey: string,
  fetchImpl: typeof fetch = (...args) => globalThis.fetch(...args),
): Promise<FetchResult> {
  // Refuse anything that is not shaped like a session id before it goes near a URL.
  if (!isSessionId(sessionId ?? null)) return { ok: false, kind: "invalid_id" };
  try {
    const res = await fetchImpl(`${STRIPE_API}/checkout/sessions/${sessionId}?expand%5B%5D=line_items`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (res.status === 404) return { ok: false, kind: "not_found", httpStatus: 404 };
    if (!res.ok) return { ok: false, kind: "stripe_error", httpStatus: res.status };
    return { ok: true, session: (await res.json()) as CheckoutSession };
  } catch {
    return { ok: false, kind: "network" };
  }
}

export type SessionRefusal =
  /** Not a Slopeify report purchase at all (wrong object, mode or price). Say nothing about it. */
  | "foreign"
  /** Ours, checkout finished, but the money has not landed yet (delayed payment methods). */
  | "processing"
  /** Ours, but the buyer has not finished paying. */
  | "open"
  /** Ours, but the session expired unpaid. */
  | "expired"
  /** Ours and complete, but Stripe does not report it as paid. */
  | "not_paid"
  /** Paid and ours, but it carries no usable wall. A human has to sort this one out. */
  | "no_wall";

export type SessionCheck =
  | {
      ok: true;
      sessionId: string;
      wall: DesignInputs;
      email: string | null;
      created: number;
      livemode: boolean;
    }
  | { ok: false; reason: SessionRefusal; sessionId?: string };

/**
 * Decide whether a session is a paid Slopeify report. Requires, in this order:
 *   1. a checkout.session object with a well-formed id;
 *   2. mode === "payment" (one-time, not subscription or setup);
 *   3. exactly one line item, and its price id equals `expectedPriceId`
 *      (price id is the only ownership signal: metadata and customer fields are
 *      whatever the paying product wrote, and a Stripe account can be shared);
 *   4. payment_status === "paid" (not merely status "complete": a delayed bank
 *      debit completes before it pays);
 *   5. a complete, valid wall in metadata.
 * Ownership is decided before payment state so a session that is not ours never
 * reaches a "waiting" or "failed" screen.
 */
export function checkReportSession(raw: unknown, expectedPriceId: string): SessionCheck {
  const s = (raw && typeof raw === "object" ? raw : {}) as CheckoutSession;
  const id = s.id;
  if (s.object !== "checkout.session" || !isSessionId(typeof id === "string" ? id : null)) {
    return { ok: false, reason: "foreign" };
  }
  const sessionId = id as string;

  if (s.mode !== "payment") return { ok: false, reason: "foreign", sessionId };

  const items = s.line_items?.data;
  const price = Array.isArray(items) && items.length === 1 ? items[0]?.price?.id : undefined;
  if (!expectedPriceId || price !== expectedPriceId) return { ok: false, reason: "foreign", sessionId };

  if (s.payment_status !== "paid") {
    if (s.status === "expired") return { ok: false, reason: "expired", sessionId };
    if (s.status === "open") return { ok: false, reason: "open", sessionId };
    if (s.status === "complete" && s.payment_status === "unpaid") return { ok: false, reason: "processing", sessionId };
    return { ok: false, reason: "not_paid", sessionId };
  }

  const wall = parseWall(s.metadata?.[WALL_METADATA_KEY]);
  if (!wall) return { ok: false, reason: "no_wall", sessionId };

  const email = s.customer_details?.email;
  return {
    ok: true,
    sessionId,
    wall,
    email: typeof email === "string" && email.includes("@") ? email : null,
    created: typeof s.created === "number" ? s.created : Math.floor(Date.now() / 1000),
    livemode: s.livemode === true,
  };
}
