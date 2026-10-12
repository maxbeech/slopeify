"use client";

import { useState } from "react";
import { trackJourney } from "@/lib/analytics-events";
import { captureServerError } from "@/lib/observability";
import { PRO_REPORT_PRICE_USD } from "@/lib/analytics-journey";

// `wall` is the encoded calculator inputs the report is built from (see
// lib/report/purchase.ts). The pricing page only renders this button when payments
// are connected and a wall was chosen, so the 503 branch below is a fallback for a
// configuration change between page load and click, not the normal "off" state.
export default function CheckoutButton({ wall }: { wall: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setMsg(null);
    trackJourney("begin_checkout", { currency: "USD", value: PRO_REPORT_PRICE_USD });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wall }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      trackJourney("checkout_failed", { reason: res.status === 503 ? "unavailable" : "stripe_error" });
      setMsg(data.error ?? "Checkout could not start. Please try again.");
    } catch (err) {
      captureServerError(err, { scope: "checkout-client" });
      trackJourney("checkout_failed", { reason: "network" });
      setMsg("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={start} disabled={loading}
        className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60">
        {loading ? "Starting…" : `Get the Pro design report ($${PRO_REPORT_PRICE_USD})`}
      </button>
      {msg && <p className="mt-2 text-center text-xs text-slate-500">{msg}</p>}
    </div>
  );
}
