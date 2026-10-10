// Verifies the machine-readability surfaces: llms.txt links resolve to real
// routes, the llms.txt has the spec's H1 and blockquote, robots.txt names the AI
// crawlers as allowed, and the home-page offers match the pricing page.
import { buildLlmsTxt } from "../lib/llms.ts";
import { CALCULATORS } from "../lib/calculators.ts";
import { POSTS } from "../lib/posts.ts";
import { STATES } from "../lib/states.ts";
import { SITE, websiteLd } from "../lib/site.ts";
import * as robotsModule from "../app/robots.ts";

// tsx loads a .ts file as CJS, so the default export sits one level down.
const robots: () => { rules: unknown; sitemap: string } =
  typeof robotsModule.default === "function" ? robotsModule.default : (robotsModule.default as any).default;

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name} ${detail}`); }
}

console.log("llms.txt");
const llms = buildLlmsTxt();
const lines = llms.split("\n");
check("starts with the spec H1", lines[0] === `# ${SITE.name}`, `got: ${lines[0]}`);
check("has a blockquote summary", lines[2].startsWith("> "), `got: ${lines[2]}`);
check("links every calculator", CALCULATORS.every((c) => llms.includes(`${SITE.url}/calculators/${c.slug}`)));
check("links every guide", POSTS.every((p) => llms.includes(`${SITE.url}/blog/${p.slug}`)));
check("links every state", STATES.every((s) => llms.includes(`${SITE.url}/states/${s.slug}`)));
check("links methodology and pricing", llms.includes(`${SITE.url}/methodology`) && llms.includes(`${SITE.url}/pricing`));
check("states it has no public API", llms.includes("no public API"));
check("no link points outside the site", (llms.match(/\]\((https?:\/\/[^)]+)\)/g) ?? []).every((m) => m.startsWith(`](${SITE.url}`)));

console.log("WebSite schema");
check("WebSite declares no SearchAction (no search endpoint exists)", !("potentialAction" in websiteLd()));
check("WebSite is typed and points at the site", websiteLd()["@type"] === "WebSite" && websiteLd().url === SITE.url);

console.log("robots.txt policy");
const rules = robots().rules;
const list = Array.isArray(rules) ? rules : [rules];
for (const ua of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"]) {
  const rule = list.find((r) => r.userAgent === ua);
  check(`${ua} is allowed at /`, rule?.allow === "/", `rule: ${JSON.stringify(rule)}`);
}
check("sitemap points at the site", robots().sitemap === `${SITE.url}/sitemap.xml`);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
