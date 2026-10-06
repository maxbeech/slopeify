import type { Breadcrumb, ErrorEvent, Event, EventHint, Log } from "@sentry/nextjs";

type TransactionEvent = Event & { type: "transaction" };

/**
 * The one scrubber every Sentry hook goes through (errors, logs, breadcrumbs,
 * transactions and spans), so nothing sensitive leaves the process by a route
 * the others would have caught.
 *
 * Three rules hold throughout:
 *  - Key-based AND pattern-based: a field called `token` is redacted whatever it
 *    holds, and an email inside a free-text message is masked too.
 *  - Linear time: every pattern uses bounded repetition and no nested or
 *    overlapping quantifiers, and any string is truncated to MAX_STRING before
 *    matching, so hostile log text cannot trigger catastrophic backtracking.
 *  - Fail closed: if scrubbing throws, the event, log or breadcrumb is dropped
 *    (the hook returns null). The raw payload is never sent instead.
 */

const REDACTED = "[redacted]";
/** Longer strings are cut before any regex runs. */
export const MAX_STRING = 10_000;

// Keys whose values never leave the process. Matched case-insensitively as
// substrings, so `stripe_secret_key` and `OPENHELM_API_KEY` both hit.
const SECRET_KEYS = [
  "key", "token", "secret", "password", "passwd", "authorization", "cookie", "session",
  "signature", "credential", "dsn", "bearer", "jwt",
];
// Personal details are not ours to ship to a third party.
const PII_KEYS = ["email", "phone", "address", "full_name", "fullname", "username"];

// Keys that hold a URL: the query string and fragment are dropped.
const URL_KEYS = new Set(["url", "to", "from", "href", "http.url", "url.full", "url.path", "referrer"]);
// Keys that hold ONLY a query string: the whole value goes.
const QUERY_KEYS = new Set(["http.query", "url.query", "query_string", "query", "search"]);

const PATTERNS: RegExp[] = [
  // JWTs (three base64url segments).
  /\beyJ[A-Za-z0-9_-]{5,512}\.[A-Za-z0-9_-]{5,512}\.[A-Za-z0-9_-]{0,512}/g,
  // Bearer / Basic credentials.
  /\b(?:Bearer|Basic)\s{1,4}[A-Za-z0-9._~+/=-]{8,512}/gi,
  // Vendor API keys: Stripe, Helm7, Sentry, OpenAI-style, GitHub, Slack, Google.
  /\b(?:sk|pk|rk|whsec|hlm_sk|hlm_pk|sntrys|sntryu|ghp|gho|github_pat|xox[abprs]|AIza)[_-][A-Za-z0-9_-]{8,256}/g,
  // Emails.
  /[A-Z0-9._%+-]{1,64}@[A-Z0-9.-]{1,255}\.[A-Z]{2,24}/gi,
  // Phone numbers: international (+44 20 7946 0958) and NANP (555-123-4567, (555) 123 4567).
  /\+\d[\d\s().-]{7,20}\d/g,
  /(?:\(\d{3}\)|\b\d{3})[\s.-]\d{3}[\s.-]\d{4}\b/g,
];

// key=value / "key":"value" pairs in serialised text, with a sensitive-looking key.
const KEY_VALUE_RE =
  /(["']?)\b([\w.-]{0,40}(?:password|passwd|secret|token|authorization|api[_-]?key|apikey)[\w.-]{0,40})\1(\s{0,5}[:=]\s{0,5})("[^"]{0,2000}"|'[^']{0,2000}'|[^\s,&;}]{1,2000})/gi;

/** Mask emails, phones, tokens and API keys inside free text. */
export function scrubString(value: string): string {
  let out = value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}...[truncated]` : value;
  for (const re of PATTERNS) out = out.replace(re, REDACTED);
  out = out.replace(KEY_VALUE_RE, (_m, q: string, k: string, sep: string) => `${q}${k}${q}${sep}${REDACTED}`);
  return out;
}

/** Drop the query string and fragment from a URL or path, however it is written. */
export function stripQuery(value: string): string {
  const cut = value.length > MAX_STRING ? value.slice(0, MAX_STRING) : value;
  return cut.replace(/[?#][^\s"')]{0,2000}/g, "");
}

function isSensitive(key: string): boolean {
  const k = key.toLowerCase();
  return SECRET_KEYS.some((s) => k.includes(s)) || PII_KEYS.some((s) => k.includes(s));
}

/** Recursively redact sensitive values, preserving structure for debugging. */
export function scrubValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (typeof value === "string") return scrubString(value);
  if (typeof value !== "object") return value;
  if (depth > 6) return REDACTED;
  if (Array.isArray(value)) return value.slice(0, 200).map((v) => scrubValue(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const lk = k.toLowerCase();
    if (isSensitive(k)) out[k] = REDACTED;
    else if (QUERY_KEYS.has(lk) && typeof v === "string") out[k] = "";
    else if (URL_KEYS.has(lk) && typeof v === "string") out[k] = scrubString(stripQuery(v));
    else out[k] = scrubValue(v, depth + 1);
  }
  return out;
}

function scrubCommon(event: ErrorEvent | TransactionEvent): void {
  if (event.request) {
    if (event.request.url) event.request.url = scrubString(stripQuery(event.request.url));
    delete event.request.cookies;
    event.request.query_string = undefined;
    if (event.request.headers) event.request.headers = scrubValue(event.request.headers) as Record<string, string>;
    if (event.request.data) event.request.data = scrubValue(event.request.data);
  }
  if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>;
  if (event.contexts) event.contexts = scrubValue(event.contexts) as typeof event.contexts;
  if (event.tags) event.tags = scrubValue(event.tags) as typeof event.tags;
  // Keep an opaque id for "users affected", never an email, name or address.
  if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
  if (typeof event.message === "string") event.message = scrubString(event.message);
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => scrubBreadcrumbUnsafe(b));
  }
}

/** Sentry `beforeSend`. Fails closed: a scrubbing error drops the event. */
export function scrubEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  // User feedback is the one event that keeps name and email: the person typed
  // them into the form on purpose so we can reply.
  if ((event as { type?: string }).type === "feedback") return event;
  try {
    scrubCommon(event);
    for (const ex of event.exception?.values ?? []) {
      if (typeof ex.value === "string") ex.value = scrubString(ex.value);
    }
    return event;
  } catch {
    return null;
  }
}

function scrubBreadcrumbUnsafe(crumb: Breadcrumb): Breadcrumb {
  const out: Breadcrumb = { ...crumb };
  if (typeof out.message === "string") out.message = scrubString(out.message);
  if (out.data) out.data = scrubValue(out.data) as Record<string, unknown>;
  return out;
}

/** Sentry `beforeBreadcrumb`: message and data scrubbed, query strings stripped. Fails closed. */
export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb | null {
  try {
    return scrubBreadcrumbUnsafe(crumb);
  } catch {
    return null;
  }
}

/** Sentry `beforeSendTransaction`: request URL, transaction name and span data. Fails closed. */
export function scrubTransaction(event: TransactionEvent): TransactionEvent | null {
  try {
    scrubCommon(event);
    if (typeof event.transaction === "string") event.transaction = scrubString(stripQuery(event.transaction));
    event.spans = event.spans?.map((span) => ({
      ...span,
      description: typeof span.description === "string" ? scrubString(stripQuery(span.description)) : span.description,
      data: span.data ? (scrubValue(span.data) as typeof span.data) : span.data,
    }));
    return event;
  } catch {
    return null;
  }
}

/** Sentry `beforeSendLog`: message and attributes. Fails closed. */
export function scrubLog(log: Log): Log | null {
  try {
    const message = typeof log.message === "string" ? scrubString(log.message) : log.message;
    const attributes = log.attributes ? (scrubValue(log.attributes) as Log["attributes"]) : log.attributes;
    return { ...log, message, attributes };
  } catch {
    return null;
  }
}
