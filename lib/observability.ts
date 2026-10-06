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
const SAFE_STRING = /^[A-Za-z0-9_.:-]{1,64}$/;

/** Keep numbers, booleans and short identifier-like strings; drop everything else. */
export function safeContext(context: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(context).slice(0, 20)) {
    if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (typeof v === "string" && SAFE_STRING.test(v)) out[k] = v;
  }
  return out;
}

export function captureServerError(err: unknown, rawContext: Record<string, unknown> = {}): void {
  const context = safeContext(rawContext);
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
  console.error(`[${scope}]`, err instanceof Error ? err.message : "error", context);
}

/** Report a handled failure that is not an exception, such as a rejected upstream response. */
export function captureServerMessage(message: string, rawContext: Record<string, unknown> = {}): void {
  const context = safeContext(rawContext);
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
