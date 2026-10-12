// The Stripe Checkout Session id unlocks the paid report (/report and
// /api/report/pdf), so it must never reach analytics, a Referer header or the
// address bar after the report has rendered. Analytics is switched on for this
// suite with a fake measurement id; Stripe is stubbed, nothing leaves the process.
import { readFileSync } from "node:fs";
import { createElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ENV_OK, SECRET_KEY, SESSION_ID, fakeSession, json, pick, stripeReturns, stubFetch, withEnv } from "./helpers/report-fixtures.mts";

// tsx may expose a module's default export one or two `default`s down; take the function.
const unwrap = <T,>(m: unknown): T => {
  let v = m as { default?: unknown } | undefined;
  while (v && typeof v !== "function" && v.default) v = v.default as { default?: unknown };
  return v as T;
};

// MEASUREMENT_ID is read when lib/openhelm-analytics loads, so set it before any import of it.
process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST000000";
process.env.STRIPE_SECRET_KEY = SECRET_KEY;

const { transactionIdFor } = await import("../lib/analytics-journey.ts");
const { reportCheckoutReturn, urlWithoutSessionId, rememberSessionId, recallSessionId, sessionStore, REPORT_SESSION_KEY } = await import("../lib/checkout-return.ts");
const { recoverReport } = pick(await import("../app/report/actions.tsx"), "recoverReport") as unknown as { recoverReport: (id: unknown) => Promise<ReactElement> };
const ReportPage = unwrap<(p: { searchParams: Promise<Record<string, string>> }) => Promise<ReactElement>>(await import("../app/report/page.tsx"));
const ReportRecovery = unwrap<(p: { fallback: ReactNode }) => ReactElement>(await import("../components/ReportRecovery.tsx"));
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
check("/report renders the scrubber and remembers the id; /pricing only scrubs", /<SessionIdScrubber remember \/>/.test(reportSrc) && /<SessionIdScrubber \/>/.test(pricingSrc));
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

console.log("\nReload: the report survives a refresh without the id going back into the URL");
/** Find a child element of the page's root by component name. */
const childNamed = (el: ReactElement, name: string) =>
  ([] as unknown[]).concat((el.props as { children?: unknown }).children).find(
    (c) => !!c && typeof (c as ReactElement).type === "function" && ((c as ReactElement).type as { name?: string }).name === name,
  ) as ReactElement | undefined;
const quietly = async <T,>(run: () => Promise<T>): Promise<{ out: T; logged: string }> => {
  const lines: string[] = [];
  const keep = { warn: console.warn, error: console.error, log: console.log, info: console.info };
  const grab = (...a: unknown[]) => void lines.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "));
  console.warn = grab; console.error = grab; console.log = grab; console.info = grab;
  try { return { out: await run(), logged: lines.join("\n") }; } finally { Object.assign(console, keep); }
};
// The page, the Server Action and ReportOutcome run on the server, where there is no
// window (lib/openhelm-mail refuses to run where there is one), so drop the browser
// stub for this section. The storage helpers take their storage as an argument.
delete g.window;
{
  // 1. First load: Stripe sends the buyer to /report?status=success&session_id=...
  const storage = memoryStorage();
  const scrubbed = rememberSessionId(RETURN_URL, storage);
  check("first load stores the id under the /report key", storage.map.get(REPORT_SESSION_KEY) === SESSION_ID && storage.map.size === 1);
  check("first load scrubs the URL to plain /report", scrubbed === "/report");
  check("a URL without an id stores nothing and is left alone", rememberSessionId(`${SITE_URL}/report`, memoryStorage()) === null);
  const junk = memoryStorage();
  rememberSessionId(`${SITE_URL}/report?session_id=../../etc`, junk);
  check("an id that is not a Checkout Session id is not stored", junk.map.size === 0);

  // 2. Reload: the URL is now plain /report, so the page hands over to ReportRecovery.
  const withId = await withEnv(ENV_OK, async () => {
    const s = stripeReturns(fakeSession());
    try { return await ReportPage({ searchParams: Promise.resolve({ status: "success", session_id: SESSION_ID }) }); } finally { s.restore(); }
  });
  const reloaded = await withEnv(ENV_OK, () => ReportPage({ searchParams: Promise.resolve({}) }));
  check("with the id in the URL the page renders the report directly", !childNamed(withId, "ReportRecovery"));
  const recovery = childNamed(reloaded, "ReportRecovery");
  check("without it the page renders ReportRecovery, with the server's notice as fallback", !!recovery && renderToStaticMarkup((recovery.props as { fallback: ReactElement }).fallback).includes("could not find that report"));
  const firstPaint = renderToStaticMarkup(createElement(ReportRecovery as never, { fallback: createElement("p", null, "NOT FOUND NOTICE") } as never));
  check("before the check runs it says it is loading, and no-JS still gets the notice", firstPaint.includes("Loading your report") && firstPaint.includes("<noscript><p>NOT FOUND NOTICE</p></noscript>"));

  const recalled = recallSessionId(storage);
  check("a reload reads the stored id back", recalled === SESSION_ID);
  const s = stripeReturns(fakeSession());
  const { out: node, logged } = await quietly(() => withEnv(ENV_OK, () => recoverReport(recalled)));
  const html = renderToStaticMarkup(node);
  check("the reload recovers the report: payment confirmed, the PDF and the report itself", html.includes("Payment received. Your report is ready.") && html.includes("Download the PDF") && html.includes("This gravity wall works"));
  check("recovery re-checks the session with Stripe, as a first load does", s.calls.length === 1 && s.calls[0].url.startsWith(`https://api.stripe.com/v1/checkout/sessions/${SESSION_ID}`));
  check("recovery logs nothing with the id", !leaks(logged), logged);
  s.restore();

  const err = stubFetch((c) => (c.url.startsWith("https://api.stripe.com/") ? json({ error: { message: "boom" } }, 500) : undefined));
  const failed = await quietly(() => withEnv(ENV_OK, () => recoverReport(SESSION_ID)));
  check("a Stripe failure during recovery is logged without the id", failed.logged.length > 0 && !leaks(failed.logged), failed.logged);
  check("and shows the retry notice, not a crash", renderToStaticMarkup(failed.out).includes("Could not confirm your payment"));
  err.restore();

  const none = stubFetch(() => undefined);
  const bad = await withEnv(ENV_OK, () => recoverReport("../../etc/passwd"));
  check("recovering a value that is not a session id shows not found, without calling Stripe", renderToStaticMarkup(bad).includes("could not find that report") && none.calls.length === 0);
  none.restore();
  const tampered = memoryStorage();
  tampered.setItem(REPORT_SESSION_KEY, "javascript:alert(1)");
  check("a tampered stored value is ignored", recallSessionId(tampered) === null);
  check("nothing stored: no recovery, the notice stays", recallSessionId(memoryStorage()) === null);
}

console.log("\nBlocked storage never throws");
g.window = win;
{
  const blocked = {
    getItem: (): string | null => { throw new Error("SecurityError: The operation is insecure."); },
    setItem: (): void => { throw new Error("QuotaExceededError"); },
  };
  let threw: unknown = null;
  let scrubbed: string | null = null;
  let recalled: string | null = "unset";
  try { scrubbed = rememberSessionId(RETURN_URL, blocked); recalled = recallSessionId(blocked); } catch (e) { threw = e; }
  check("storage that throws on read and write: no throw", threw === null, String(threw));
  check("the URL is still scrubbed", scrubbed === "/report");
  check("a reload just falls back to not found (nothing recalled)", recalled === null);
  check("no storage at all behaves the same", rememberSessionId(RETURN_URL, null) === "/report" && recallSessionId(null) === null);

  // Merely touching window.sessionStorage throws in some browsers with site data blocked.
  Object.defineProperty(win, "sessionStorage", { configurable: true, get() { throw new Error("SecurityError: access denied"); } });
  let store: unknown = "unset";
  try { store = sessionStore(); } catch (e) { threw = e; }
  check("a sessionStorage getter that throws gives null, not an exception", threw === null && store === null);
  delete (win as { sessionStorage?: unknown }).sessionStorage;
  check("no window.sessionStorage at all gives null", sessionStore() === null);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
