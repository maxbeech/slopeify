import { NextResponse } from "next/server";
import { checkoutStatusFrom, isSessionId } from "@/lib/analytics-journey";
import { captureServerError, captureServerMessage } from "@/lib/observability";
import { userRefFor } from "@/lib/openhelm-analytics-mp";

// Confirms a Stripe Checkout return so the browser only reports `purchase` for a
// session Stripe says is paid. The user ref is hashed here; the raw session id is
// only used as the transaction id GA needs to de-duplicate a purchase.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("session_id");
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!isSessionId(id) || !secret) return NextResponse.json({ paid: false }, { status: 400 });

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    if (!res.ok) {
      captureServerMessage("Stripe session lookup failed", { scope: "checkout-status", httpStatus: res.status });
      return NextResponse.json({ paid: false }, { status: 502 });
    }
    const session = await res.json();
    return NextResponse.json(checkoutStatusFrom(session, await userRefFor(id)));
  } catch (err) {
    captureServerError(err, { scope: "checkout-status" });
    return NextResponse.json({ paid: false }, { status: 502 });
  }
}
