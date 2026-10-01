// OpenHelm journey analytics: user ref hashing, plan derivation, checkout
// confirmation shape and the status route (Stripe is stubbed, nothing leaves the process).
import { userRefFor } from "../lib/openhelm-analytics-mp.ts";
import { checkoutStatusFrom, isSessionId, planForPayment } from "../lib/analytics-journey.ts";
import { GET } from "../app/api/checkout/status/route.ts";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name} ${detail}`); }
}

console.log("User ref");
check("pinned test vector", (await userRefFor("00000000-0000-0000-0000-000000000000")) === "12b9377cbe7e5c94");
check("16 lowercase hex chars", /^[0-9a-f]{16}$/.test(await userRefFor("cs_test_abcdefghij")));

console.log("\nPlan");
check("paid only when Stripe says paid", planForPayment("paid") === "paid");
check("unpaid is not paid", planForPayment("unpaid") !== "paid" && planForPayment(undefined) !== "paid");

console.log("\nCheckout status shape");
const ok = checkoutStatusFrom({ id: "cs_test_abcdefghij", payment_status: "paid", currency: "usd", amount_total: 2900 }, "abc");
check("paid session maps to value, currency and ref", ok.paid && ok.value === 29 && ok.currency === "USD" && ok.userRef === "abc" && ok.transactionId === "cs_test_abcdefghij");
check("unpaid session is not paid", !checkoutStatusFrom({ id: "cs_test_abcdefghij", payment_status: "unpaid" }, "abc").paid);
check("null session is not paid", !checkoutStatusFrom(null, null).paid);
check("no email or raw id fields leak", !("email" in ok) && Object.keys(ok).sort().join() === "currency,paid,transactionId,userRef,value");
check("session id format", isSessionId("cs_live_abcdefghij12") && !isSessionId("../etc") && !isSessionId(null));

console.log("\nStatus route");
const realFetch = globalThis.fetch;
process.env.STRIPE_SECRET_KEY = "sk_test_x";
const sid = "cs_test_abcdefghij12";
let called = 0;
globalThis.fetch = (async () => { called++; return new Response(JSON.stringify({ id: sid, payment_status: "paid", currency: "usd", amount_total: 2900 }), { status: 200 }); }) as typeof fetch;
const good = await (await GET(new Request(`http://x/api/checkout/status?session_id=${sid}`))).json();
check("paid session returns hashed ref", good.paid === true && good.userRef === (await userRefFor(sid)) && good.value === 29);
const bad = await GET(new Request("http://x/api/checkout/status?session_id=nope"));
check("bad id is rejected without calling Stripe", bad.status === 400 && called === 1);
globalThis.fetch = (async () => new Response("{}", { status: 404 })) as typeof fetch;
const missing = await GET(new Request(`http://x/api/checkout/status?session_id=${sid}`));
check("Stripe error is not reported as paid", missing.status === 502 && (await missing.json()).paid === false);
globalThis.fetch = realFetch;

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
