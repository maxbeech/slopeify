export const SITE = {
  name: "Slopeify",
  domain: "slopeify.com",
  url: "https://slopeify.com",
  tagline: "Retaining wall design, cost and permit calculator",
  description:
    "Free retaining wall calculator. Get the lateral earth pressure, the minimum base width, the overturning, sliding and bearing factors of safety, whether you need geogrid reinforcement, a materials takeoff with cost, and whether your wall needs a permit. Built on IBC Table 1610.1 soil loads and Table 1806.2 bearing values.",
  // Where the live preview lives until the .com DNS is wired.
  vercelUrl: "https://slopeify.vercel.app",
  contactEmail: "hello@slopeify.com",
};

/** BreadcrumbList JSON-LD from [name, path] pairs (single source of truth). */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE.url}${it.path}`,
    })),
  };
}

/** Organization schema - an E-E-A-T / brand signal for search and AI engines. */
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    email: SITE.contactEmail,
    description: SITE.description,
    knowsAbout: [
      "retaining wall design",
      "lateral earth pressure",
      "IBC 1610.1",
      "IBC 1806.2",
      "geogrid reinforcement",
      "retaining wall permits",
    ],
  };
}

/** WebSite schema with a sitewide search action. */
export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.url}/calculators?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
