"use client";

import { useEffect } from "react";
import { urlWithoutSessionId } from "@/lib/checkout-return";

// Takes the Stripe session id out of the address bar once the page has rendered,
// without reloading or re-fetching, so the report stays on screen. The id unlocks
// the paid report, so it should not sit in the URL to be copied, bookmarked,
// screenshotted or sent on by a later navigation. Renders nothing.
//
// window.history.replaceState, not router.replace: router.replace would ask the
// server for the page again without the id and swap the report for "not found".
// The call is deferred one task because the App Router installs its replaceState
// patch (which keeps its own history state and syncs useSearchParams) in an effect
// of its own, and that effect runs after this child's effect on the first mount.
export default function SessionIdScrubber() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = urlWithoutSessionId(window.location.href);
      if (next) window.history.replaceState(null, "", next);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
