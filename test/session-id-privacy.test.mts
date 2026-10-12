// The Stripe Checkout Session id unlocks the paid report (/report and
// /api/report/pdf), so it must never reach analytics, a Referer header or the
// address bar after the report has rendered. Analytics is switched on for this
// suite with a fake measurement id; Stripe is stubbed, nothing leaves the process.
import { readFileSync } from "node:fs";
import { ENV_OK, SECRET_KEY, SESSION_ID, fakeSession, json, pick, stripeReturns, stubFetch, withEnv } from "./helpers/report-fixtures.mts";

// MEASUREMENT_ID is read when lib/openhelm-analytics loads, so set it before any import of it.
process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST000000";
process.env.STRIPE_SECRET_KEY = SECRET_KEY;

const { transactionIdFor } = await import("../lib/analytics-journey.ts");
const { reportCheckoutReturn, urlWithoutSessionId } = await import("../lib/checkout-return.ts");
const { trackJourney } = await import("../lib/analytics-events.ts");
const analytics = await import("../lib/openhelm-analytics.tsx");
const { GET: status } = pick(await import("../app/api/checkout/status/route.ts"), "GET");
const { GET: download } = pick(await import("../app/api/report/pdf/route.ts"), "GET");

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name} ${detail}`); }
}

// A minimal browser: gtag's dataLayer, a location and a title. Set after the imports
// so no module decides at load time that it is running in a browser.
const SITE_URL = "https://www.slopeify.com";
const RETURN_URL = `${SITE_URL}/report?status=success&session_id=${SESSION_ID}`;
const g = globalThis as unknown as { window?: unknown; document?: unknown };
const win = { dataLayer: [] as unknown[], location: { href: RETURN_URL } };
g.window = win;
g.document = { title: "Your design report" };

/** Everything analytics was handed, as one string. */
const sent = () => JSON.stringify(win.dataLayer.map((args) => Array.from(args as ArrayLike<unknown>)));
/** The raw id, and its random part alone, so a re-prefixed or truncated copy is caught too. */
const leaks = (s: string) => s.includes(SESSION_ID) || s.includes(SESSION_ID.slice("cs_test_".length));
const events = () => win.dataLayer.map((args) => Array.from(args as ArrayLike<unknown>)).filter((a) => a[0] === "event");

const memoryStorage = () => {
  const m = new Map<string, string>();
  return { map: m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

/** Browser fetch: same-origin calls go to the real status route; Stripe answers with `session`. */
function browserFetch(session: unknown) {
  return stubFetch((c) => {
    if (c.url.startsWith("/api/checkout/status")) return (status as (r: Request) => Promise<Response>)(new Request(`${SITE_URL}${c.url}`));
    if (c.url.startsWith("https://api.stripe.com/v1/checkout/sessions/")) return json(session);
    return undefined;
  });
}

const deps = (storage: ReturnType<typeof memoryStorage>, errors: unknown[] = []) => ({
  fetch: (input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init),
  track: trackJourney,
  identify: analytics.identify,
  storage,
  cancelled: () => false,
  onError: (err: unknown) => void errors.push(err),
});

console.log("Analytics is really on for this suite");
check("analytics enabled with the fake measurement id", analytics.analyticsEnabled === true);

console.log("\nStatus route: the response holds hashes only");
{
  const s = stripeReturns(fakeSession());
  const res = await (status as (r: Request) => Promise<Response>)(new Request(`${SITE_URL}/api/checkout/status?session_id=${SESSION_ID}`));
  const text = await res.text();
  const body = JSON.parse(text);
  check("paid, with transactionId = SHA-256 of the session id", res.status === 200 && body.paid === true && body.transactionId === (await transactionIdFor(SESSION_ID)));
  check("the raw session id is nowhere in the response", !leaks(text), text);
  s.restore();
}

console.log("\nPurchase event: the analytics payload never contains the raw session id");
{
  const storage = memoryStorage();
  const errors: unknown[] = [];
  const f = browserFetch(fakeSession());
  await reportCheckoutReturn("success", SESSION_ID, deps(storage, errors));
  const purchase = events().find((e) => e[1] === "purchase");
  const params = (purchase?.[2] ?? {}) as Record<string, unknown>;
  check("a purchase event was sent", !!purchase && errors.length === 0, String(errors[0] ?? ""));
  check("its transaction_id is the hash", params.transaction_id === (await transactionIdFor(SESSION_ID)) && params.value === 29 && params.currency === "USD");
  check("no analytics payload (events, user properties) contains the session id", !leaks(sent()), sent());
  check("the de-duplication key in sessionStorage is not the session id", storage.map.size === 1 && ![...storage.map.keys()].some(leaks));

  win.dataLayer.length = 0;
  await reportCheckoutReturn("success", SESSION_ID, deps(storage));
  check("a repeat return does not count a second purchase", !events().some((e) => e[1] === "purchase"));
  f.restore();
}
{
  // An older server (mid-deploy) that still answers with the raw id: refuse to send it.
  win.dataLayer.length = 0;
  const f = stubFetch((c) => (c.url.startsWith("/api/checkout/status") ? json({ paid: true, transactionId: SESSION_ID, currency: "USD", value: 29 }) : undefined));
  await reportCheckoutReturn("success", SESSION_ID, deps(memoryStorage()));
  check("a raw id from the server is not forwarded as transaction_id", !events().some((e) => e[1] === "purchase") && !leaks(sent()), sent());
  check("it is reported as a failed lookup instead", events().some((e) => e[1] === "purchase_failed"));
  f.restore();
}
{
  // Any other session-id-shaped value is refused as well.
  win.dataLayer.length = 0;
  const f = stubFetch((c) => (c.url.startsWith("/api/checkout/status") ? json({ paid: true, transactionId: "cs_live_SomeOtherSession0001", value: 29 }) : undefined));
  await reportCheckoutReturn("success", SESSION_ID, deps(memoryStorage()));
  check("a session-id-shaped transaction id is refused", !events().some((e) => e[1] === "purchase"));
  f.restore();
}
{
  win.dataLayer.length = 0;
  const f = browserFetch(fakeSession({ payment_status: "unpaid" }));
  await reportCheckoutReturn("success", SESSION_ID, deps(memoryStorage()));
  check("unpaid: purchase_failed, and still no session id", events().some((e) => e[1] === "purchase_failed") && !leaks(sent()), sent());
  f.restore();
}

console.log("\nPage views never carry the session id");
{
  win.dataLayer.length = 0;
  analytics.trackPageView(`/report?status=success&session_id=${SESSION_ID}`);
  const view = events().find((e) => e[1] === "page_view");
  const p = (view?.[2] ?? {}) as Record<string, string>;
  check("page_path and page_location drop session_id", !!view && !leaks(sent()), sent());
  check("everything else in the URL is kept", p.page_path === "/report?status=success" && p.page_location === `${SITE_URL}/report?status=success`, JSON.stringify(p));
  check("a URL without the id is passed through untouched", analytics.redactUrl("/pricing?h=4&status=cancel") === "/pricing?h=4&status=cancel");
}

console.log("\nThe address bar");
check("/report return URL becomes plain /report", urlWithoutSessionId(RETURN_URL) === "/report");
check("other parameters and the hash are kept", urlWithoutSessionId(`${SITE_URL}/pricing?h=4&session_id=${SESSION_ID}&status=success#pro`) === "/pricing?h=4#pro");
check("nothing to do without a session id (cancel return keeps its wall)", urlWithoutSessionId(`${SITE_URL}/pricing?h=4&status=cancel`) === null);
const reportSrc = readFileSync("app/report/page.tsx", "utf8");
const pricingSrc = readFileSync("app/pricing/page.tsx", "utf8");
const scrubSrc = readFileSync("components/SessionIdScrubber.tsx", "utf8");
const trackerSrc = readFileSync("components/CheckoutReturnTracker.tsx", "utf8");
check("/report and /pricing render the scrubber", /<SessionIdScrubber \/>/.test(reportSrc) && /<SessionIdScrubber \/>/.test(pricingSrc));
check("the scrubber uses history.replaceState (no server refetch, the report stays on screen)", /window\.history\.replaceState\(/.test(scrubSrc) && !/router\.replace/.test(scrubSrc.replace(/\/\/.*$/gm, "")));
check("the tracker reads the return params once, so the scrub cannot cancel its lookup", /useState\(\(\) => \(\{ status: params\.get\("status"\)/.test(trackerSrc));

console.log("\nNo referrer from the report or its PDF");
const pageMod = (await import("../app/report/page.tsx")) as { metadata?: { referrer?: string }; default?: { metadata?: { referrer?: string } } };
check("/report metadata sets referrer no-referrer", (pageMod.metadata ?? pageMod.default?.metadata)?.referrer === "no-referrer");
const get = (id: string) => (download as (r: Request) => Promise<Response>)(new Request(`${SITE_URL}/api/report/pdf?session_id=${id}`));
{
  const s = stripeReturns(fakeSession());
  const res = await withEnv(ENV_OK, () => get(SESSION_ID));
  check("PDF download sends Referrer-Policy: no-referrer", res.status === 200 && res.headers.get("referrer-policy") === "no-referrer");
  s.restore();
  const refused = await withEnv(ENV_OK, () => get("nope"));
  check("refusals send it too", refused.status === 404 && refused.headers.get("referrer-policy") === "no-referrer");
}
const nextConfigSrc = readFileSync("next.config.ts", "utf8");
check("next.config sends the header on /report and /api/report/*", /"\/report"/.test(nextConfigSrc) && /"\/api\/report\/:path\*"/.test(nextConfigSrc) && /Referrer-Policy/.test(nextConfigSrc) && /no-referrer/.test(nextConfigSrc));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
