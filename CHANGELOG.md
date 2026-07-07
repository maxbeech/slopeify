# Changelog

## 2026-07-07

### Added: go-live readiness (legal + analytics)
- `/privacy` and `/terms` pages, written for what the site actually does (client-side
  calculator, affiliate/referral links, Stripe checkout, no accounts) rather than generic
  boilerplate. Linked from the footer and added to the sitemap.
- Vercel Web Analytics (`@vercel/analytics`) wired into the root layout so traffic is
  measurable once deployed (cookieless, no account setup beyond enabling it on the Vercel
  project).
- Audited the checkout flow: `app/api/checkout/route.ts` creates a Stripe session but has
  no webhook/fulfillment yet. Decision: keep the Pro report on its existing "launches
  shortly" graceful-degrade path until fulfillment (PDF generation + email delivery) is
  built, rather than risk an unfulfilled paid order.

## 2026-07-05

### Changed: rebrand to Slopeify
- Renamed the product from "RetainCalc HQ" to "Slopeify" across the site: header/footer
  wordmark, OG/Twitter share images, page copy, `lib/site.ts` (single source of truth
  for name/domain/description), metadata, and JSON-LD.
- Domain moved to `slopeify.com` (from `retaincalchq.com`); contact email updated to
  `hello@slopeify.com`; Vercel preview fallback updated to `slopeify.vercel.app`.
- `package.json` project name updated to `slopeify`; GitHub repo and local project
  directory renamed to match.
- Checkout route (`app/api/checkout/route.ts`) now imports the site URL/email from
  `SITE` instead of duplicating literals, so there's one place to update next time.

## 2026-07-04

### Added: lead-gen and referral layer (primary monetization)
- `lib/leadgen.ts`: env-gated materials affiliates (Home Depot / Amazon, tagged
  when an associate ID is set) plus contractor and engineer referral routing.
- Per-material "Buy" links on the cost takeoff, with an FTC affiliate disclosure.
- `components/FindAPro.tsx`: context-aware "hire a pro" block on every result
  (leads with an engineer when the wall needs a stamped design, a contractor
  otherwise).
- `/find-a-pro` landing: internal referral fallback and an SEO page targeting
  "retaining wall contractor / engineer near you", state-aware via `?state=`.
- Lead-gen CTAs added to state pages, guides and pricing.
- Tests: `test/leadgen.test.mts` covers search URLs, item mapping and CTA fallback.

### Changed: premium redesign, de-AI pass
- New warm design system in `globals.css`: warm paper neutrals (override of the
  cold slate scale), a deep pine brand (override of emerald), a clay accent for
  the high-intent pro CTA, tabular figures and a blueprint hero motif.
- New stacked-block logo mark (header, footer, favicon, OG/Twitter cards),
  replacing the generic "R" tile.
- Rewrote the hero, pricing, find-a-pro, 404 and index pages for a more
  deliberate, editorial feel.
- Removed em/en dashes and comma-splice AI tells across all user-facing copy.

### Fixed
- Canonical URLs: index pages (`/calculators`, `/states`, `/blog`, `/methodology`,
  `/pricing`) were inheriting the layout's `canonical: "/"`, pointing every page
  at the home page. Each now sets its own canonical.
- Calculator: "Copy share link" now confirms with "Link copied"; clearing a
  numeric field no longer jams it to 0 (shows empty while editing), and the URL
  encoder clamps transient NaN so a mid-edit field never writes a junk param.
- Pro checkout button recolored to the brand and dashes removed.

### SEO / GEO
- Organization + WebSite (with SearchAction) JSON-LD sitewide.
- Article schema enriched (dateModified, author URL, mainEntityOfPage) and HowTo
  schema emitted for step-by-step guides.
- `/find-a-pro` added to the sitemap; "Updated" dates shown on guides.
