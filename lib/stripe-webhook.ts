// Stripe webhook for the Pro design report: the safety net that reaches a buyer who
// pays and then closes the tab before the success page loads. The success page
// shows the report; this sends it by email.
//
// Follows TableHelm's webhook (app/api/stripe/webhook/route.ts): verify the
// signature on the raw body, claim the event id before acting, release the claim
// and answer 500 on failure so Stripe retries, answer 200 for anything that is
// not ours or cannot be helped by a retry.
//
// Differences from TableHelm, and why:
//   * No Stripe SDK. Slopeify talks to Stripe over fetch (see /api/checkout), so the
//     signature check is done here with node:crypto, per Stripe's documented scheme
//     (header "t=<unix>,v1=<hex>[,v1=<hex>]"; HMAC-SHA256 of "<t>.<raw body>" keyed
//     with the endpoint secret; 5 minute default tolerance).
//   * Ownership by price id is done by checkReportSession() after re-reading the
//     session from Stripe. The shared gate in TableHelm (lib/gate.ts) reads prices
//     from `subscription`, which a one-time payment session does not have.
//   * No database, so the event-id record is in memory (per process, 24 h). The
//     durable guarantee is the email idempotency key (the session id), which makes a
//     repeat delivery a no-op at the mail provider. See the README for the optional
//     table if event-level durability is ever wanted.
//
// Docs: https://docs.stripe.com/checkout/fulfillment
//       https://docs.stripe.com/events/how-events-work (retries, ordering)
import { createHmac, timingSafeEqual } from "node:crypto";
import { isSessionId } from "./analytics-journey";
import { captureServerError, captureServerMessage } from "./observability";
import { sellConfig } from "./report/config";
import { emailReport, type DeliveryResult } from "./report/deliver";
import { buildReady, type ReadyReport } from "./report/load";
import { checkReportSession, fetchCheckoutSession } from "./report/session";

/** Stripe's documented default. Matches stripe-node: only an old timestamp is refused. */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

/** Events that mean "money may now have arrived for a Checkout Session". */
export const HANDLED_EVENTS = ["checkout.session.completed", "checkout.session.async_payment_succeeded"] as const;

/** Checkout waits up to 10 s for this endpoint before redirecting the buyer, so keep the work bounded. */
const DELIVERY_TIMEOUT_MS = 8000;

export type SignatureResult =
  | { ok: true; timestamp: number }
  | { ok: false; reason: "missing_header" | "malformed_header" | "no_match" | "stale" };

export function verifyStripeSignature(
  rawBody: string,
  header: string | null | undefined,
  secret: string,
  opts: { nowSeconds?: number; toleranceSeconds?: number } = {},
): SignatureResult {
  if (!header) return { ok: false, reason: "missing_header" };

  let timestamp = -1;
  const candidates: string[] = [];
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "t") timestamp = Number.parseInt(value, 10);
    else if (key === "v1") candidates.push(value);
  }
  if (!Number.isFinite(timestamp) || timestamp < 0 || candidates.length === 0) {
    return { ok: false, reason: "malformed_header" };
  }

  // The secret is used exactly as Stripe shows it, whsec_ prefix included.
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();
  // Several v1 values appear while an endpoint secret is being rolled; any one may match.
  const matched = candidates.some((hex) => {
    if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length !== expected.length * 2) return false;
    return timingSafeEqual(Buffer.from(hex, "hex"), expected);
  });
  if (!matched) return { ok: false, reason: "no_match" };

  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = opts.toleranceSeconds ?? SIGNATURE_TOLERANCE_SECONDS;
  if (tolerance > 0 && now - timestamp > tolerance) return { ok: false, reason: "stale" };
  return { ok: true, timestamp };
}

/** Remembers which event ids are being or have been handled. */
export interface EventStore {
  /** True if this caller now owns the event; false if it is in flight or already done. */
  claim(eventId: string): boolean;
  /** Give the event back so Stripe's retry is processed instead of swallowed as a duplicate. */
  release(eventId: string): void;
}

export function createEventStore(opts: { ttlMs?: number; max?: number; now?: () => number } = {}): EventStore {
  const ttlMs = opts.ttlMs ?? 24 * 60 * 60 * 1000;
  const max = opts.max ?? 5000;
  const now = opts.now ?? Date.now;
  const seen = new Map<string, number>(); // insertion order = age order
  return {
    claim(eventId) {
      const t = now();
      for (const [id, at] of seen) {
        if (t - at <= ttlMs) break;
        seen.delete(id);
      }
      if (seen.has(eventId)) return false;
      seen.set(eventId, t);
      while (seen.size > max) seen.delete(seen.keys().next().value as string);
      return true;
    },
    release(eventId) {
      seen.delete(eventId);
    },
  };
}

/** Process-wide store used by the route. Tests pass their own. */
export const processedEvents: EventStore = createEventStore();

export interface WebhookDeps {
  env?: Record<string, string | undefined>;
  store?: EventStore;
  fetchImpl?: typeof fetch;
  nowSeconds?: () => number;
  deliver?: (ready: ReadyReport) => Promise<DeliveryResult>;
  /** Cap on the delivery step; a slow provider becomes a 500 so Stripe retries. Default 8000. */
  deliveryTimeoutMs?: number;
}

export interface WebhookOutcome {
  status: number;
  body: Record<string, unknown>;
}

const ok = (body: Record<string, unknown>): WebhookOutcome => ({ status: 200, body: { received: true, ...body } });

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("delivery timed out")), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

export async function handleStripeWebhook(
  rawBody: string,
  signatureHeader: string | null,
  deps: WebhookDeps = {},
): Promise<WebhookOutcome> {
  const env = deps.env ?? process.env;
  const cfg = sellConfig(env);
  // Not configured: nothing here can be trusted or fulfilled. 503 so Stripe retries once it is.
  if (!cfg) return { status: 503, body: { received: false, error: "unconfigured" } };

  const sig = verifyStripeSignature(rawBody, signatureHeader, cfg.webhookSecret, {
    nowSeconds: deps.nowSeconds?.(),
  });
  if (!sig.ok) {
    captureServerMessage("Stripe webhook signature refused", { scope: "stripe.webhook", reason: sig.reason });
    return { status: 400, body: { received: false, error: "invalid_signature" } };
  }

  let event: { id?: unknown; type?: unknown; data?: { object?: { id?: unknown } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { received: false, error: "invalid_payload" } };
  }
  if (typeof event.id !== "string" || typeof event.type !== "string") {
    return { status: 400, body: { received: false, error: "invalid_payload" } };
  }
  if (!(HANDLED_EVENTS as readonly string[]).includes(event.type)) return ok({ ignored: "event_type" });

  const sessionId = event.data?.object?.id;
  if (typeof sessionId !== "string" || !isSessionId(sessionId)) return ok({ ignored: "not_a_checkout_session" });

  const store = deps.store ?? processedEvents;
  if (!store.claim(event.id)) return ok({ duplicate: true });

  const eventContext = { scope: "stripe.webhook", event_id: event.id, event_type: event.type };
  try {
    // Re-read the session instead of trusting the event body: the snapshot can be
    // stale, and line_items (our ownership signal) is never in the event.
    const fetched = await fetchCheckoutSession(sessionId, cfg.secretKey, deps.fetchImpl);
    if (!fetched.ok) {
      // A session this account does not know is another account's or mode's event.
      if (fetched.kind === "not_found") return ok({ ignored: "unknown_session" });
      throw new Error(`Stripe session lookup failed (${fetched.kind}${fetched.httpStatus ? ` ${fetched.httpStatus}` : ""})`);
    }

    const check = checkReportSession(fetched.session, cfg.priceId);
    if (!check.ok) {
      switch (check.reason) {
        case "foreign":
          return ok({ ignored: "not_ours" });
        case "processing":
        case "open":
          // Delayed payment method: Stripe sends async_payment_succeeded when it clears.
          return ok({ pending: true });
        case "expired":
        case "not_paid":
          return ok({ ignored: "not_paid" });
        case "no_wall":
          // Paid and ours, but nothing to build a report from. A retry cannot fix that.
          captureServerMessage("Paid report session has no usable wall", eventContext);
          return ok({ fulfilled: false, reason: "no_wall" });
      }
    }

    const ready = buildReady(check);
    const delivery = await withTimeout((deps.deliver ?? emailReport)(ready), deps.deliveryTimeoutMs ?? DELIVERY_TIMEOUT_MS);
    if (delivery.ok) return ok({ delivered: true, status: delivery.status });

    if (!delivery.retry) {
      // No address on the session: retrying cannot produce one. Surface it for a human.
      captureServerMessage("Paid report could not be emailed", { ...eventContext, reason: delivery.reason });
      return ok({ fulfilled: false, reason: delivery.reason });
    }
    // The provider's own message can name the recipient, so it is not repeated here;
    // lib/openhelm-mail.ts already logs it. Only the reason code goes to Sentry.
    throw new Error(`Report email not sent (${delivery.reason})`);
  } catch (err) {
    captureServerError(err, eventContext);
    // Release the claim so Stripe's retry is processed instead of treated as a duplicate.
    store.release(event.id);
    return { status: 500, body: { received: false, error: "handler_error" } };
  }
}
