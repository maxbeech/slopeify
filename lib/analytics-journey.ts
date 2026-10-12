// Journey events for OpenHelm (GA4). Pure helpers, no I/O, so they are unit tested.
// The event names here are what OpenHelm's journeys read; keep them in step with
// the PR description and the journey spec.
//
// Slopeify has no accounts. The free-user step is the first real use of the
// calculator, and the only identity we ever have is a completed Stripe payment.

import type { AnalyticsPlan } from "./openhelm-analytics-mp";

export type JourneyEvents = {
  /** First time a visitor changes a calculator input on a page. */
  calculator_used: { wall_type: string; state: string };
  /** The Pro report button was pressed. */
  begin_checkout: { currency: "USD"; value: number };
  /** Checkout could not start: endpoint refused, Stripe error or network. */
  checkout_failed: { reason: "unavailable" | "stripe_error" | "network" };
  /** Stripe sent the buyer back from its cancel link. */
  checkout_cancelled: Record<string, never>;
  /** Stripe confirmed the payment (verified server side). */
  purchase: { transaction_id: string; currency: string; value: number };
  /** The return from Stripe could not be confirmed as a paid session. */
  purchase_failed: { reason: "unpaid" | "lookup_failed" };
  /** A "find a pro" referral link was clicked. */
  pro_referral_click: { kind: "contractor" | "engineer" };
};

export const PRO_REPORT_PRICE_USD = 29;

/** Plan after a checkout lookup: only a session Stripe marks paid counts as `paid`. */
export function planForPayment(paymentStatus: string | undefined): AnalyticsPlan {
  return paymentStatus === "paid" ? "paid" : "anonymous";
}

export interface CheckoutStatus {
  paid: boolean;
  /** One-way hash of the session id (transactionIdFor), never the id itself. */
  transactionId?: string;
  currency?: string;
  value?: number;
  userRef?: string;
}

/**
 * The GA `transaction_id` for a Checkout Session: the SHA-256 of the session id, as
 * 64 lowercase hex chars. Stable per purchase, so GA still de-duplicates a repeat,
 * but it cannot be turned back into the session id. The raw id is a credential
 * (it unlocks /report and /api/report/pdf), so it must never reach analytics.
 */
export async function transactionIdFor(sessionId: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(sessionId));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Shape the client-facing status from a Stripe Checkout Session object.
 * `transactionId` is the hashed id from transactionIdFor; the session's own id is
 * deliberately not copied into the result.
 */
export function checkoutStatusFrom(
  session: { id?: unknown; payment_status?: unknown; currency?: unknown; amount_total?: unknown } | null,
  userRef: string | null,
  transactionId: string | null,
): CheckoutStatus {
  if (!session || session.payment_status !== "paid" || typeof session.id !== "string" || !transactionId) return { paid: false };
  const cents = typeof session.amount_total === "number" ? session.amount_total : 0;
  return {
    paid: true,
    transactionId,
    currency: typeof session.currency === "string" ? session.currency.toUpperCase() : "USD",
    value: cents / 100,
    ...(userRef ? { userRef } : {}),
  };
}

/** Stripe session ids look like cs_test_... / cs_live_...; refuse anything else before calling Stripe. */
export function isSessionId(id: string | null): id is string {
  return !!id && /^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id);
}
