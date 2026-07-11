# Slopeify

Free retaining wall **design, cost & permit** calculator — `slopeify.com`.

Enter a wall and get the lateral earth pressure, the minimum stable base width, the
overturning / sliding / bearing factors of safety, whether you need geogrid
reinforcement, a full materials takeoff with cost, and whether the wall needs a
permit. Built on **real engineering**, not guesswork.

## How it works (no fabricated numbers)

- **Lateral earth pressure** — IBC Table 1610.1 design lateral soil loads
  (equivalent-fluid pressure), increased for slope and surcharge via Rankine theory.
- **Presumptive bearing** — IBC Table 1806.2 (verbatim).
- **Stability** — classical overturning (FS ≥ 2.0), sliding (FS ≥ 1.5) and bearing
  checks; a solver finds the minimum base width that passes all three.
- **Reinforcement** — flags when a gravity wall can't pass and estimates geogrid
  layers/length (NCMA practice).
- **Footing depth** — minimum base depth below the frost line (IRC R403.1.4 /
  IBC §1809.5) from a per-state frost table.
- **Materials & cost** — a full takeoff with the primary material for every wall
  type (blocks / ready-mix concrete + rebar / timbers / boulders), drainage, and a
  selectable SRW block size, scaled by a per-state cost index.
- **Permit** — the 4-ft rule (IRC R404.1 / IBC §1807.2) plus the surcharge exception.

Everything is documented on `/methodology` with the code tables reproduced.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · tsx tests · Vercel Web
Analytics. The free calculator is 100% client-side (no DB).

## How it earns (lead-gen first)

The calculator is free forever. Revenue comes from matching real demand, not an
upsell wall:

- **Materials affiliates.** Every takeoff line gets Home Depot / Amazon shop
  links, tagged when an associate ID is set. See `lib/leadgen.ts`.
- **Pro referrals.** In-context "hire a pro" CTAs route homeowners to a local
  contractor or licensed engineer (the highest-intent segment). `/find-a-pro` is
  both the internal fallback and an SEO landing for "contractor near me".
- **Pro design report.** A one-time $29 PDF for people who need a document for a
  permit or client, via env-gated Stripe checkout.

Everything is env-gated and degrades gracefully. With nothing configured, shop
links are plain retailer searches and the pro CTA points at `/find-a-pro`.

> **Known gap:** `app/api/checkout/route.ts` will happily create a Stripe session once
> `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID` are set, but there is no webhook and no PDF
> generation/email delivery yet. Do not set those two env vars in production until
> fulfillment is built, or a customer will pay $29 and receive nothing.

### Environment variables (all optional)

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_AMAZON_TAG` | Amazon associate tag appended to shop links |
| `NEXT_PUBLIC_CONTRACTOR_PARTNER_URL` | Partner/affiliate URL for contractor matching |
| `NEXT_PUBLIC_ENGINEER_PARTNER_URL` | Partner/affiliate URL for engineer matching |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` | Pro design-report checkout |
| `NEXT_PUBLIC_SITE_URL` | Base URL for Stripe success/cancel redirects |

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # engine + share-URL + lead-gen tests
npm run lint
npm run build
```

## SEO surface

- Home wall designer + 7 calculator variants (`/calculators/*`)
- 51 per-state permit & cost pages (`/states/*`)
- `/find-a-pro` contractor/engineer landing
- 24 in-depth guides (`/blog/*`), 1,800-2,500 words each, with Article + HowTo + FAQPage
  JSON-LD, a table of contents, key-takeaways box, data tables, and cited external sources
- `/methodology`, `/pricing`, `/privacy`, `/terms`, sitemap, robots, Organization +
  WebSite JSON-LD, 1-week ISR

> Planning tool only. A wall over 4 ft, or any wall with a surcharge, needs a
> licensed engineer's stamped design and a local permit.

## Launch checklist

Code, tests and build are launch-ready. What's left is account/dashboard work that has
to happen outside this repo:

1. **Attach `slopeify.com`** in the Vercel dashboard (Project → Settings → Domains),
   then add the CNAME/A record it gives you at your registrar.
2. **Verify the domain in Google Search Console** (domain property, via DNS TXT record)
   once step 1 is done, then submit `/sitemap.xml`.
3. **Enable Vercel Web Analytics** for the project (Project → Analytics tab — the
   `@vercel/analytics` package is already wired in, this just turns data collection on).
4. **Set env vars in Vercel** (Project → Settings → Environment Variables) as you get
   each account: `NEXT_PUBLIC_AMAZON_TAG`, `NEXT_PUBLIC_CONTRACTOR_PARTNER_URL`,
   `NEXT_PUBLIC_ENGINEER_PARTNER_URL`, `NEXT_PUBLIC_SITE_URL` (`https://slopeify.com`
   once step 1 lands). Leave `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID` unset until
   fulfillment is built (see the known gap above).
5. **Apply to affiliate/referral programs** at your own pace: Amazon Associates (for
   `NEXT_PUBLIC_AMAZON_TAG`), and a contractor/engineer lead network for the
   `*_PARTNER_URL` vars. Until those exist, shop links are plain retailer searches and
   `/find-a-pro` is a self-contained SEO landing page with an email fallback — both
   already live and functional with zero config.
