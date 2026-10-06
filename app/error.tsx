"use client";

import { useEffect } from "react";
import { captureServerError } from "@/lib/observability";

// Segment boundary: a render error in a page. Report it, then offer a retry.
export default function SegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureServerError(error, { scope: "app-error-boundary", digest: error.digest });
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-600">It has been reported. Please try again.</p>
      <button onClick={reset} className="mt-5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
        Try again
      </button>
    </div>
  );
}
