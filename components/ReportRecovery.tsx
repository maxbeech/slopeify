"use client";

import { useEffect, useState, type ReactNode } from "react";
import { recoverReport } from "@/app/report/actions";
import { recallSessionId, sessionStore } from "@/lib/checkout-return";

// /report with no session_id in the URL: most often a reload after SessionIdScrubber
// cleaned the address bar. If this tab stored the id, rebuild the report through the
// recoverReport Server Action (the id goes in the request body, not the URL).
// Otherwise, or if storage is blocked or the call fails, show `fallback`: what the
// server rendered for "no id", which is the "not found" notice.
export default function ReportRecovery({ fallback }: { fallback: ReactNode }) {
  const [view, setView] = useState<{ node: ReactNode } | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const id = recallSessionId(sessionStore());
      let node: ReactNode = fallback;
      if (id) {
        try { node = await recoverReport(id); } catch { node = fallback; }
      }
      if (live) setView({ node });
    })();
    return () => { live = false; };
  }, [fallback]);

  if (view) return <>{view.node}</>;
  return (
    <>
      <p className="py-16 text-center text-sm text-slate-500" role="status">Loading your report…</p>
      <noscript>{fallback}</noscript>
    </>
  );
}
