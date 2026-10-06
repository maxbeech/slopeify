import * as Sentry from "@sentry/nextjs";

/**
 * The one way our code reports a handled problem.
 *
 * Everything funnels through here so scope and tag conventions stay consistent,
 * and so a deployment with no DSN degrades to a console line instead of
 * throwing inside an error handler.
 *
 * `context` must be ids, codes, counts and enum values only. Never names,
 * emails, free text, or request and response bodies.
 */
export function captureServerError(err: unknown, context: Record<string, unknown> = {}): void {
  const scope = typeof context.scope === "string" ? context.scope : "server";
  try {
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.withScope((s) => {
        s.setTag("scope", scope);
        for (const [k, v] of Object.entries(context)) {
          if (k !== "scope") s.setExtra(k, v);
        }
        s.captureException(err instanceof Error ? err : new Error(String(err)));
      });
      return;
    }
  } catch {
    // Never let reporting an error become an error.
  }
  console.error(`[${scope}]`, err, context);
}

/** Report a handled failure that is not an exception, such as a rejected upstream response. */
export function captureServerMessage(message: string, context: Record<string, unknown> = {}): void {
  const scope = typeof context.scope === "string" ? context.scope : "server";
  try {
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.withScope((s) => {
        s.setTag("scope", scope);
        s.setLevel("warning");
        for (const [k, v] of Object.entries(context)) {
          if (k !== "scope") s.setExtra(k, v);
        }
        s.captureMessage(message);
      });
      return;
    }
  } catch {
    // see above
  }
  console.warn(`[${scope}]`, message, context);
}
