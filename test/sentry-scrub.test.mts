/* eslint-disable @typescript-eslint/no-explicit-any */
// Scrubber: secrets and personal data never leave, regexes stay linear-time, and
// a scrubber failure drops the payload instead of sending it raw.
import { scrubString, scrubValue, scrubEvent, scrubBreadcrumb, scrubTransaction, scrubLog, MAX_STRING } from "../lib/scrub.ts";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name} ${detail}`); }
}

const SECRETS = [
  "sk_live_abcdefghijkl1234", "pk_test_abcdefghijkl1234", "whsec_abcdefghijkl1234", "hlm_sk_abcdefghijkl1234",
  "sntrys_abcdefghijkl1234", "jane.doe@example.com", "+44 20 7946 0958", "555-123-4567",
  "Bearer abcdefghijklmnop1234", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijk",
];
console.log("Patterns");
for (const s of SECRETS) check(`masks ${s.slice(0, 12)}...`, !scrubString(`error for ${s} happened`).includes(s.slice(4)));
check("masks key=value secrets", !scrubString('password="hunter2hunter2" token=abc123def').match(/hunter2|abc123def/));
check("masks serialised JSON secrets", !scrubString('{"api_key":"zzzz9999yyyy"}').includes("zzzz9999yyyy"));

console.log("Values, breadcrumbs, logs, transactions");
const v = scrubValue({ authorization: "x", nested: { email: "a@b.com", ok: 3 }, url: "https://x.com/a?token=1#f" }) as any;
check("redacts sensitive keys", v.authorization === "[redacted]" && v.nested.email === "[redacted]" && v.nested.ok === 3);
check("strips url query", v.url === "https://x.com/a");
const crumb = scrubBreadcrumb({ message: "mail jane@example.com", data: { url: "/p?email=a@b.com", to: "/x?y=1" } })!;
check("breadcrumb message + data", !crumb.message!.includes("jane@") && crumb.data!.url === "/p" && crumb.data!.to === "/x");
const log = scrubLog({ level: "info", message: "hi jane@example.com", attributes: { secret: "s", count: 2 } } as any)!;
check("log message + attributes", !log.message.includes("jane@") && (log.attributes as any).secret === "[redacted]" && (log.attributes as any).count === 2);
const tx = scrubTransaction({
  type: "transaction", transaction: "GET /a?x=1", request: { url: "https://s.com/a?email=a@b.com" },
  spans: [{ description: "GET /b?q=1", data: { "http.url": "https://s.com/b?q=1", "url.query": "q=1" } }],
} as any)!;
check("transaction url + spans", tx.request!.url === "https://s.com/a" && tx.transaction === "GET /a"
  && (tx.spans![0] as any).data["http.url"] === "https://s.com/b" && (tx.spans![0] as any).data["url.query"] === "" && (tx.spans![0] as any).description === "GET /b");
const ev = scrubEvent({ message: "boom sk_live_abcdefghijkl1234", user: { id: "u1", email: "a@b.com" }, request: { url: "/a?b=1", cookies: { a: "b" } } } as any)!;
check("event scrubbed, user reduced to id", !ev.message!.includes("sk_live") && ev.user!.email === undefined && ev.user!.id === "u1" && ev.request!.url === "/a" && !ev.request!.cookies);
const fb = { type: "feedback", contexts: { feedback: { name: "Jo", contact_email: "jo@example.com", message: "hi" } } } as any;
check("feedback keeps name and email", scrubEvent(fb) === fb && fb.contexts.feedback.contact_email === "jo@example.com");

console.log("Fail closed");
const hostile = { get message() { throw new Error("boom"); } } as any;
check("event dropped on failure", scrubEvent({ extra: new Proxy({}, { ownKeys() { throw new Error("x"); } }) } as any) === null);
check("breadcrumb dropped on failure", scrubBreadcrumb({ data: new Proxy({}, { ownKeys() { throw new Error("x"); } }) } as any) === null);
check("log dropped on failure", scrubLog({ level: "info", message: "m", attributes: new Proxy({}, { ownKeys() { throw new Error("x"); } }) } as any) === null);
check("transaction dropped on failure", scrubTransaction({ type: "transaction", extra: new Proxy({}, { ownKeys() { throw new Error("x"); } }) } as any) === null);
void hostile;

console.log("Adversarial input (ReDoS)");
const nasty = [
  "a".repeat(200_000), "+1".repeat(100_000), ("Bearer " + "a".repeat(20)).repeat(5_000), "eyJ-".repeat(50_000),
  "a.".repeat(100_000) + "@", "password=" + "=".repeat(100_000), '"'.repeat(100_000), "sk_".repeat(100_000),
  "1 ".repeat(100_000) + "(", "token".repeat(50_000),
];
for (const [i, s] of nasty.entries()) {
  const t = Date.now();
  const out = scrubString(s);
  const ms = Date.now() - t;
  check(`adversarial #${i} fast (${ms}ms) and truncated`, ms < 500 && out.length <= MAX_STRING * 2, `${ms}ms len ${out.length}`);
}

const ev2 = scrubEvent({ logentry: { message: "x jane@example.com" }, transaction: "GET /a?x=1" } as any)!;
check("event logentry and transaction scrubbed", !ev2.logentry!.message!.includes("jane@") && ev2.transaction === "GET /a");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
