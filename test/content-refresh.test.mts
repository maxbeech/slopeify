// Regression checks for the 2026-10-21 content refresh: the permit guide no longer
// carries the unattributed quote or the unsupported county claim, the surcharge
// wording matches the model-code exemption, the retaining-wall section cited is
// R404.4 (not R404.1), and Georgia carries its state-specific adoption note.
import { readFileSync } from "node:fs";
import { postBySlug } from "../lib/posts.ts";
import { stateBySlug } from "../lib/states.ts";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name} ${detail}`); }
}

const root = new URL("..", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), "utf8");

console.log("permit guide");
const permit = postBySlug("retaining-wall-permit-guide");
const permitBody = permit?.body ?? "";
check("post exists", permit !== undefined);
check("dated 2026-10-21 after the refresh", permit?.date === "2026-10-21", `got: ${permit?.date}`);
check("unattributed 'engineering advisors' quote removed", !permitBody.includes("engineering advisors"));
check("unsupported Montgomery County citation removed", !permitBody.includes("montgomerycountymd.gov"));
check("no 'regardless of height' surcharge-engineering claim", !permitBody.includes("must be engineered regardless of height"));
check("states the 4 ft no-surcharge exemption", permitBody.includes("4 ft or less") && permitBody.includes("no surcharge"));
check("cites the Port Townsend IRC guidance", permitBody.includes("cityofpt.us"));

console.log("methodology");
const methodology = read("app/methodology/page.tsx");
check("no IRC R404.1 retaining-wall citation", !methodology.includes("R404.1"), "found R404.1");
check("cites IRC R404.4 and IBC 1807.2", methodology.includes("R404.4") && methodology.includes("1807.2"));

console.log("state template and Georgia");
const stateTemplate = read("app/states/[slug]/page.tsx");
check("state template cites R404.4, not R404.1", stateTemplate.includes("R404.4") && !stateTemplate.includes("R404.1"));
check("state template renders the optional note", stateTemplate.includes("s.note"));
const georgia = stateBySlug("georgia");
check("Georgia code string names the 2018 IBC/IRC", georgia?.code === "2018 IBC/IRC with Georgia amendments (DCA)", `got: ${georgia?.code}`);
check("Georgia has the state-specific adoption note", !!georgia?.note && georgia.note.includes("1 January 2020"), `got: ${georgia?.note}`);
check("other states have no note", stateBySlug("texas")?.note === undefined);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
