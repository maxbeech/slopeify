import { NextResponse } from "next/server";
import { captureServerError } from "@/lib/observability";
import { loadReport, reportPdf } from "@/lib/report/load";

// Download of the paid report. The Checkout Session id is the credential: every
// request re-reads the session from Stripe and serves the PDF only if it is a paid
// Slopeify report (see lib/report/session.ts). There is no copy of the PDF on
// disk and no link that outlives Stripe's record of the purchase.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The session id in this URL is the credential, so no response sends a referrer.
const NO_STORE = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};

function refuse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

export async function GET(req: Request) {
  try {
    const load = await loadReport(new URL(req.url).searchParams.get("session_id"));
    switch (load.state) {
      case "ready": {
        const pdf = await reportPdf(load);
        return new Response(Buffer.from(pdf), {
          status: 200,
          headers: {
            ...NO_STORE,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="slopeify-retaining-wall-report-${load.reference}.pdf"`,
            "Content-Length": String(pdf.byteLength),
          },
        });
      }
      case "invalid":
        // Same answer for a bad id, an unknown session and someone else's session.
        return refuse("No report found for this link.", 404);
      case "waiting":
        return refuse("This payment has not cleared yet.", 402);
      case "failed":
        return refuse("This checkout was not paid.", 402);
      case "no_wall":
        return refuse("This payment has no wall details attached. Email us with your receipt.", 409);
      case "unconfigured":
        return refuse("Reports are not switched on here.", 503);
      case "error":
        return refuse("Could not reach Stripe to confirm the payment. Try again in a minute.", 502);
    }
  } catch (err) {
    captureServerError(err, { scope: "report-pdf" });
    return refuse("Could not build the report.", 500);
  }
}
