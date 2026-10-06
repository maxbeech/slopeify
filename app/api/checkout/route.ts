import { NextResponse } from "next/server";
import { SITE } from "@/lib/site";
import { captureServerError, captureServerMessage } from "@/lib/observability";

// Stripe Checkout for the one-time Pro design report. Keys come from the Helm7 environment
// (STRIPE_SECRET_KEY, STRIPE_PRICE_ID). When absent (before Stripe is wired) the
// endpoint degrades gracefully — the Pro tier is "coming soon", not a 500.
export async function POST() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_ID;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? SITE.url;

  if (!secret || !price) {
    return NextResponse.json(
      { error: `The Pro design report launches shortly. Email ${SITE.contactEmail} for early access.` },
      { status: 503 },
    );
  }

  try {
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][price]": price,
      "line_items[0][quantity]": "1",
      // Stripe fills in the session id; the pricing page uses it to confirm the payment.
      success_url: `${base}/pricing?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/pricing?status=cancel`,
      allow_promotion_codes: "true",
    });
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const session = await res.json();
    if (!res.ok) {
      captureServerMessage("Stripe checkout session was rejected", { scope: "checkout", httpStatus: res.status, stripeErrorType: session?.error?.type, stripeErrorCode: session?.error?.code });
      return NextResponse.json({ error: session?.error?.message ?? "Stripe error" }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    captureServerError(err, { scope: "checkout" });
    return NextResponse.json({ error: "Could not reach Stripe." }, { status: 502 });
  }
}
