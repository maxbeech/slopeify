// Lead-gen + referral layer. This is the primary way the free tool earns:
// it matches proven demand instead of a manufactured upsell.
//
//   1) Materials affiliates - every free user gets a "shop this" link on each
//      line of the takeoff. Passive, zero-friction, and it maps 1:1 onto the
//      quantities we already compute. Retail block/geogrid/drain searches are
//      huge volume, so this monetises the whole free audience.
//   2) Pro referrals - the high-intent segment. A homeowner who just learned
//      their wall needs a permit or an engineered design is exactly who
//      contractor/engineer advertisers pay the most to reach. We hand them off
//      to a partner (or our own /find-a-pro landing) with the job pre-described.
//
// Everything is env-gated and degrades gracefully: with no affiliate tag the
// links are plain, honest retailer searches; with no partner URL the pro CTA
// points at our own /find-a-pro page. Nothing 500s, nothing dead-ends.

export const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG ?? "";
export const CONTRACTOR_PARTNER_URL = process.env.NEXT_PUBLIC_CONTRACTOR_PARTNER_URL ?? "";
export const ENGINEER_PARTNER_URL = process.env.NEXT_PUBLIC_ENGINEER_PARTNER_URL ?? "";

/** FTC-required affiliate disclosure, shown wherever shopping links appear. */
export const AFFILIATE_DISCLOSURE =
  "Some product links are affiliate links. If you buy through them we may earn a small commission, at no extra cost to you. It never changes the quantities or prices we calculate.";

/** Build an Amazon search URL, tagged when an associate ID is configured. */
export function amazonSearch(query: string): string {
  const u = new URL("https://www.amazon.com/s");
  u.searchParams.set("k", query);
  if (AMAZON_TAG) u.searchParams.set("tag", AMAZON_TAG);
  return u.toString();
}

/** A Home Depot keyword search (no public affiliate param; kept honest). */
export function homeDepotSearch(query: string): string {
  return `https://www.homedepot.com/s/${encodeURIComponent(query)}`;
}

// Map a takeoff line item to a clean retail search term. Falls back to the raw
// item text, so a new material never renders a broken or empty link.
const SEARCH_TERMS: { match: RegExp; term: string }[] = [
  { match: /cap block/i, term: "retaining wall cap blocks" },
  { match: /wall block/i, term: "retaining wall blocks" },
  { match: /adhesive/i, term: "masonry construction adhesive" },
  { match: /ready-mix|concrete/i, term: "ready mix concrete bags" },
  { match: /rebar|reinforcing steel/i, term: "rebar #4 reinforcing steel" },
  { match: /timber/i, term: "6x6 pressure treated timber" },
  { match: /boulder/i, term: "landscape boulders" },
  { match: /leveling pad|crushed-stone/i, term: "crushed stone paver base gravel" },
  { match: /drainage stone|clean/i, term: "3/4 clean drainage gravel" },
  { match: /drain pipe/i, term: "4 inch perforated drain pipe" },
  { match: /filter fabric/i, term: "landscape filter fabric non woven" },
  { match: /geogrid/i, term: "geogrid retaining wall reinforcement" },
];

export function searchTermForItem(item: string): string {
  return SEARCH_TERMS.find((s) => s.match.test(item))?.term ?? item;
}

export interface ShopLink {
  label: string;
  href: string;
}

/** Retailer links for a single material line. */
export function shopLinksForItem(item: string): ShopLink[] {
  const term = searchTermForItem(item);
  return [
    { label: "Home Depot", href: homeDepotSearch(term) },
    { label: "Amazon", href: amazonSearch(term) },
  ];
}

export type ProKind = "contractor" | "engineer";

export interface ProReferral {
  href: string;
  external: boolean; // true → partner/affiliate link, open in new tab
}

/**
 * Where the "hire a pro" CTA points. When a partner is configured we hand off
 * with the job context in the query string; otherwise we route to our own
 * /find-a-pro landing, which always works.
 */
export function proReferral(kind: ProKind, ctx: { stateSlug?: string; heightFt?: number } = {}): ProReferral {
  const partner = kind === "engineer" ? ENGINEER_PARTNER_URL : CONTRACTOR_PARTNER_URL;
  if (partner) {
    const u = new URL(partner);
    if (ctx.stateSlug) u.searchParams.set("state", ctx.stateSlug);
    if (ctx.heightFt) u.searchParams.set("height", String(ctx.heightFt));
    u.searchParams.set("job", "retaining-wall");
    return { href: u.toString(), external: true };
  }
  const q = new URLSearchParams({ need: kind });
  if (ctx.stateSlug) q.set("state", ctx.stateSlug);
  return { href: `/find-a-pro?${q.toString()}`, external: false };
}
