"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { Sentry.captureException(error); }, [error]); return <html><body><main><h1>Something went wrong</h1><p>We have been notified. Please try again.</p><button onClick={reset}>Try again</button></main></body></html>; }
