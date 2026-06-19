export const SITE = {
  name: "RetainCalc HQ",
  domain: "retaincalchq.com",
  url: "https://retaincalchq.com",
  tagline: "Free retaining wall design, cost & permit calculator",
  description:
    "Free retaining wall calculator — get the lateral earth pressure, the minimum base width, the overturning / sliding / bearing factors of safety, whether you need geogrid reinforcement, a materials takeoff with cost, and whether your wall needs a permit. Built on IBC Table 1610.1 soil loads and Table 1806.2 bearing values.",
  // Where the live preview lives until the .com DNS is wired.
  vercelUrl: "https://retaincalchq.vercel.app",
  contactEmail: "hello@retaincalchq.com",
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
