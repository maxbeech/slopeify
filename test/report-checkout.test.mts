// Paid-report checkout: readiness, how a purchase carries its wall, the session
// verification rule (paid + payment mode + expected price), the Stripe lookup, the
// checkout route, and what the pricing and success pages show in each state.
// Stripe is never contacted: global fetch is stubbed per test. Run: npm test
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ENV, REPORT_UNAVAILABLE_MESSAGE, canSell, missingEnv, readConfig, sellConfig, siteBase } from "../lib/report/config.ts";
import { WALL_KEYS, describeWall, parseWall, reportReference, wallParam } from "../lib/report/purchase.ts";
import { checkReportSession, fetchCheckoutSession } from "../lib/report/session.ts";
import { loadReport, type ReportLoad } from "../lib/report/load.ts";
import { isoDate, maskEmail } from "../lib/report/format.ts";
import { encodeInputs } from "../lib/calc-url.ts";
import { DEFAULT_INPUTS } from "../lib/design.ts";
import { SITE } from "../lib/site.ts";
import {
  BUYER_EMAIL, ENV_OK, PRICE_ID, SECRET_KEY, SESSION_ID, WALLS, WEBHOOK_SECRET, fakeStripe,
  fakeSession, json, pick, stripeReturns, stubFetch, withEnv,
} from "./helpers/report-fixtures.mts";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name} ${detail}`); }
}
// tsx may expose a CJS component's default export wrapped; unwrap either shape.
const unwrap = <T,>(m: unknown): T => ((m as { default?: unknown }).default ?? m) as T;
const quiet = async <T,>(run: () => Promise<T>): Promise<T> => {
  const w = console.warn, e = console.error;
  console.warn = () => {}; console.error = () => {};
  try { return await run(); } finally { console.warn = w; console.error = e; }
};

console.log("Readiness: selling needs all three Stripe variables");
check("all three valid: can sell", canSell(ENV_OK) && missingEnv(ENV_OK).length === 0);
for (const name of Object.values(ENV)) {
  const env = { ...ENV_OK, [name]: undefined };
  check(`without ${name}: cannot sell, and it is the one named`, !canSell(env) && missingEnv(env).join() === name, missingEnv(env).join());
}
check("whitespace around a value is trimmed", canSell({ ...ENV_OK, STRIPE_PRICE_ID: `  ${PRICE_ID}\n` }));
check("a product id is not accepted as a price id", !canSell({ ...ENV_OK, STRIPE_PRICE_ID: "prod_123456789" }));
check("a publishable key is not accepted as the secret key", !canSell({ ...ENV_OK, STRIPE_SECRET_KEY: fakeStripe("pk_test", "FAKEFAKEFAKEFAKE0000") }));
check("a restricted key is accepted", canSell({ ...ENV_OK, STRIPE_SECRET_KEY: fakeStripe("rk_live", "FAKEFAKEFAKEFAKE0000") }));
check("a secret key too short to be real is refused", !canSell({ ...ENV_OK, STRIPE_SECRET_KEY: fakeStripe("sk_test", "short") }) && readConfig({ ...ENV_OK, STRIPE_SECRET_KEY: fakeStripe("sk_test", "short") }) === null);
check("a webhook secret too short to be real is refused", !canSell({ ...ENV_OK, STRIPE_WEBHOOK_SECRET: fakeStripe("whsec", "short") }));
check("a webhook secret needs the whsec_ prefix", !canSell({ ...ENV_OK, STRIPE_WEBHOOK_SECRET: "FAKEFAKEFAKEFAKEFAKE0000" }));
check("viewing a report needs only key and price (not the webhook secret)", readConfig({ ...ENV_OK, STRIPE_WEBHOOK_SECRET: undefined }) !== null && sellConfig({ ...ENV_OK, STRIPE_WEBHOOK_SECRET: undefined }) === null);
const leak = JSON.stringify(missingEnv({ STRIPE_SECRET_KEY: SECRET_KEY, STRIPE_PRICE_ID: "bad", STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET }));
check("missing-variable report names variables, never values", leak === '["STRIPE_PRICE_ID"]' && !leak.includes(SECRET_KEY) && !leak.includes(WEBHOOK_SECRET), leak);
check("site base drops a trailing slash", siteBase({ NEXT_PUBLIC_SITE_URL: "https://example.test/" }) === "https://example.test" && siteBase({}) === SITE.url);

console.log("\nThe one sentence shown while payments are off");
check("is a single sentence", (REPORT_UNAVAILABLE_MESSAGE.match(/[.!?](\s|$)/g) ?? []).length === 1, REPORT_UNAVAILABLE_MESSAGE);
check("names the contact address", REPORT_UNAVAILABLE_MESSAGE.includes(SITE.contactEmail));
check("says why (payments are not connected), not 'launches shortly'", REPORT_UNAVAILABLE_MESSAGE.includes("payments aren't connected") && !/launch|soon|shortly/i.test(REPORT_UNAVAILABLE_MESSAGE));
check("has no em dash", !REPORT_UNAVAILABLE_MESSAGE.includes("\u2014"));

console.log("\nA purchase carries its wall");
for (const [name, wall] of Object.entries(WALLS)) {
  const back = parseWall(wallParam(wall));
  check(`${name}: wall survives encode then parse unchanged`, JSON.stringify(back) === JSON.stringify(wall), JSON.stringify(back));
}
check("wall string fits Stripe's 500 character metadata limit", wallParam(WALLS.loaded).length < 200, String(wallParam(WALLS.loaded).length));
check("metadata key has no square brackets (Stripe forbids them)", !/[[\]]/.test("wall"));
check("every encoded key is required", WALL_KEYS.every((k) => new URLSearchParams(encodeInputs(DEFAULT_INPUTS)).has(k)));
for (const key of WALL_KEYS) {
  const p = new URLSearchParams(encodeInputs(DEFAULT_INPUTS)); p.delete(key);
  check(`missing "${key}" is rejected rather than defaulted`, parseWall(p.toString()) === null);
}
check("empty, junk and oversized strings are rejected", parseWall("") === null && parseWall(undefined) === null && parseWall(42) === null && parseWall("x".repeat(501)) === null);
check("out-of-range numbers are clamped by the engine rules", parseWall(encodeInputs(DEFAULT_INPUTS).replace("h=4", "h=999"))?.heightFt === 30);
check("describeWall names type, height, length and state", describeWall(DEFAULT_INPUTS) === "Segmental block (SRW), 4 ft high, 30 ft long, California", describeWall(DEFAULT_INPUTS));
const ref = reportReference(SESSION_ID);
check("report reference is short, stable and does not contain the session id", /^SLP-[0-9A-F]{8}$/.test(ref) && ref === reportReference(SESSION_ID) && !SESSION_ID.toUpperCase().includes(ref.slice(4)));
check("masked email keeps the domain, hides the name", maskEmail(BUYER_EMAIL) === "b***@example.com" && maskEmail("nope") === null && maskEmail(null) === null);
check("purchase date is UTC", isoDate(1760000000) === "2025-10-09");

console.log("\nSession verification: paid, payment mode, expected price");
const ok = checkReportSession(fakeSession(), PRICE_ID);
check("paid, payment mode, our price, wall present: accepted", ok.ok === true);
if (ok.ok) {
  check("accepted session carries the wall, email and date", JSON.stringify(ok.wall) === JSON.stringify(DEFAULT_INPUTS) && ok.email === BUYER_EMAIL && ok.created === 1760000000 && ok.sessionId === SESSION_ID);
}
const refusal = (over: Record<string, unknown>, price = PRICE_ID) => {
  const r = checkReportSession(fakeSession(over), price);
  return r.ok ? "ok" : r.reason;
};
check("unpaid but checkout complete (delayed payment): processing", refusal({ payment_status: "unpaid", status: "complete" }) === "processing");
check("unpaid and checkout still open: open", refusal({ payment_status: "unpaid", status: "open" }) === "open");
check("expired session: expired", refusal({ payment_status: "unpaid", status: "expired" }) === "expired");
check("no_payment_required is not treated as paid", refusal({ payment_status: "no_payment_required" }) === "not_paid");
check("a status of complete alone does not grant", refusal({ payment_status: "unpaid", status: "complete" }) !== "ok");
check("subscription mode is not ours", refusal({ mode: "subscription" }) === "foreign");
check("setup mode is not ours", refusal({ mode: "setup" }) === "foreign");
check("a different price is not ours", refusal({ line_items: { data: [{ price: { id: "price_1SomeOtherProduct" }, quantity: 1 }] } }) === "foreign");
check("line items not expanded: refused, not guessed", refusal({ line_items: undefined }) === "foreign");
check("two line items: refused", refusal({ line_items: { data: [{ price: { id: PRICE_ID } }, { price: { id: PRICE_ID } }] } }) === "foreign");
check("empty expected price never matches", refusal({}, "") === "foreign");
check("not a checkout session object: refused", refusal({ object: "payment_intent" }) === "foreign");
check("malformed session id: refused", refusal({ id: "cs_test_short" }) === "foreign" && refusal({ id: 42 }) === "foreign");
check("ownership is decided before payment state (a foreign unpaid session is never 'waiting')", refusal({ mode: "subscription", payment_status: "unpaid", status: "open" }) === "foreign");
check("paid and ours but no wall: no_wall", refusal({ metadata: {} }) === "no_wall" && refusal({ metadata: null }) === "no_wall");
check("paid and ours but a partial wall: no_wall", refusal({ metadata: { wall: "h=4&l=30" } }) === "no_wall");
check("garbage input is refused, not thrown", checkReportSession(null, PRICE_ID).ok === false && checkReportSession("x", PRICE_ID).ok === false && checkReportSession([], PRICE_ID).ok === false);
const noEmail = checkReportSession(fakeSession({ customer_details: null }), PRICE_ID);
check("paid with no email on the session: accepted, email null", noEmail.ok && noEmail.email === null);

console.log("\nStripe lookup");
{
  const s = stripeReturns(fakeSession());
  const r = await fetchCheckoutSession(SESSION_ID, SECRET_KEY);
  check("returns the session", r.ok && (r.session as { id?: string }).id === SESSION_ID);
  const c = s.calls[0];
  check("asks for line_items to be expanded", c.url === `https://api.stripe.com/v1/checkout/sessions/${SESSION_ID}?expand%5B%5D=line_items`, c.url);
  check("authenticates with the secret key as a bearer token", c.headers.authorization === `Bearer ${SECRET_KEY}`);
  s.restore();
}
{
  const s = stripeReturns({ error: { message: "No such checkout.session" } }, 404);
  check("404 is not_found", (await fetchCheckoutSession(SESSION_ID, SECRET_KEY)).ok === false);
  const r = await fetchCheckoutSession(SESSION_ID, SECRET_KEY);
  check("404 reports kind not_found", !r.ok && r.kind === "not_found");
  s.restore();
}
{
  const s = stripeReturns({ error: {} }, 500);
  const r = await fetchCheckoutSession(SESSION_ID, SECRET_KEY);
  check("500 reports stripe_error with the status", !r.ok && r.kind === "stripe_error" && r.httpStatus === 500);
  s.restore();
}
{
  const s = stubFetch(() => undefined); // every call throws
  const r = await fetchCheckoutSession(SESSION_ID, SECRET_KEY);
  check("a network failure reports kind network", !r.ok && r.kind === "network");
  s.restore();
}
{
  const s = stripeReturns(fakeSession());
  for (const bad of ["", "cs_test_", "../../v1/customers", "cs_test_abc/../x", `${SESSION_ID}?x=1`, fakeStripe("sk_test", "FAKEFAKEFAKE"), null, undefined]) {
    const r = await fetchCheckoutSession(bad as string, SECRET_KEY);
    check(`rejects ${JSON.stringify(bad)} without calling Stripe`, !r.ok && r.kind === "invalid_id");
  }
  check("no request was made for any malformed id", s.calls.length === 0, String(s.calls.length));
  s.restore();
}

console.log("\nloadReport: what each outcome becomes");
const load = async (session: unknown, status = 200, env: Record<string, string | undefined> = ENV_OK): Promise<ReportLoad> => {
  const s = stripeReturns(session, status);
  try { return await quiet(() => withEnv(env, () => loadReport(SESSION_ID))); } finally { s.restore(); }
};
const ready = await load(fakeSession());
check("paid session: ready", ready.state === "ready");
if (ready.state === "ready") {
  check("ready report is the engine's result for the stored wall", ready.design.base.check.baseWidth === 2 && ready.design.inputs.stateSlug === "california");
  check("ready report has the purchase date and a reference", ready.model.issuedOn === "2025-10-09" && /^SLP-/.test(ready.reference));
}
check("unpaid, complete: waiting (processing)", JSON.stringify(await load(fakeSession({ payment_status: "unpaid" }))) === '{"state":"waiting","why":"processing"}');
check("open: waiting (open)", JSON.stringify(await load(fakeSession({ payment_status: "unpaid", status: "open" }))) === '{"state":"waiting","why":"open"}');
check("expired: failed", JSON.stringify(await load(fakeSession({ payment_status: "unpaid", status: "expired" }))) === '{"state":"failed","why":"expired"}');
check("someone else's price: invalid (same as unknown)", (await load(fakeSession({ line_items: { data: [{ price: { id: "price_1Other" } }] } }))).state === "invalid");
check("unknown session: invalid", (await load({ error: {} }, 404)).state === "invalid");
check("Stripe down: error", (await load({ error: {} }, 503)).state === "error");
check("paid but no wall: no_wall", (await load(fakeSession({ metadata: {} }))).state === "no_wall");
check("keys not set: unconfigured, Stripe never asked", (await (async () => {
  const s = stripeReturns(fakeSession());
  const r = await withEnv({ STRIPE_SECRET_KEY: undefined, STRIPE_PRICE_ID: undefined }, () => loadReport(SESSION_ID));
  const none = s.calls.length === 0; s.restore();
  return r.state === "unconfigured" && none ? { state: "ok" } : r;
})()).state === "ok");

console.log("\nPOST /api/checkout");
const { POST: checkout } = pick(await import("../app/api/checkout/route.ts"), "POST");
const post = (body: unknown, raw = false) =>
  (checkout as (r: Request) => Promise<Response>)(new Request("http://localhost/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: raw ? String(body) : JSON.stringify(body) }));
{
  const s = stubFetch((c) => (c.url === "https://api.stripe.com/v1/checkout/sessions" ? json({ id: "cs_test_x", url: "https://checkout.stripe.com/c/pay/cs_test_x" }) : undefined));
  const res = await withEnv({ ...ENV_OK, NEXT_PUBLIC_SITE_URL: undefined }, () => post({ wall: encodeInputs(WALLS.tallWeak) }));
  const body = await res.json();
  check("configured: returns the Stripe checkout url", res.status === 200 && body.url === "https://checkout.stripe.com/c/pay/cs_test_x");
  const call = s.calls[0];
  const form = new URLSearchParams(call.body);
  check("posts to the Checkout Sessions endpoint with the secret key", call.method === "POST" && call.headers.authorization === `Bearer ${SECRET_KEY}`);
  check("one-time payment for the configured price, quantity 1", form.get("mode") === "payment" && form.get("line_items[0][price]") === PRICE_ID && form.get("line_items[0][quantity]") === "1");
  check("stores the validated wall in metadata.wall", form.get("metadata[wall]") === encodeInputs(WALLS.tallWeak), form.get("metadata[wall]") ?? "");
  check("success_url lands on /report with the session placeholder", form.get("success_url") === `${SITE.url}/report?status=success&session_id={CHECKOUT_SESSION_ID}`, form.get("success_url") ?? "");
  check("cancel_url returns to pricing with the same wall", form.get("cancel_url") === `${SITE.url}/pricing?${encodeInputs(WALLS.tallWeak)}&status=cancel`, form.get("cancel_url") ?? "");
  check("checkout page tells the buyer which wall the report covers", (form.get("custom_text[submit][message]") ?? "").includes("8 ft high"));
  check("response never contains the secret key", !JSON.stringify(body).includes(SECRET_KEY));
  s.restore();
}
{
  const s = stubFetch((c) => json({ id: "cs_test_x", url: "https://checkout.stripe.com/x" }, c.url.endsWith("sessions") ? 200 : 404));
  await withEnv({ ...ENV_OK, NEXT_PUBLIC_SITE_URL: "https://example.test/" }, () => post({ wall: encodeInputs(DEFAULT_INPUTS) }));
  check("redirects use NEXT_PUBLIC_SITE_URL without a doubled slash", new URLSearchParams(s.calls[0].body).get("success_url")!.startsWith("https://example.test/report?"));
  s.restore();
}
for (const [label, env] of [
  ["nothing set", { STRIPE_SECRET_KEY: undefined, STRIPE_PRICE_ID: undefined, STRIPE_WEBHOOK_SECRET: undefined }],
  ["key and price but no webhook secret", { ...ENV_OK, STRIPE_WEBHOOK_SECRET: undefined }],
] as const) {
  const s = stubFetch(() => undefined);
  const res = await quiet(() => withEnv(env, () => post({ wall: encodeInputs(DEFAULT_INPUTS) })));
  const body = await res.json();
  check(`${label}: 503 with the one honest sentence`, res.status === 503 && body.error === REPORT_UNAVAILABLE_MESSAGE);
  check(`${label}: Stripe is never called`, s.calls.length === 0);
  s.restore();
}
for (const [label, body, raw] of [
  ["no wall", {}, false],
  ["a partial wall", { wall: "h=4&l=30" }, false],
  ["a non-string wall", { wall: 7 }, false],
  ["a body that is not JSON", "not json", true],
] as const) {
  const s = stubFetch(() => undefined);
  const res = await withEnv(ENV_OK, () => post(body, raw));
  check(`${label}: 400, and Stripe is never called`, res.status === 400 && s.calls.length === 0, String(res.status));
  s.restore();
}
{
  const s = stubFetch(() => json({ error: { type: "invalid_request_error", code: "resource_missing", message: "No such price" } }, 400));
  const res = await quiet(() => withEnv(ENV_OK, () => post({ wall: encodeInputs(DEFAULT_INPUTS) })));
  check("Stripe rejects the session: 502 with Stripe's message", res.status === 502 && (await res.json()).error === "No such price");
  s.restore();
}
{
  const s = stubFetch(() => undefined);
  const res = await quiet(() => withEnv(ENV_OK, () => post({ wall: encodeInputs(DEFAULT_INPUTS) })));
  check("Stripe unreachable: 502", res.status === 502 && (await res.json()).error === "Could not reach Stripe.");
  s.restore();
}

console.log("\nPricing page purchase block: three honest states");
const Cta = unwrap<(p: { available: boolean; wall: typeof DEFAULT_INPUTS | null }) => never>((await import("../components/ProReportCta.tsx")));
const html = (available: boolean, wall: typeof DEFAULT_INPUTS | null) => renderToStaticMarkup(createElement(Cta as never, { available, wall } as never));
{
  const off = html(false, WALLS.default);
  check("payments off: the one sentence, even when a wall is chosen", off.includes("card payments aren&#x27;t connected") && off.includes(SITE.contactEmail));
  check("payments off: no button and no checkout link", !off.includes("<button") && !off.includes("/api/checkout") && !off.includes("Get the Pro"));
  const noWall = html(true, null);
  check("payments on, no wall: sends the buyer to the calculator", noWall.includes("Design your wall first") && noWall.includes('href="/"'));
  check("payments on, no wall: no buy button", !noWall.includes("<button"));
  const on = html(true, WALLS.default);
  check("payments on with a wall: a working buy button", on.includes("<button") && on.includes("Get the Pro design report ($29)"));
  check("payments on with a wall: says which wall the report covers", on.includes("Segmental block (SRW), 4 ft high, 30 ft long, California"));
  check("payments on with a wall: offers a way back to change it", on.includes(`href="/?${encodeInputs(DEFAULT_INPUTS).replace(/&/g, "&amp;")}"`));
}
const pricingSrc = (await import("node:fs")).readFileSync("app/pricing/page.tsx", "utf8");
check("pricing page reads readiness and the wall per request", /canSell\(\)/.test(pricingSrc) && /parseWall\(/.test(pricingSrc) && /force-dynamic/.test(pricingSrc));
const calcHtml = renderToStaticMarkup(createElement(unwrap<never>(await import("../components/Calculator.tsx")) as never));
check("calculator links to pricing carrying the exact wall", calcHtml.includes(`href="/pricing?${encodeInputs(DEFAULT_INPUTS).replace(/&/g, "&amp;")}"`));

console.log("\nSuccess page states");
const Outcome = unwrap<never>(await import("../components/ReportOutcome.tsx"));
const render = (state: ReportLoad) => renderToStaticMarkup(createElement(Outcome as never, { load: state, sessionId: SESSION_ID } as never));
const MAIL_ON = { OPENHELM_API_KEY: "ohk_FAKE", OPENHELM_MAIL_INBOX_ID: "inbox_FAKE" };
if (ready.state === "ready") {
  const withMail = withEnv(MAIL_ON, () => render(ready));
  check("ready: confirms payment and offers the PDF for this session", withMail.includes("Payment received. Your report is ready.") && withMail.includes(`/api/report/pdf?session_id=${SESSION_ID}`));
  check("ready: shows the report itself, from the engine", withMail.includes("This gravity wall works") && withMail.includes("Lateral earth pressure") && withMail.includes("IBC Table 1610.1"));
  check("ready: shows only a masked email, and only when email is on", withMail.includes("b***@example.com") && !withMail.includes(BUYER_EMAIL));
  const noMail = withEnv({ OPENHELM_API_KEY: undefined, OPENHELM_MAIL_INBOX_ID: undefined }, () => render(ready));
  check("ready: does not promise an email when email is off", !noMail.includes("email a copy") && !noMail.includes("b***@"));
}
check("waiting: says the payment is still clearing and offers a re-check", /still clearing/.test(render({ state: "waiting", why: "processing" })) && render({ state: "waiting", why: "processing" }).includes("Check again"));
check("waiting: never offers the PDF", !render({ state: "waiting", why: "processing" }).includes("/api/report/pdf"));
check("failed (expired): says no money was taken", /expired/.test(render({ state: "failed", why: "expired" })) && /No money was taken/.test(render({ state: "failed", why: "expired" })));
check("failed (not paid): says it was not paid", /was not paid/.test(render({ state: "failed", why: "not_paid" })));
check("invalid: says the report was not found, offers contact", /could not find that report/.test(render({ state: "invalid" })) && render({ state: "invalid" }).includes(SITE.contactEmail));
check("error: says Stripe could not be reached and offers a retry", /Could not confirm your payment/.test(render({ state: "error" })) && render({ state: "error" }).includes("Try again"));
check("no_wall: admits the payment went through and asks for the receipt", /Payment received, but the wall is missing/.test(render({ state: "no_wall" })) && render({ state: "no_wall" }).includes("Stripe receipt"));
check("unconfigured: says reports are off", /not switched on/.test(render({ state: "unconfigured" })));
for (const s of [{ state: "waiting", why: "open" }, { state: "failed", why: "not_paid" }, { state: "invalid" }, { state: "error" }, { state: "no_wall" }, { state: "unconfigured" }] as ReportLoad[]) {
  check(`${s.state}: no em dash anywhere in the copy`, !render(s).includes("\u2014"));
}

console.log("\nThe report page is private");
const pageMod = (await import("../app/report/page.tsx")) as { metadata?: { robots?: { index?: boolean } }; default?: { metadata?: { robots?: { index?: boolean } } } };
const robotsMeta = (pageMod.metadata ?? pageMod.default?.metadata)?.robots;
check("noindex, nofollow", robotsMeta?.index === false);
const sitemap = unwrap<() => { url: string }[]>(await import("../app/sitemap.ts"))();
check("not in the sitemap (a sitemap lists pages meant to be found)", !sitemap.some((u) => /\/report|\/api\//.test(u.url)));
check("pricing is still in the sitemap", sitemap.some((u) => u.url === `${SITE.url}/pricing`));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
