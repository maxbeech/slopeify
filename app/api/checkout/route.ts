import { NextResponse } from "next/server";
import { captureServerError, captureServerMessage } from "@/lib/observability";
import { REPORT_UNAVAILABLE_MESSAGE, missingEnv, sellConfig, siteBase } from "@/lib/report/config";
import { describeWall, parseWall, wallParam, WALL_METADATA_KEY } from "@/lib/report/purchase";

// Stripe Checkout for the one-time Pro design report, for one specific wall.
//
// The request body is { wall: "<encoded inputs>" } (the same string the calculator puts
// in its share URL). It is validated and stored on the Checkout Session as
// metadata.wall, which is how the report is rebuilt after payment: Slopeify has no
// database, and Stripe is the record of what was bought.
//
// Needs STRIPE_SECRET_KEY, STRIPE_PRICE_ID and STRIPE_WEBHOOK_SECRET. Without all three
// it answers 503: we do not take money we cannot fulfil (see lib/report/config.ts).
export async function POST(req: Request) {
  const cfg = sellConfig();
  if (!cfg) {
    // Names only, never values.
    console.warn(`[checkout] not selling: set ${missingEnv().join(", ")}`);
    return NextResponse.json({ error: REPORT_UNAVAILABLE_MESSAGE }, { status: 503 });
  }

  const payload = await req.json().catch(() => null);
  const wall = parseWall((payload as { wall?: unknown } | null)?.wall);
  if (!wall) {
    return NextResponse.json(
      { error: "The report is built from your wall. Set it up in the calculator, then choose Get the Pro report there." },
      { status: 400 },
    );
  }

  const canonical = wallParam(wall);
  const base = siteBase();
  try {
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][price]": cfg.priceId,
      "line_items[0][quantity]": "1",
      // Stripe fills in the session id. The report page re-reads the session from Stripe
      // before showing anything; the id in the URL is only a pointer, not proof.
      success_url: `${base}/report?status=success&session_id={CHECKOUT_SESSION_ID}`,
      // Back to pricing with the same wall, so a cancelled buyer can try again.
      cancel_url: `${base}/pricing?${canonical}&status=cancel`,
      allow_promotion_codes: "true",
      [`metadata[${WALL_METADATA_KEY}]`]: canonical,
      "custom_text[submit][message]": `Your report covers: ${describeWall(wall)}.`,
    });
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10000),
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
