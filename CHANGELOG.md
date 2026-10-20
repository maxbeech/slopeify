# Changelog

## 2026-10-20: Keyword field on every guide

### Added
- `keyword` on the `Post` interface in `lib/posts.ts`, set on all 24 guides to the primary search keyword recorded in the Content Log. Used by the on-page SEO audit; not rendered.

## 2026-10-15: Refresh five guides from the content inventory

### Changed
- **Retaining wall surcharge, when you need geogrid, gravity wall sizing, retaining wall near a foundation, and block vs concrete vs timber** guides are refreshed. Each now has an accurate permit-exemption statement (4 ft or less and no surcharge), an accurate reference for the 45-degree excavation line, and clearly labelled hypothetical examples instead of anecdotes presented as real cases.
- Removed quotes and citations that could not be traced to a source (a CROSS report number, "engineering advisors" quotes, an NAHB share figure, a CMHA "since 1993" claim) and marked price, density and strength figures as typical or illustrative.
- Visible dates on those five guides move to 2026-10-15.


The $29 report can now be bought and delivered. Checkout stays off until it is fully configured, so nobody can pay for a report we cannot deliver.

### Added
- **The report.** Built by the real engine (`designWall()`) from the buyer's wall: result at a glance, inputs, cross-section with dimensions, the full earth-pressure and stability calculation sheet with the numbers worked through, footing depth, geogrid (when needed), permit, notes, materials and cost, and the code references. On screen at `/report` and as a PDF, both drawn from one model (`lib/report/model.ts`).
- **Verified success path.** `/report` re-reads the Checkout Session from Stripe and shows the report only if it is paid, in payment mode, with our price. Otherwise it shows a waiting, failed or not-found screen. `GET /api/report/pdf` runs the same check on every download.
- **Webhook** `POST /api/stripe/webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`: signature checked on the raw body, event id claimed and released on failure, 500 so Stripe retries, other products' events ignored by price id. It emails the PDF through the existing `lib/openhelm-mail.ts`, keyed on the session id so a repeat is never sent twice.
- **Dependency:** `pdf-lib` 1.17.1 (MIT, pure JS, no native or file-system access, so it bundles under Next with no config). Nothing in the repo made PDFs; the free page uses the browser's print.
- Tests: `report-checkout`, `report-pdf` and `stripe-webhook` suites (see `npm test`).

### Changed
- **Checkout** now takes the wall (`POST /api/checkout` with `{ wall }`), stores it in `metadata.wall`, returns to `/report` after payment and back to `/pricing` with the same wall on cancel. It needs `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` and `STRIPE_WEBHOOK_SECRET`; without all three it answers 503.
- **Pricing page** shows one of three honest states: payments not connected (one sentence), no wall chosen yet (link to the calculator), or a working button naming the wall. It now renders per request because it reads the environment and the URL.
- **Calculator** has a "Get the Pro design report for this wall" link that carries the inputs.
- Verdict, permit headline and next-step wording moved to `lib/result-text.ts`, and the cross-section geometry to `lib/wall-section.ts`, so the results panel, the report and the PDF share them. Output of the on-screen diagram checked identical before the fix below.
- Privacy page says where the wall and the email go.
- README: the "known gap" warning is replaced by how fulfilment works, the env table, the webhook setup and a test-mode purchase script.

### Fixed
- The cross-section's base-width label ("2' base") was cut off at the bottom of the frame on every wall. The frame now has room for it.

### Security
- The Stripe session id unlocks the report, so it is treated as a credential. GA's `transaction_id` is now a SHA-256 of it (`transactionIdFor`), and `/api/checkout/status` no longer returns the raw id; the browser refuses to forward anything session-id-shaped. Page views drop `session_id` from `page_path`/`page_location` (`lib/openhelm-analytics.tsx`, a local change to port to the canonical copy).
- `/report` and `/api/report/*` send `Referrer-Policy: no-referrer` (header via `next.config.ts`, plus the page's meta tag and the PDF route's own header).
- `/report` (and a legacy `/pricing` success return) removes `session_id` from the address bar with `history.replaceState` once rendered, keeping the report and its download link on screen.
- Reloading the clean `/report` keeps the report: the first load stores the id in this tab's `sessionStorage` (`slopeify:report:session_id`), and `ReportRecovery` rebuilds the report through the `recoverReport` Server Action, so the id travels in a POST body, not a URL, and is not logged. With storage blocked or empty it shows "not found" as before, without throwing; the emailed link still reopens the report.
- Tests: `session-id-privacy` suite.

### Not done
- No database or purchase table: Stripe is the record. Event-id dedupe is in memory per process; the mail idempotency key is what holds across restarts.
- `/report` is private and `noindex`, so it is deliberately not in the sitemap.

## 2026-10-10: Machine-readability foundations

- **llms.txt.** `/llms.txt` was a 404. It is now generated from the calculator, guide and state lists in `lib/llms.ts`, so its links cannot drift from the site. It states that there is no public API.
- **AI crawlers.** `robots.txt` now names GPTBot, ClaudeBot, PerplexityBot, Google-Extended and CCBot as allowed, alongside the catch-all.
- **Offers.** Home-page `WebApplication` JSON-LD lists both offers that the pricing page shows: the free calculator and the $29 Pro design report.
- **Tests.** `test/geo-surfaces.test.mts` covers the llms.txt links and H1, and the robots policy.
- **WebSite schema.** Removed the `SearchAction` that pointed at `/calculators?q=`. That page has no search, so the schema advertised a search the site does not offer.

## 2026-10-07: Sentry scrubber security pass

- **Long secrets.** JWTs, bearer tokens, vendor keys (`sk_`, `whsec_`, `hlm_sk_`, `sntrys_`) and `key=value` secrets of any length are now redacted whole. The old bounded patterns left the tail of anything longer than their limit.
- **Truncation.** The 10k cut backs up to the previous delimiter, so half a secret can never survive at the boundary.
- **Encodings, URLs and key names.** URL queries and fragments (OAuth and magic-link tokens), percent-encoded emails, `Bearer%20...`, `token%3D...`, escaped JSON, `Authorization: Basic ...`, connection-string credentials and keys such as `passwd`, `pwd`, `jwt` and `Set-Cookie` are covered at any depth.
- **Fail closed, no bypass.** Events, transactions, breadcrumbs and logs are dropped if scrubbing throws. A second deep pass scrubs stack-frame vars, spans, contexts and tags, feedback events included (only the reporter's own `contexts.feedback` and user are kept).
- **Tests.** `test/scrub-hardening.test.mts` covers long JWTs, varied key lengths, secrets straddling the truncation boundary, hostile 20k strings, key variants and fail-closed behaviour.

## 2026-10-07

### Fixed: feedback events no longer bypass the Sentry scrubber
- User feedback used to return early and skip all scrubbing. Now only `contexts.feedback` and `user` (the reporter's own name, email and message) are kept; breadcrumbs, request, tags, extra and other contexts are scrubbed as normal. Tested.

## 2026-10-06

### Changed: Sentry hardening and project fix
- Errors, logs and feedback go to `slopeify_web` (was `retaincalchq_web`).
- `captureServerError` and `captureServerMessage` now keep only ids, codes, counts and booleans; free text is dropped.
- The header "Feedback" control is visible on mobile too; `openFeedbackForm` is tested.
- Event `logentry` and transaction names are scrubbed; the global error page is styled and reports the crash.

### Added: Sentry to the Maxed Labs standard (project `slopeify_web`)
- Errors, logs and user feedback now go to `slopeify_web`. One shared options helper
  (`lib/sentry-options.ts`) feeds the browser, server and edge inits; the old
  `sentry.server.config.ts` and `sentry.edge.config.ts` are gone.
- `lib/scrub.ts` scrubs events, logs, breadcrumbs and transactions: emails, phone numbers,
  tokens, API keys and secret-looking fields are masked, query strings are stripped. It uses
  linear-time patterns, truncates long strings and drops the payload if scrubbing fails.
- `lib/observability.ts` (`captureServerError`) now reports the checkout routes and the
  client checkout handlers, plus a new `app/error.tsx` boundary. Context is ids and codes only.
- "Send feedback" in the header and footer opens Sentry's form; the old floating button is gone.
- Source maps upload at build when `SENTRY_AUTH_TOKEN` is set; the tunnel route is randomised.
- New tests: `test/sentry-scrub.test.mts`, `test/feedback-and-capture.test.mts`.

## 2026-09-30

### Changed: hosting moved from Vercel to Helm7
- Removed `@vercel/analytics` (and its `<Analytics />` mount) and the `deploy` script that
  ran the `vercel` CLI. Analytics is now off until `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.
- Sentry `environment` now comes from `NODE_ENV` only (the `VERCEL_ENV` variables are never set
  on Helm7, so every production error would have been reported as "development").
- Checkout redirect fallback is `SITE.url`; the `slopeify.vercel.app` URL is gone.
- `/privacy` no longer says the site uses Vercel Web Analytics.
- New `test/no-vercel.test.mts` (part of `npm test`) keeps Vercel packages, scripts and
  `VERCEL_*` checks out.

## 2026-07-08

### Changed: full guides rewrite to skyscraper-length SEO posts
- Expanded all 24 posts in `lib/posts.ts` from ~200-word summaries to 1,800-2,500
  word in-depth guides: TL;DR key-takeaways box, a data table, an attributed
  expert quote, a cited statistic, 3-6 internal links and 2-5 authoritative
  external citations (ICC, NCMA/CMHA, ASCE, OSHA, USDA NRCS) per post, and a
  3-5 question FAQ section. All existing engineering figures (cost ranges,
  factors of safety, code sections, depths) were preserved verbatim; only
  supporting depth was added.
- `readMins` recalculated per post from the new word count.

### Added: renderer support for tables, FAQ schema, TL;DR, and a table of contents
- `app/blog/[slug]/page.tsx`: the body renderer now supports markdown pipe
  tables, `###` subheadings, and a "label line directly above a list" pattern
  (e.g. `**Drainage:**` followed by `- ` items with no blank line) that
  previously fell through to a raw paragraph.
- A `## Key takeaways` section now renders as a highlighted callout box.
- A `## FAQs` section renders as a native `<details>` accordion and emits an
  FAQPage JSON-LD graph (in addition to the existing Article and HowTo graphs).
- An auto-generated table of contents (anchor-linked to each `##` heading) is
  inserted after the intro on any post with 3+ sections.

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
