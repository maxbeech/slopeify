// Feedback control renders; capture helper degrades to the console without a DSN
// and never throws; the swallow sites call the helper.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { FeedbackButton, openFeedbackForm } from "../components/FeedbackButton.tsx";
import { captureServerError, captureServerMessage, safeContext } from "../lib/observability.ts";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name} ${detail}`); }
}

console.log("Feedback button");
check("link variant renders label", renderToStaticMarkup(createElement(FeedbackButton)).includes("Send feedback"));
check("pill variant renders a button", /<button[^>]*type="button"/.test(renderToStaticMarkup(createElement(FeedbackButton, { variant: "pill" }))));

console.log("Capture helper without DSN");
delete process.env.SENTRY_DSN; delete process.env.NEXT_PUBLIC_SENTRY_DSN;
const logged: string[] = [];
const origErr = console.error, origWarn = console.warn;
console.error = (...a: unknown[]) => { logged.push(String(a[0])); };
console.warn = (...a: unknown[]) => { logged.push(String(a[0])); };
captureServerError(new Error("x"), { scope: "t1" });
captureServerMessage("m", { scope: "t2" });
console.error = origErr; console.warn = origWarn;
check("falls back to console, no throw", logged.includes("[t1]") && logged.includes("[t2]"), logged.join());

console.log("Swallow sites report");
for (const f of ["app/api/checkout/route.ts", "app/api/checkout/status/route.ts", "components/CheckoutButton.tsx", "components/CheckoutReturnTracker.tsx", "app/error.tsx", "app/global-error.tsx"]) {
  check(`${f} reports to Sentry`, /captureServerError|captureServerMessage|captureException/.test(readFileSync(f, "utf8")));
}
const layout = readFileSync("app/layout.tsx", "utf8");
check("layout has header and footer feedback controls", (layout.match(/<FeedbackButton/g) ?? []).length === 2);

console.log("Opening the form and ids-only context");
const calls: string[] = [];
const sdk = (has: boolean) => ({
  setUser: (u: { email?: string }) => calls.push(`user:${u.email}`),
  getFeedback: () => (has ? { createForm: async () => ({ appendToDom: () => calls.push("append"), open: () => calls.push("open") }) } : undefined),
});
check("opens the form and pre-fills a known user", (await openFeedbackForm(async () => sdk(true), { email: "a@b.co" })) === true && calls.join() === "user:a@b.co,append,open", calls.join());
check("reports unavailable without a DSN", (await openFeedbackForm(async () => sdk(false))) === false);
const safe = safeContext({ scope: "x", httpStatus: 502, flag: true, email: "a@b.co", body: "free text here", id: "cs_123" });
check("context keeps ids and drops free text", JSON.stringify(safe) === JSON.stringify({ scope: "x", httpStatus: 502, flag: true, id: "cs_123" }), JSON.stringify(safe));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
