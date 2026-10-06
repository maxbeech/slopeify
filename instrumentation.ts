import * as Sentry from "@sentry/nextjs";
import { sharedSentryOptions } from "@/lib/sentry-options";

/**
 * Server and edge error reporting. Next calls `register()` once per runtime.
 * Sentry initialises only when a DSN is present, so local development runs
 * normally and simply reports nothing.
 */
export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({ dsn, ...sharedSentryOptions() });
}

// Reports errors thrown while rendering a server component or route handler.
export const onRequestError = Sentry.captureRequestError;
