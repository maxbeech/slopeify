// Feedback control renders; capture helper degrades to the console without a DSN
// and never throws; the swallow sites call the helper.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { FeedbackButton } from "../components/FeedbackButton.tsx";
import { captureServerError, captureServerMessage } from "../lib/observability.ts";

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

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
