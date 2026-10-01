"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackJourney } from "@/lib/analytics-events";
import { identify } from "@/lib/openhelm-analytics";
import type { CheckoutStatus } from "@/lib/analytics-journey";

// Reports what happened when Stripe sends the buyer back to /pricing. Renders nothing.
export default function CheckoutReturnTracker() {
  const params = useSearchParams();
  const status = params.get("status");
  const sessionId = params.get("session_id");

  useEffect(() => {
    if (status === "cancel") {
      trackJourney("checkout_cancelled", {});
      return;
    }
    if (status !== "success" || !sessionId) return;

    // A reload of the success page must not count a second purchase.
    const key = `oh_purchase_${sessionId}`;
    try { if (sessionStorage.getItem(key)) return; } catch { /* storage blocked: fall through */ }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`);
        const data = (await res.json()) as CheckoutStatus;
        if (cancelled) return;
        if (!res.ok) { trackJourney("purchase_failed", { reason: "lookup_failed" }); return; }
        if (!data.paid || !data.transactionId) { trackJourney("purchase_failed", { reason: "unpaid" }); return; }
        if (data.userRef) identify({ userRef: data.userRef, plan: "paid" });
        trackJourney("purchase", {
          transaction_id: data.transactionId,
          currency: data.currency ?? "USD",
          value: data.value ?? 0,
        });
        try { sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
      } catch {
        if (!cancelled) trackJourney("purchase_failed", { reason: "lookup_failed" });
      }
    })();
    return () => { cancelled = true; };
  }, [status, sessionId]);

  return null;
}
