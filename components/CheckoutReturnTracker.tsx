"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { trackJourney } from "@/lib/analytics-events";
import { captureServerError } from "@/lib/observability";
import { identify } from "@/lib/openhelm-analytics";
import { reportCheckoutReturn, SESSION_ID_PARAM } from "@/lib/checkout-return";

// Reports what happened when Stripe sends the buyer back (to /report on success, to
// /pricing on cancel). Renders nothing. The logic, and the rule that the raw session
// id never reaches analytics, live in lib/checkout-return.ts.
export default function CheckoutReturnTracker() {
  const params = useSearchParams();
  // Read once, on the first render. SessionIdScrubber removes session_id from the
  // URL right after mount; re-reading the params would cancel the lookup mid-flight.
  const [ret] = useState(() => ({ status: params.get("status"), sessionId: params.get(SESSION_ID_PARAM) }));

  useEffect(() => {
    let cancelled = false;
    let storage: Storage | null = null;
    try { storage = window.sessionStorage; } catch { /* storage blocked */ }
    void reportCheckoutReturn(ret.status, ret.sessionId, {
      fetch: (input, init) => fetch(input, init),
      track: trackJourney,
      identify,
      storage,
      cancelled: () => cancelled,
      onError: (err) => captureServerError(err, { scope: "checkout-return-client" }),
    });
    return () => { cancelled = true; };
  }, [ret]);

  return null;
}
