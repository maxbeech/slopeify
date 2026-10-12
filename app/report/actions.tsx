"use server";

import ReportOutcome from "@/components/ReportOutcome";
import { isSessionId } from "@/lib/analytics-journey";
import { loadReport } from "@/lib/report/load";

// Rebuilds /report after a reload, once SessionIdScrubber has taken the session id
// out of the URL. ReportRecovery reads the id from this tab's sessionStorage and
// calls this Server Action, so the id travels in a POST body, never in a URL, and
// nothing here logs it. It is the same check as a first load: the session is
// re-read from Stripe and must be a paid Slopeify report (lib/report/session.ts).
export async function recoverReport(sessionId: unknown) {
  const id = typeof sessionId === "string" && isSessionId(sessionId) ? sessionId : "";
  const load = await loadReport(id);
  return <ReportOutcome load={load} sessionId={id} />;
}
