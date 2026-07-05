// Verifies the lead-gen / referral layer: retail search links are well-formed,
// material items map to sensible search terms, and the pro CTA always resolves
// to a working link (internal fallback when no partner is configured).
import {
  amazonSearch,
  homeDepotSearch,
  searchTermForItem,
  shopLinksForItem,
  proReferral,
} from "../lib/leadgen.ts";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name} ${detail}`); }
}

console.log("Retail search URLs");
const az = amazonSearch("retaining wall blocks");
check("amazon search is a valid amazon URL", az.startsWith("https://www.amazon.com/s?"));
check("amazon search encodes the query", az.includes("k=retaining+wall+blocks"));
// With no NEXT_PUBLIC_AMAZON_TAG set in the test env, no tag param is emitted.
check("no affiliate tag when unconfigured", !az.includes("tag="));
check("home depot search encodes the query", homeDepotSearch("drain pipe").includes("drain%20pipe"));

console.log("\nMaterial -> search term mapping");
check("wall blocks map to a blocks search", searchTermForItem("Retaining wall blocks") === "retaining wall blocks");
check("cap blocks map to caps (more specific wins)", searchTermForItem("Cap blocks") === "retaining wall cap blocks");
check("geogrid maps to a geogrid search", searchTermForItem("Geogrid reinforcement").includes("geogrid"));
check("drain pipe maps to perforated pipe", searchTermForItem("Perforated drain pipe (4\")").includes("perforated"));
check("unknown item falls back to itself", searchTermForItem("Mystery widget") === "Mystery widget");

console.log("\nShop links per line");
const links = shopLinksForItem("Retaining wall blocks");
check("two retailers per line", links.length === 2);
check("every shop link has an http href", links.every((l) => l.href.startsWith("http")));
check("every shop link has a label", links.every((l) => l.label.length > 0));

console.log("\nPro referral resolves without a partner (internal fallback)");
const contractor = proReferral("contractor", { stateSlug: "texas", heightFt: 6 });
check("contractor CTA is internal when no partner set", !contractor.external);
check("internal contractor CTA points at /find-a-pro", contractor.href.startsWith("/find-a-pro?"));
check("internal CTA carries the need", contractor.href.includes("need=contractor"));
check("internal CTA carries the state", contractor.href.includes("state=texas"));
const engineer = proReferral("engineer");
check("engineer CTA resolves with no context", engineer.href.startsWith("/find-a-pro?need=engineer"));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
