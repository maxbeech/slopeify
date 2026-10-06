"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Last-resort boundary: a render error that escaped every page boundary.
// Report it before showing the fallback, otherwise the crashes that matter most
// are the ones we never hear about.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f8fafc", fontFamily: "system-ui, sans-serif", color: "#0f172a" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>Something went wrong</h1>
            <p style={{ color: "#475569", marginBottom: "1.5rem" }}>It has been reported. Please try again.</p>
            {error.digest && <p style={{ fontSize: "0.75rem", color: "#94a3b8", fontFamily: "monospace" }}>Error ID: {error.digest}</p>}
            <button onClick={reset} style={{ padding: "0.6rem 1.25rem", background: "#047857", color: "#fff", border: 0, borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
