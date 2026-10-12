"use client";

import { useEffect } from "react";
import { rememberSessionId, sessionStore, urlWithoutSessionId } from "@/lib/checkout-return";

// Takes the Stripe session id out of the address bar once the page has rendered,
// without reloading or re-fetching, so the report stays on screen. The id unlocks
// the paid report, so it should not sit in the URL to be copied, bookmarked,
// screenshotted or sent on by a later navigation. Renders nothing.
//
// With `remember` (on /report) the id is first kept in this tab's sessionStorage, so
// a reload of the clean URL can rebuild the report (ReportRecovery). Storage that is
// blocked is skipped silently; the URL is scrubbed either way.
//
// window.history.replaceState, not router.replace: router.replace would ask the
// server for the page again without the id and swap the report for "not found".
// The call is deferred one task because the App Router installs its replaceState
// patch (which keeps its own history state and syncs useSearchParams) in an effect
// of its own, and that effect runs after this child's effect on the first mount.
export default function SessionIdScrubber({ remember = false }: { remember?: boolean }) {
  useEffect(() => {
    const href = window.location.href;
    // Stored now, not in the deferred task, so a reload that beats the scrub still finds it.
    const next = remember ? rememberSessionId(href, sessionStore()) : urlWithoutSessionId(href);
    if (!next) return;
    const timer = window.setTimeout(() => window.history.replaceState(null, "", next), 0);
    return () => window.clearTimeout(timer);
  }, [remember]);

  return null;
}
