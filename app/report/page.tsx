import { Suspense } from "react";
import type { Metadata } from "next";
import CheckoutReturnTracker from "@/components/CheckoutReturnTracker";
import ReportOutcome from "@/components/ReportOutcome";
import SessionIdScrubber from "@/components/SessionIdScrubber";
import { loadReport } from "@/lib/report/load";

// Private, per-buyer page: never indexed, never cached, and deliberately absent from
// the sitemap (a sitemap lists pages we want found; this one is only for a buyer).
// The session id in its URL unlocks the report, so the page sends no referrer (here
// and as a Referrer-Policy header in next.config.ts) and drops the id from the
// address bar once it has rendered (SessionIdScrubber).
export const metadata: Metadata = {
  title: "Your design report",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ReportPage({ searchParams }: { searchParams: SearchParams }) {
  const sessionId = first((await searchParams).session_id) ?? "";
  // Never trust the redirect alone: the session is re-read from Stripe and must be a paid
  // Slopeify report before anything is shown (lib/report/session.ts).
  const load = await loadReport(sessionId);

  return (
    <div className="mx-auto max-w-3xl">
      <Suspense fallback={null}><CheckoutReturnTracker /></Suspense>
      <SessionIdScrubber />
      <ReportOutcome load={load} sessionId={sessionId} />
    </div>
  );
}
