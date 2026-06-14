# RetainCalc HQ

Free retaining wall **design, cost & permit** calculator — `retaincalchq.com`.

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
- **Permit** — the 4-ft rule (IRC R404.1 / IBC §1807.2) plus the surcharge exception.

Everything is documented on `/methodology` with the code tables reproduced.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · tsx tests. The free
calculator is 100% client-side (no DB). The optional Pro design-report PDF uses an
env-gated Stripe checkout (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`) that degrades
gracefully when unset.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # engine + share-URL tests (54 checks)
npm run lint
npm run build
```

## SEO surface

- Home wall designer + 7 calculator variants (`/calculators/*`)
- 51 per-state permit & cost pages (`/states/*`)
- 12 guides (`/blog/*`)
- `/methodology`, `/pricing`, sitemap, robots, JSON-LD, 1-week ISR

> Planning tool only. A wall over 4 ft, or any wall with a surcharge, needs a
> licensed engineer's stamped design and a local permit.
