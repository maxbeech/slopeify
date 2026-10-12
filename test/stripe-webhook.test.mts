// Stripe webhook: signature on the raw body, event-id idempotency, retry-on-failure,
// ownership by price id, and that a purchase ends in exactly one email carrying the
// real PDF. Stripe and the mail provider are never contacted: global fetch is
// stubbed. Run: npm test
import { createHmac } from "node:crypto";
import {
  HANDLED_EVENTS, SIGNATURE_TOLERANCE_SECONDS, createEventStore, handleStripeWebhook, verifyStripeSignature,
  type WebhookDeps,
} from "../lib/stripe-webhook.ts";
import { emailClientId, emailReport, reportEmail, type DeliveryResult } from "../lib/report/deliver.ts";
import { loadReport } from "../lib/report/load.ts";
import { reportReference } from "../lib/report/purchase.ts";
import { SITE } from "../lib/site.ts";
import {
  BUYER_EMAIL, ENV_OK, SECRET_KEY, SESSION_ID, WALLS, WEBHOOK_SECRET, fakeStripe,
  fakeSession, json, pick, stubFetch, withEnv, type Call,
} from "./helpers/report-fixtures.mts";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name} ${detail}`); }
}
const quiet = async <T,>(run: () => Promise<T>): Promise<T> => {
  const w = console.warn, e = console.error;
  console.warn = () => {}; console.error = () => {};
  try { return await run(); } finally { console.warn = w; console.error = e; }
};

const NOW = 1_760_000_100;
const sign = (body: string, secret = WEBHOOK_SECRET, t = NOW) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
let n = 0;
const event = (type = "checkout.session.completed", sessionId = SESSION_ID, id = `evt_test_${++n}_${type.split(".").pop()}`) =>
  JSON.stringify({ id, object: "event", type, data: { object: { id: sessionId, object: "checkout.session" } } });
const evId = (body: string) => JSON.parse(body).id as string;

console.log("Signature: known answer from two other implementations (openssl and python)");
{
  // Same bytes the openssl and python vectors were computed with, assembled at runtime
  // so the repo holds no Stripe-shaped literal.
  const secret = fakeStripe("whsec", "VECTORSECRET0000000000");
  const payload = '{"id":"evt_1TestVector","type":"checkout.session.completed"}';
  const v1 = "824029e8da5303db6185ac5c421b17123d634203c110eefe5f655915e02667c0";
  const header = `t=1700000000,v1=${v1}`;
  const at = (over: object = {}) => ({ nowSeconds: 1700000100, ...over });
  check("matches the independently computed HMAC-SHA256", verifyStripeSignature(payload, header, secret, at()).ok === true);
  check("returns the signed timestamp", (verifyStripeSignature(payload, header, secret, at()) as { timestamp: number }).timestamp === 1700000000);
  check("one changed byte in the body fails", verifyStripeSignature(payload.replace("evt_1", "evt_2"), header, secret, at()).ok === false);
  check("re-serialised JSON (different whitespace) fails: the raw bytes are what is signed", verifyStripeSignature(JSON.stringify(JSON.parse(payload), null, 1), header, secret, at()).ok === false);
  check("a different secret fails", verifyStripeSignature(payload, header, fakeStripe("whsec", "OTHERSECRET00000000000"), at()).ok === false);
  check("the timestamp is bound into the signature", verifyStripeSignature(payload, `t=1700000001,v1=${v1}`, secret, at()).ok === false);
  check("the secret is used exactly as given, prefix included", verifyStripeSignature(payload, header, secret.replace("whsec_", ""), at()).ok === false);
  check(`accepts a ${SIGNATURE_TOLERANCE_SECONDS}s old timestamp`, verifyStripeSignature(payload, header, secret, at({ nowSeconds: 1700000000 + SIGNATURE_TOLERANCE_SECONDS })).ok === true);
  const stale = verifyStripeSignature(payload, header, secret, at({ nowSeconds: 1700000000 + SIGNATURE_TOLERANCE_SECONDS + 1 }));
  check("refuses a timestamp one second past the tolerance", !stale.ok && stale.reason === "stale");
  check("a timestamp slightly in the future is accepted (clock skew), as stripe-node does", verifyStripeSignature(payload, header, secret, at({ nowSeconds: 1699999990 })).ok === true);
  check("a stale timestamp with a bad signature reports the signature, not the age", (verifyStripeSignature(payload, `t=1,v1=${"0".repeat(64)}`, secret, at()) as { reason: string }).reason === "no_match");
  const reason = (h: string | null | undefined) => { const r = verifyStripeSignature(payload, h, secret, at()); return r.ok ? "ok" : r.reason; };
  check("no header", reason(null) === "missing_header" && reason("") === "missing_header" && reason(undefined) === "missing_header");
  check("header without a timestamp", reason(`v1=${v1}`) === "malformed_header");
  check("header without a v1 signature (v0 only is ignored)", reason("t=1700000000") === "malformed_header" && reason(`t=1700000000,v0=${v1}`) === "malformed_header");
  check("non-numeric timestamp", reason(`t=abc,v1=${v1}`) === "malformed_header");
  check("garbage header", reason("hello") === "malformed_header" && reason(",,,") === "malformed_header");
  check("a v1 of the wrong length or non-hex fails without throwing", reason("t=1700000000,v1=abc") === "no_match" && reason("t=1700000000,v1=zz" + "0".repeat(62)) === "no_match" && reason(`t=1700000000,v1=${v1}00`) === "no_match");
  check("rolled secret: any one of several v1 signatures may match", reason(`t=1700000000,v1=${"0".repeat(64)},v1=${v1}`) === "ok" && reason(`t=1700000000,v1=${v1},v1=${"0".repeat(64)}`) === "ok");
  check("upper-case hex is accepted", reason(`t=1700000000,v1=${v1.toUpperCase()}`) === "ok");
}

console.log("\nEvent store: claim, release, expiry");
{
  let t = 0;
  const store = createEventStore({ ttlMs: 1000, max: 3, now: () => t });
  check("first claim wins, second is refused", store.claim("a") === true && store.claim("a") === false);
  store.release("a");
  check("a released event can be claimed again (so Stripe's retry is processed)", store.claim("a") === true);
  check("different events are independent", store.claim("b") === true);
  t = 1001;
  check("a claim expires after the ttl", store.claim("a") === true && store.claim("b") === true);
  store.claim("c"); store.claim("d");
  check("memory is bounded: the oldest claim is evicted past the cap", store.claim("a") === true && store.claim("d") === false);
}

// ---- handler, with injected dependencies --------------------------------------------------
type Sent = { to: string; subject: string; markdown: string; clientId: string; filename: string; contentType: string; pdf: string };
function world(over: { session?: unknown; stripeStatus?: number; mail?: "ok" | "fail" | "disabled"; extra?: (c: Call) => Response | undefined } = {}) {
  const sent: Sent[] = [];
  const stub = stubFetch((c) => {
    if (c.url.startsWith("https://api.stripe.com/v1/checkout/sessions/")) return json(over.session ?? fakeSession(), over.stripeStatus ?? 200);
    if (c.url.startsWith("https://openhelm-worker.fly.dev/v1/inboxes/") && c.method === "POST") {
      const b = JSON.parse(c.body);
      sent.push({ to: b.to[0], subject: b.subject, markdown: b.body_markdown, clientId: b.client_id, filename: b.attachments[0].filename, contentType: b.attachments[0].content_type, pdf: Buffer.from(b.attachments[0].content_base64, "base64").subarray(0, 5).toString() });
      return over.mail === "fail" ? json({ error: "daily cap reached" }, 429) : json({ message_id: "msg_1", status: "sent" });
    }
    return over.extra?.(c);
  });
  // The mail sender reads process.env directly (lib/openhelm-mail.ts), so set it for the
  // life of this world and put it back with the fetch stub.
  const mailEnv = over.mail === "disabled" ? { OPENHELM_API_KEY: undefined, OPENHELM_MAIL_INBOX_ID: undefined } : { OPENHELM_API_KEY: "ohk_FAKE", OPENHELM_MAIL_INBOX_ID: "inbox_FAKE" };
  const before: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(mailEnv)) { before[k] = process.env[k]; if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  const env = { ...ENV_OK, ...mailEnv };
  const store = createEventStore();
  const run = (body: string, header: string | null = sign(body), deps: WebhookDeps = {}) =>
    quiet(() => handleStripeWebhook(body, header, { env, store, nowSeconds: () => NOW, ...deps }));
  const restore = () => { stub.restore(); for (const [k, v] of Object.entries(before)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } };
  return { sent, stub: { calls: stub.calls, restore }, run, store, env };
}

console.log("\nHandler: a paid purchase becomes one email with the PDF");
{
  const w = world();
  const body = event();
  const out = await w.run(body);
  check("200, delivered", out.status === 200 && out.body.received === true && out.body.delivered === true, JSON.stringify(out));
  check("Stripe was asked for the session (the event body is not trusted)", w.stub.calls.filter((c) => c.url.startsWith("https://api.stripe.com/")).length === 1 && w.stub.calls[0].url.includes("expand%5B%5D=line_items") && w.stub.calls[0].headers.authorization === `Bearer ${SECRET_KEY}`);
  check("exactly one email, to the buyer", w.sent.length === 1 && w.sent[0].to === BUYER_EMAIL);
  const m = w.sent[0];
  check("subject carries the report reference", m.subject === `Your Slopeify design report (${reportReference(SESSION_ID)})`, m.subject);
  check("the attachment is a real PDF named with the reference", m.pdf === "%PDF-" && m.contentType === "application/pdf" && m.filename === `slopeify-retaining-wall-report-${reportReference(SESSION_ID)}.pdf`, `${m.pdf} ${m.contentType} ${m.filename}`);
  check("idempotency key is the session id", m.clientId === emailClientId(SESSION_ID) && m.clientId === `slopeify-report-${SESSION_ID}`);
  check("body names the wall and the verdict and links back to the report", m.markdown.includes("Segmental block (SRW), 4 ft high") && m.markdown.includes("This gravity wall works") && m.markdown.includes(`${SITE.url}/report?session_id=${SESSION_ID}`));
  check("body says it is not a stamped design and gives the contact address", m.markdown.includes("not a stamped engineering design") && m.markdown.includes(SITE.contactEmail));
  check("body is plain: no em dash", !m.markdown.includes("\u2014"));
  check("response never contains a key, the webhook secret or the buyer's address", ![SECRET_KEY, WEBHOOK_SECRET, BUYER_EMAIL].some((s) => JSON.stringify(out).includes(s)));
  w.stub.restore();
}
{
  const w = world();
  check("handles the delayed-payment success event too", (HANDLED_EVENTS as readonly string[]).includes("checkout.session.async_payment_succeeded") && (HANDLED_EVENTS as readonly string[]).includes("checkout.session.completed") && HANDLED_EVENTS.length === 2);
  const out = await w.run(event("checkout.session.async_payment_succeeded"));
  check("async_payment_succeeded delivers", out.status === 200 && out.body.delivered === true && w.sent.length === 1);
  w.stub.restore();
}

console.log("\nHandler: idempotency");
{
  const w = world();
  const body = event();
  const first = await w.run(body);
  const second = await w.run(body);
  const third = await w.run(body);
  check("the same event id twice: second and third are acknowledged as duplicates", first.body.delivered === true && second.status === 200 && second.body.duplicate === true && third.body.duplicate === true);
  check("and only one email went out", w.sent.length === 1, String(w.sent.length));
  check("a duplicate does not even call Stripe again", w.stub.calls.filter((c) => c.url.startsWith("https://api.stripe.com/")).length === 1);
  w.stub.restore();
}
{
  const w = world();
  await w.run(event("checkout.session.completed", SESSION_ID, "evt_a"));
  await w.run(event("checkout.session.async_payment_succeeded", SESSION_ID, "evt_b"));
  check("two different events for one purchase use the same mail idempotency key (the provider drops the repeat)", w.sent.length === 2 && w.sent[0].clientId === w.sent[1].clientId);
  w.stub.restore();
}
{
  const w = world();
  const body = event();
  const both = await Promise.all([w.run(body), w.run(body)]);
  check("two simultaneous deliveries of one event: one works, one is a duplicate", both.filter((o) => o.body.delivered === true).length === 1 && both.filter((o) => o.body.duplicate === true).length === 1 && w.sent.length === 1, JSON.stringify(both.map((o) => o.body)));
  w.stub.restore();
}

console.log("\nHandler: failure returns 500 so Stripe retries, and the retry works");
{
  let ok = false;
  const w = world();
  const body = event();
  const deliver = async (): Promise<DeliveryResult> => (ok ? { ok: true, status: "sent" } : { ok: false, retry: true, reason: "send_failed", detail: "provider down" });
  const first = await w.run(body, sign(body), { deliver });
  check("mail provider failing: 500", first.status === 500 && first.body.received === false, JSON.stringify(first));
  ok = true;
  const retry = await w.run(body, sign(body), { deliver });
  check("Stripe's retry of the same event is processed, not swallowed as a duplicate", retry.status === 200 && retry.body.delivered === true && retry.body.duplicate === undefined, JSON.stringify(retry));
  w.stub.restore();
}
{
  const w = world({ mail: "fail" });
  const out = await w.run(event());
  check("provider rejects the send (real send path): 500", out.status === 500, JSON.stringify(out));
  w.stub.restore();
}
{
  const w = world({ mail: "disabled" });
  const body = event();
  const out = await w.run(body);
  check("email not configured: 500, so the buyer is not silently dropped", out.status === 500 && w.sent.length === 0, JSON.stringify(out));
  check("and the claim is released so the retry can succeed once email is configured", w.store.claim(evId(body)) === true);
  w.stub.restore();
}
{
  const w = world({ stripeStatus: 503, session: { error: {} } });
  const body = event();
  const out = await w.run(body);
  check("Stripe lookup failing: 500 and the claim is released", out.status === 500 && w.store.claim(evId(body)) === true && w.sent.length === 0);
  w.stub.restore();
}
{
  const w = world();
  const out = await w.run(event(), undefined, { deliver: async () => { throw new Error("boom"); } });
  check("an exception while delivering: 500 with no detail leaked", out.status === 500 && out.body.error === "handler_error" && !JSON.stringify(out).includes("boom"));
  w.stub.restore();
}
{
  const w = world();
  const out = await w.run(event(), undefined, { deliver: () => new Promise(() => {}), deliveryTimeoutMs: 20 });
  check("a delivery that hangs is cut off and answered 500 (Checkout waits only 10 s for this endpoint)", out.status === 500);
  w.stub.restore();
}

console.log("\nHandler: what is ignored (200, so Stripe stops sending it)");
{
  const w = world({ session: fakeSession({ line_items: { data: [{ price: { id: "price_1AnotherProduct" } }] } }) });
  const out = await w.run(event());
  check("a session for another product on a shared account: 200 not_ours, no email", out.status === 200 && out.body.ignored === "not_ours" && w.sent.length === 0);
  w.stub.restore();
}
{
  const w = world({ session: fakeSession({ mode: "subscription" }) });
  const out = await w.run(event());
  check("a subscription checkout: ignored", out.status === 200 && out.body.ignored === "not_ours" && w.sent.length === 0);
  w.stub.restore();
}
{
  const w = world({ session: { error: { message: "No such checkout.session" } }, stripeStatus: 404 });
  const out = await w.run(event());
  check("a session this account does not know (another account or mode): 200 ignored", out.status === 200 && out.body.ignored === "unknown_session" && w.sent.length === 0);
  w.stub.restore();
}
{
  const w = world({ session: fakeSession({ payment_status: "unpaid" }) });
  const early = await w.run(event("checkout.session.completed", SESSION_ID, "evt_early"));
  check("completed but not paid yet (bank debit): 200 pending, no email", early.status === 200 && early.body.pending === true && w.sent.length === 0, JSON.stringify(early));
  w.stub.restore();
  const w2 = world();
  const later = await w2.run(event("checkout.session.async_payment_succeeded", SESSION_ID, "evt_later"));
  check("when it clears, async_payment_succeeded delivers", later.body.delivered === true && w2.sent.length === 1);
  w2.stub.restore();
}
for (const [label, s] of [["expired", fakeSession({ payment_status: "unpaid", status: "expired" })], ["no_payment_required", fakeSession({ payment_status: "no_payment_required" })]] as const) {
  const w = world({ session: s });
  const out = await w.run(event());
  check(`${label}: nothing to deliver`, out.status === 200 && w.sent.length === 0);
  w.stub.restore();
}
{
  const w = world();
  for (const type of ["payment_intent.succeeded", "checkout.session.expired", "checkout.session.async_payment_failed", "charge.refunded", "customer.subscription.updated"]) {
    const out = await w.run(event(type));
    check(`${type}: 200 ignored, and Stripe is not called`, out.status === 200 && out.body.ignored === "event_type");
  }
  check("no calls were made for any of them", w.stub.calls.length === 0 && w.sent.length === 0);
  w.stub.restore();
}
{
  const w = world();
  const out = await w.run(event("checkout.session.completed", "cs_test_short"));
  check("a malformed session id in the event: 200 ignored, Stripe is not called", out.status === 200 && out.body.ignored === "not_a_checkout_session" && w.stub.calls.length === 0);
  w.stub.restore();
}
{
  const w = world({ session: fakeSession({ metadata: {} }) });
  const out = await w.run(event());
  check("paid and ours but no wall: 200 (a retry cannot fix it), reported, no email", out.status === 200 && out.body.fulfilled === false && out.body.reason === "no_wall" && w.sent.length === 0);
  w.stub.restore();
}
{
  const w = world({ session: fakeSession({ customer_details: null }) });
  const out = await w.run(event());
  check("paid but no email address: 200 (a retry cannot produce one), reported, no email", out.status === 200 && out.body.fulfilled === false && out.body.reason === "no_email" && w.sent.length === 0);
  w.stub.restore();
}

console.log("\nHandler: refused before anything happens");
{
  const w = world();
  const body = event();
  const bad = await w.run(body, sign(body, fakeStripe("whsec", "NOTTHESECRET000000000000")));
  check("wrong signature: 400", bad.status === 400 && bad.body.error === "invalid_signature");
  check("no header: 400", (await w.run(body, null)).status === 400);
  check("stale timestamp: 400", (await w.run(body, sign(body, WEBHOOK_SECRET, NOW - SIGNATURE_TOLERANCE_SECONDS - 5))).status === 400);
  check("an event altered after signing: 400", (await w.run(body.replace("evt_test", "evt_evil"), sign(body))).status === 400);
  check("refusals do not reveal why, and do not touch Stripe, the mail provider or the store", !JSON.stringify(bad).includes("no_match") && w.stub.calls.length === 0 && w.sent.length === 0 && w.store.claim(evId(body)) === true);
  const junk = "{not json";
  check("a validly signed body that is not JSON: 400", (await w.run(junk, sign(junk))).status === 400);
  const noId = JSON.stringify({ type: "checkout.session.completed" });
  check("a validly signed body with no event id: 400", (await w.run(noId, sign(noId))).status === 400);
  w.stub.restore();
}
for (const [label, env] of [
  ["no webhook secret", { ...ENV_OK, STRIPE_WEBHOOK_SECRET: undefined }],
  ["no price id", { ...ENV_OK, STRIPE_PRICE_ID: undefined }],
  ["no secret key", { ...ENV_OK, STRIPE_SECRET_KEY: undefined }],
] as const) {
  const w = world();
  const body = event();
  const out = await quiet(() => handleStripeWebhook(body, sign(body), { env, store: createEventStore(), nowSeconds: () => NOW }));
  check(`${label}: 503 (Stripe keeps retrying until it is set), nothing sent`, out.status === 503 && w.stub.calls.length === 0);
  w.stub.restore();
}

console.log("\nEmail delivery on its own");
{
  const w = world();
  const loaded = await withEnv(ENV_OK, () => loadReport(SESSION_ID));
  if (loaded.state === "ready") {
    const noAddr = await emailReport({ ...loaded, email: null }, { enabled: () => true, send: async () => { throw new Error("must not send"); } });
    check("no address: reported as not worth retrying", !noAddr.ok && noAddr.reason === "no_email" && noAddr.retry === false);
    const off = await emailReport(loaded, { enabled: () => false, send: async () => { throw new Error("must not send"); } });
    check("email not configured: reported as worth retrying", !off.ok && off.reason === "not_configured" && off.retry === true);
    const bad = await emailReport(loaded, { enabled: () => true, send: async () => ({ sent: false, reason: "error", error: "x" }) });
    check("provider error: worth retrying", !bad.ok && bad.reason === "send_failed" && bad.retry === true);
    const good = await emailReport(loaded, { enabled: () => true, send: async () => ({ sent: true, id: "m", status: "sent", threadId: null, replyTo: null, suppressed: [] }) });
    check("success carries the provider status", good.ok === true && good.status === "sent");
    const mail = reportEmail(loaded);
    check("email text is short and plain", mail.markdown!.split(/\s+/).length < 140 && !mail.markdown!.includes("\u2014"), String(mail.markdown!.split(/\s+/).length));
    check("the hard-case wall gets its own verdict in the email", reportEmail((await (async () => { const s2 = world({ session: fakeSession({}, WALLS.tallWeak) }); try { return await withEnv(ENV_OK, () => loadReport(SESSION_ID)); } finally { s2.stub.restore(); } })()) as never).markdown!.includes("Needs geogrid reinforcement"));
  } else check("loaded a ready report for the email checks", false, loaded.state);
  w.stub.restore();
}

console.log("\nPOST /api/stripe/webhook (the real route, raw body)");
{
  const mod = await import("../app/api/stripe/webhook/route.ts");
  const { POST } = pick(mod, "POST");
  const route = (body: string, header: string | null) =>
    (POST as (r: Request) => Promise<Response>)(new Request("http://localhost/api/stripe/webhook", { method: "POST", body, headers: header ? { "stripe-signature": header, "content-type": "application/json" } : { "content-type": "application/json" } }));
  const w = world();
  // The route uses the real clock, so sign with it.
  const live = () => Math.floor(Date.now() / 1000);
  const body = event();
  const res = await quiet(() => withEnv(w.env, () => route(body, sign(body, WEBHOOK_SECRET, live()))));
  const out = await res.json();
  check("signed, paid: 200 delivered, through the real route", res.status === 200 && out.delivered === true && w.sent.length === 1, JSON.stringify(out));
  check("the PDF that was mailed is a PDF", w.sent[0]?.pdf === "%PDF-");
  const again = await quiet(() => withEnv(w.env, () => route(body, sign(body, WEBHOOK_SECRET, live()))));
  check("the same event sent again: 200 duplicate, still one email", again.status === 200 && (await again.json()).duplicate === true && w.sent.length === 1);
  const unsigned = await quiet(() => withEnv(w.env, () => route(event(), null)));
  check("no signature header: 400", unsigned.status === 400);
  const wrong = await quiet(() => withEnv(w.env, () => route(event(), sign("{}", WEBHOOK_SECRET, live()))));
  check("signature for a different body: 400", wrong.status === 400);
  check("route declares the Node runtime (node:crypto) and is not cached", /runtime = "nodejs"/.test((await import("node:fs")).readFileSync("app/api/stripe/webhook/route.ts", "utf8")) && /force-dynamic/.test((await import("node:fs")).readFileSync("app/api/stripe/webhook/route.ts", "utf8")));
  check("route has no GET (Stripe only POSTs)", pick(mod, "GET").GET === undefined);
  w.stub.restore();
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
