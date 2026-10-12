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

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · tsx tests · hosted on Helm7
(`next start`, honours `$PORT`). The free calculator is 100% client-side (no DB). The paid report keeps no database either: the buyer's wall rides on the Stripe Checkout Session.

## How it earns (lead-gen first)

The calculator is free forever. Revenue comes from matching real demand, not an
upsell wall:

- **Materials affiliates.** Every takeoff line gets Home Depot / Amazon shop
  links, tagged when an associate ID is set. See `lib/leadgen.ts`.
- **Pro referrals.** In-context "hire a pro" CTAs route homeowners to a local
  contractor or licensed engineer (the highest-intent segment). `/find-a-pro` is
  both the internal fallback and an SEO landing for "contractor near me".
- **Pro design report.** A one-time $29 PDF for people who need a document for a
  permit or client. Built from the wall the buyer designed, shown on screen, offered as
  a download and emailed. Stripe checkout is off until it is fully configured.

Everything is env-gated and degrades gracefully. With nothing configured, shop
links are plain retailer searches and the pro CTA points at `/find-a-pro`.

### Pro report: how a purchase works

1. In the calculator, **Get the Pro design report for this wall** opens `/pricing` with the wall
   in the URL (the same encoding as share links). With no wall, pricing sends the buyer to the
   calculator first.
2. The button posts that wall to `POST /api/checkout`, which creates a Stripe Checkout Session
   (`mode=payment`, price `STRIPE_PRICE_ID`) and stores the validated wall in `metadata.wall`.
3. Stripe sends the buyer to `/report?session_id=...`. The page **re-reads the session from
   Stripe** and shows the report only if it is `payment_status=paid`, `mode=payment`, and its single
   line item is `STRIPE_PRICE_ID`. Otherwise it shows a waiting, failed or not-found screen.
   The PDF is `GET /api/report/pdf?session_id=...`, which runs the same check on every request.
4. For a buyer who closes the tab, Stripe calls `POST /api/stripe/webhook`. The signature is checked
   on the raw body, the event id is claimed, the session is re-read and checked the same way, and
   the report is emailed with the PDF attached through `lib/openhelm-mail.ts`. Any failure answers
   500 so Stripe retries. Another product's event on a shared Stripe account is ignored by price id.

The report is rebuilt by the real engine (`designWall()`) from the stored wall, so nothing is
stored on our side and nothing in the report is typed in. The on-screen report and the PDF are
drawn from one model (`lib/report/model.ts`).

Checkout needs **all three** Stripe variables. Until they are set the pricing page says payments
are not connected and `/api/checkout` answers 503, so nobody can pay for a report we cannot deliver
(this replaces the old "do not set the Stripe variables yet" warning).

**Idempotency without a database.** The in-memory event-id record (24 h, per process) stops
duplicate work inside one instance. What makes a repeat delivery safe across restarts and instances
is the email idempotency key (`slopeify-report-<session id>`), so the mail provider returns the
original message instead of sending a second one. If event-level durability is ever wanted, the
table would be `stripe_events (id text primary key, type text not null, processed_at timestamptz
not null default now())`, as in TableHelm. Nothing needs it today.

### Environment variables

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_AMAZON_TAG` | Amazon associate tag appended to shop links |
| `NEXT_PUBLIC_CONTRACTOR_PARTNER_URL` | Partner/affiliate URL for contractor matching |
| `NEXT_PUBLIC_ENGINEER_PARTNER_URL` | Partner/affiliate URL for engineer matching |
| `STRIPE_SECRET_KEY` | Pro report: create and read Checkout Sessions (`sk_` or `rk_` key) |
| `STRIPE_PRICE_ID` | Pro report: the one-time $29 price (`price_...`). Also how a session is recognised as ours |
| `STRIPE_WEBHOOK_SECRET` | Pro report: signing secret (`whsec_...`) of the webhook endpoint below |
| `OPENHELM_API_KEY`, `OPENHELM_MAIL_INBOX_ID` | Emailing the report (`lib/openhelm-mail.ts`). Without them the on-screen download still works, but the webhook answers 500 so the failure is visible |
| `NEXT_PUBLIC_SITE_URL` | Base URL for Stripe success/cancel redirects and email links |

Stripe webhook endpoint: `https://slopeify.com/api/stripe/webhook`, events
`checkout.session.completed` and `checkout.session.async_payment_succeeded` only.

### Testing a purchase in Stripe test mode

Use test-mode keys, a test-mode price and a test-mode webhook (or `stripe listen --forward-to
localhost:3000/api/stripe/webhook`, which prints its own `whsec_`). Open the calculator, set a wall,
choose the Pro report link, pay with card `4242 4242 4242 4242`, any future expiry, any CVC and ZIP.
You should land on `/report` showing "Payment received. Your report is ready." with the same wall,
a working **Download the PDF** button, and (with the mail variables set) an email with the PDF
attached within a minute. Reload `/report` and resend the event from the Stripe dashboard: nothing
is sent twice.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # engine, share-URL, lead-gen, Sentry, GEO and Pro report tests
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
- `/llms.txt`, generated from the calculator, guide and state data (`lib/llms.ts`); robots
  explicitly allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended and CCBot

> Planning tool only. A wall over 4 ft, or any wall with a surcharge, needs a
> licensed engineer's stamped design and a local permit.

## Launch checklist

Code, tests and build are launch-ready. What's left is account/dashboard work that has
to happen outside this repo:

1. **`slopeify.com`** is served by Helm7: `www` is a CNAME to the product's Helm7 edge
   host and the bare domain is an A record to the Helm7 apex IP, both at IONOS.
2. **Verify the domain in Google Search Console** (domain property, via DNS TXT record)
   once step 1 is done, then submit `/sitemap.xml`.
3. **Analytics** is off. `lib/openhelm-analytics.tsx` (GA4) measures nothing until
   `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.
   The Stripe session id in `/report?session_id=...` unlocks a paid download, so it is kept out
   of GA in code: the `purchase` event's `transaction_id` is a SHA-256 of the id (computed by
   `/api/checkout/status`, which never returns the raw id), page views drop `session_id` from
   `page_path` and `page_location`, `/report` and `/api/report/*` send
   `Referrer-Policy: no-referrer`, and `/report` removes the id from the address bar once the
   report has rendered, keeping it in the tab's `sessionStorage` so a reload rebuilds the
   report through a Server Action (`test/session-id-privacy.test.mts`). As a second layer, also add
   `session_id` to the GA4 web stream's data redaction when you set the id up.
4. **Sentry**: set `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` (project `slopeify_web`, see
   `.env.example`) in Helm7. `NEXT_PUBLIC_SENTRY_DSN` is baked in at build time.
5. **Set env vars in Helm7** (product `web` service variables) as you get
   each account: `NEXT_PUBLIC_AMAZON_TAG`, `NEXT_PUBLIC_CONTRACTOR_PARTNER_URL`,
   `NEXT_PUBLIC_ENGINEER_PARTNER_URL`, `NEXT_PUBLIC_SITE_URL` (`https://slopeify.com`
   once step 1 lands). The Pro report is built, so it goes live when `STRIPE_SECRET_KEY`,
   `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` and the mail variables are all set and the
   webhook endpoint is registered. Do a test-mode purchase first (see above).
6. **Apply to affiliate/referral programs** at your own pace: Amazon Associates (for
   `NEXT_PUBLIC_AMAZON_TAG`), and a contractor/engineer lead network for the
   `*_PARTNER_URL` vars. Until those exist, shop links are plain retailer searches and
   `/find-a-pro` is a self-contained SEO landing page with an email fallback — both
   already live and functional with zero config.

The Sentry scrubber (`lib/scrub.ts`) redacts secrets of any length, backs up to a clean boundary when it truncates, and fails closed; its regression tests are in `test/scrub-hardening.test.mts`.
