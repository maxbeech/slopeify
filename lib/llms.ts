import { SITE } from "@/lib/site";
import { CALCULATORS } from "@/lib/calculators";
import { POSTS } from "@/lib/posts";
import { STATES } from "@/lib/states";

// Generated from the same data the pages render, so llms.txt cannot drift from the site.
// Spec: https://llmstxt.org
export function buildLlmsTxt(): string {
  const link = (path: string) => `${SITE.url}${path}`;
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    `${SITE.name} is a free, browser-based retaining wall design tool. It computes lateral earth pressure (Rankine), minimum base width, overturning, sliding and bearing factors of safety, geogrid need, a materials takeoff with cost, and whether a permit is likely. It has no sign-up and no public API. Results are simplified planning estimates, not stamped engineering: walls over 4 ft or with a surcharge need an engineered design and a local permit.`,
    "",
    "## Core pages",
    "",
    `- [Wall designer](${link("/")}): design a wall and get factors of safety, geogrid check, takeoff and permit verdict`,
    `- [Calculators](${link("/calculators")}): cost, block count, base width and material-specific variants`,
    `- [Permits by state](${link("/states")}): frost depth, code reference and cost index for each state`,
    `- [Guides](${link("/blog")}): long-form retaining wall cost, permit and construction guides`,
    `- [Methodology](${link("/methodology")}): the code tables and formulas behind every number`,
    `- [Pricing](${link("/pricing")}): free calculator; one-time paid Pro design report`,
    `- [Find a pro](${link("/find-a-pro")}): find a retaining wall contractor or engineer near you`,
    "",
    "## Calculators",
    "",
    ...CALCULATORS.map((c) => `- [${c.title}](${link(`/calculators/${c.slug}`)}): ${c.description}`),
    "",
    "## Guides",
    "",
    ...POSTS.map((p) => `- [${p.title}](${link(`/blog/${p.slug}`)}): ${p.description}`),
    "",
    "## States",
    "",
    ...STATES.map((s) => `- [${s.name}](${link(`/states/${s.slug}`)}): frost depth ${s.frost} in, code ${s.code}`),
    "",
    "## Optional",
    "",
    `- [Sitemap](${link("/sitemap.xml")})`,
    `- [Privacy](${link("/privacy")})`,
    `- [Terms](${link("/terms")})`,
    `- Contact: ${SITE.contactEmail}`,
    "",
  ];
  return lines.join("\n");
}
