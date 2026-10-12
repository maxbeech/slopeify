import { NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/stripe-webhook";

// Stripe webhook for the Pro design report. Register this URL in Stripe
// (https://<host>/api/stripe/webhook) for exactly two events:
//   checkout.session.completed
//   checkout.session.async_payment_succeeded
// All logic lives in lib/stripe-webhook.ts so it can be tested without a server.
export const runtime = "nodejs"; // node:crypto for the signature check
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // The signature covers the exact bytes Stripe sent, so read the raw text and
  // parse it only after it has been verified.
  const rawBody = await req.text();
  const out = await handleStripeWebhook(rawBody, req.headers.get("stripe-signature"));
  return NextResponse.json(out.body, { status: out.status });
}
