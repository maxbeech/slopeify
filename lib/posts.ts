// SEO guides. Bodies are plain markdown (## headings, - lists, paragraphs) and
// rendered by a tiny formatter on the blog page. Every claim is consistent with
// the engine and the cited codes, no fabricated numbers.
export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  readMins: number;
  body: string;
}

export const POSTS: Post[] = [
  {
    slug: "how-much-does-a-retaining-wall-cost",
    title: "How Much Does a Retaining Wall Cost in 2026?",
    description:
      "A clear, no-hype breakdown of retaining wall cost by material, height and reinforcement, with the cost-per-square-foot ranges our calculator uses.",
    date: "2026-06-14",
    readMins: 7,
    body: `Retaining walls are priced by the **square foot of wall face** (length × exposed height), not by length alone, a 30-ft wall that is 4 ft tall is twice the work of one that is 2 ft tall.

## Typical installed cost per square foot

- **Segmental concrete block (SRW):** $30-$60 / sq ft
- **Poured concrete:** $40-$75 / sq ft
- **Timber / sleepers:** $20-$40 / sq ft
- **Boulder / natural stone:** $25-$55 / sq ft

A 30-ft × 4-ft block wall (120 sq ft of face) therefore lands around **$3,600-$7,200** installed, before regional adjustments.

## What pushes the price up

- **Height.** Past about 4 ft the wall usually needs geogrid reinforcement or an engineered design, budget +20-40%.
- **Drainage.** Drain rock, perforated pipe and filter fabric are not optional; skipping them is the #1 cause of failure.
- **Surcharge.** A driveway or slope above the wall increases the load and often the engineering.
- **Access & site.** Tight access, excavation, and hauling spoil all add labour.
- **Region.** Labour and material costs vary; our calculator applies a per-state cost index.

## DIY vs hiring out

A short (<3 ft) block wall on good, level soil is a realistic weekend DIY job. The materials might be 35-45% of the installed price. Once you cross 4 ft, add a surcharge, or hit clay, the engineering and equipment make a contractor the safer choice.

Use the [calculator](/) to get a face-area cost range and a full materials takeoff for your exact wall.`,
  },
  {
    slug: "do-i-need-a-permit-for-a-retaining-wall",
    title: "Do I Need a Permit for a Retaining Wall?",
    description:
      "The 4-foot rule explained: when IRC R404 and IBC §1807 require an engineered, permitted retaining wall, and when you're in the clear.",
    date: "2026-06-13",
    readMins: 6,
    body: `The short answer most building departments use is **four feet**, but the detail matters.

## The 4-foot rule

Under **IRC R404.1** and **IBC §1807.2**, a retaining wall needs an *engineered design* when the difference in ground level it holds back exceeds **4 ft** (measured from the bottom of the footing to the top of the wall). Most jurisdictions require a **permit** at the same line.

## The surcharge exception

If anything presses on the soil behind the wall (a **driveway, parking, a slope, or a structure**), the codes drop the engineering trigger to **any height**. A 3-ft wall holding back a driveway can need a stamped design.

## How height is measured

It's the *retained* height, bottom of footing to top, not just the part you see. A wall that looks 3 ft tall but has a 1.5-ft buried base is retaining 4.5 ft and crosses the line.

## What to do

1. Measure the true retained height.
2. Note any surcharge or slope above the wall.
3. Check the result in the [calculator](/), it tells you whether a permit and engineer are likely.
4. **Call your local building department.** Thresholds vary by city and county; some require a permit for *any* wall. This guide is the code baseline, not your local ordinance.`,
  },
  {
    slug: "retaining-wall-drainage",
    title: "Retaining Wall Drainage: Why Walls Fail and How to Fix It",
    description:
      "Water, not soil, topples most retaining walls. Here's the drainage detail that keeps your design loads valid.",
    date: "2026-06-12",
    readMins: 6,
    body: `Most retaining-wall failures are **water** failures. Here's why, and exactly what to build.

## Why water is the enemy

Trapped water does two things:

1. **Adds hydrostatic pressure**, water weighs 62.4 pcf, heavier than most soils, and pushes directly on the back of the wall.
2. **Saturates the backfill**, so the soil itself loses strength and pushes harder.

Together they can roughly **double** the load a wall was designed for. Every stability number assumes the water is being removed.

## The drainage system

- **Drain rock:** a 12-inch-wide column of clean ¾" angular stone directly behind the full height of the wall.
- **Perforated pipe:** a 4" perforated drain at the base of the rock, sloped to **daylight** (or to a drain), so collected water actually leaves.
- **Filter fabric:** wraps the drain rock to keep fine soil from clogging it.
- **Weep holes** (for solid concrete/masonry walls) as a backup path through the face.

## Don't forget the base

A compacted crushed-stone leveling pad under the wall both spreads the load and gives water somewhere to go. Our [calculator](/) includes drain rock, pipe and fabric in every materials list for exactly this reason.`,
  },
  {
    slug: "segmental-block-vs-poured-concrete-vs-timber",
    title: "Block vs Concrete vs Timber Retaining Walls: How to Choose",
    description:
      "The trade-offs between segmental block, poured concrete, timber and boulder retaining walls: cost, height limits, lifespan and DIY-ability.",
    date: "2026-06-11",
    readMins: 7,
    body: `Four materials cover almost every residential retaining wall. Here's how they compare.

## Segmental block (SRW)
Mortarless interlocking concrete units on a crushed-stone pad. **Most popular** for good reason: DIY-friendly, no footing to pour, easy to reinforce with geogrid for taller walls, and a wide range of looks. $30-$60/sq ft installed.

## Poured concrete (gravity or cantilever)
A solid concrete mass or an engineered cantilever. **Strongest** and the smallest footprint at height, but needs formwork, rebar and a real footing, and usually an engineer. $40-$75/sq ft.

## Timber / sleepers
Stacked pressure-treated timbers. **Cheapest and fastest** for short walls, warm look, but the shortest lifespan (15-25 years) and it needs deadman anchors above ~3 ft. $20-$40/sq ft.

## Boulder / natural stone
Stacked large boulders, battered into the slope. **Natural look**, very durable, forgiving of minor settlement, but needs machinery to place and a wide base. $25-$55/sq ft.

## Quick guide

- **Under 3 ft, DIY, budget:** timber or block.
- **3-4 ft, looks matter:** segmental block.
- **Over 4 ft or a surcharge:** reinforced block or engineered concrete, and a permit.

Run each option through the [calculator](/) to compare base width, reinforcement and cost side by side.`,
  },
  {
    slug: "how-to-build-a-retaining-wall",
    title: "How to Build a Retaining Wall (Block), Step by Step",
    description:
      "A practical sequence for building a segmental block retaining wall, from the base trench to the cap row, with the dimensions our calculator gives you.",
    date: "2026-06-10",
    readMins: 8,
    body: `This is the build sequence for a **segmental block** wall up to about 4 ft. Past that, get it engineered.

## 1. Plan and check
Run your wall through the [calculator](/) first: confirm the base width, whether you need geogrid, and whether you need a permit.

## 2. Excavate the base trench
Dig a level trench the full base width plus 6 inches, deep enough to **bury the first course** (about 10% of wall height, minimum one full block) plus 6 inches for the leveling pad.

## 3. Build the leveling pad
Place and compact **6 inches of crushed stone**, dead level. This single step decides whether your wall is straight for 30 years.

## 4. Set the base course
Lay the first row of block on the pad, level front-to-back and side-to-side, checking every block. Bury it. This is the most important course.

## 5. Stack, backfill and drain
Stack courses with the running-bond offset and the built-in setback (batter). As you go: place **drain rock** behind the blocks, run the **perforated pipe** at the base to daylight, and **compact backfill** in 6-8" lifts. Add **geogrid** layers where the calculator says.

## 6. Cap it
Glue the cap blocks on with concrete adhesive, finish grade so water runs *away* from the wall, and seed or mulch.

The calculator's materials list tells you how many blocks, how much stone and how much pipe to order.`,
  },
  {
    slug: "when-do-you-need-geogrid",
    title: "When Does a Retaining Wall Need Geogrid Reinforcement?",
    description:
      "Geogrid turns the soil into part of the wall. Here's when a gravity wall isn't enough and how reinforcement is sized.",
    date: "2026-06-09",
    readMins: 5,
    body: `**Geogrid** is a polymer mesh laid between block courses and extending back into the backfill. It ties the soil mass to the wall so the two act together, a *reinforced* SRW.

## When you need it

A plain gravity wall resists overturning and sliding with its own weight alone. That runs out of road when:

- the wall is taller than about **4 ft**,
- the soil is **weak** (silt or clay), giving low bearing and high pressure,
- there's a **surcharge** (driveway, slope, structure) behind it, or
- the gravity wall would need an unreasonably wide base to pass.

Our calculator flags exactly this: if no gravity base width passes the overturning (FS ≥ 2.0), sliding (FS ≥ 1.5) and bearing checks, it recommends reinforcement.

## How it's sized (rule of thumb)

- **Length:** each grid layer extends back into the slope at least **0.6 × wall height** (minimum 4 ft).
- **Spacing:** roughly one layer every two block courses (~16 inches vertically).

These are planning estimates. A reinforced wall over 4 ft still needs an engineer's stamp and a permit, the geogrid type, strength and connection all have to be designed for your soil.`,
  },
  {
    slug: "retaining-wall-soil-and-backfill",
    title: "Retaining Wall Soil and Backfill: What Actually Matters",
    description:
      "Why the soil behind and under your wall drives the whole design, and why clean granular backfill beats native clay every time.",
    date: "2026-06-08",
    readMins: 6,
    body: `Two soils control your wall: the **backfill** behind it (how hard it pushes) and the **foundation** under it (how much it can carry).

## Backfill: lower pressure is better

IBC Table 1610.1 sets the design lateral load as an equivalent fluid pressure:

- **Clean sand / gravel (GW, GP, SW, SP):** 30 pcf, the goal.
- **Silty soils (GM, SM):** 40-45 pcf.
- **Clayey / low-plasticity (SC, ML, CL):** 60 pcf.
- **High-plasticity / expansive clay (CH):** avoid entirely, it swells and traps water.

That's why engineers so often **replace native clay with clean granular fill** behind the wall: it halves the push and drains freely.

## Foundation: higher bearing is better

IBC Table 1806.2 sets the presumptive allowable bearing:

- **Gravel (GW, GP):** 3,000 psf
- **Sand / silty / clayey sand:** 2,000 psf
- **Silt / clay (CL, ML):** 1,500 psf
- **Rock:** 4,000 psf (sedimentary) to 12,000 psf (crystalline)

Weak foundation soil means a wider base or a deeper footing. The [calculator](/) lets you pick both soils and shows how each changes the result.`,
  },
  {
    slug: "how-many-retaining-wall-blocks",
    title: "How Many Retaining Wall Blocks Do I Need?",
    description:
      "A simple way to count blocks, caps, base stone and drain rock for a segmental retaining wall, and the calculator that does it for you.",
    date: "2026-06-07",
    readMins: 4,
    body: `Counting block is mostly about **wall-face area** (length × height).

## Blocks

A common SRW unit faces about **1 square foot** (8" high × 18" wide). So:

> **Blocks ≈ length × height (in feet), plus ~5% for cuts and breakage.**

A 30-ft × 4-ft wall ≈ 120 blocks + waste. If your block is a different size, divide the face area by that block's face area instead.

## Caps

One row of cap blocks along the top: **caps ≈ wall length** (in feet) for ~12" caps.

## Base stone and drain rock

- **Leveling pad:** (base width + 0.5 ft) × 0.5 ft deep × length ÷ 27 = cubic yards.
- **Drain rock:** 1 ft wide × wall height × length ÷ 27 = cubic yards.

## Don't forget

Perforated pipe (≈ wall length), filter fabric (≈ height + 2 ft, times length), construction adhesive for the caps, and geogrid if the wall is reinforced.

The [calculator](/) prints this whole takeoff with quantities and a cost for your exact dimensions.`,
  },
  {
    slug: "gravity-vs-cantilever-retaining-walls",
    title: "Gravity vs Cantilever Retaining Walls",
    description:
      "The two big families of retaining wall, mass/gravity and reinforced cantilever, and when each one wins.",
    date: "2026-06-06",
    readMins: 5,
    body: `Almost every retaining wall is one of two types.

## Gravity (mass) walls
These resist the soil with **sheer weight**: segmental block, stacked stone, boulders, mass concrete, timber. Simple, often DIY, no rebar design. The catch is the base: to stay stable they need width, typically **0.5-0.7 × height**, and that footprint grows fast with height. Our solver finds the minimum base width for a gravity wall and tells you when it's no longer practical.

## Cantilever walls
A reinforced-concrete (or reinforced SRW) wall shaped like an upside-down **T or L**. The weight of the **backfill sitting on the heel** does the stabilizing work, so the wall can be much taller with a slim stem. The trade-off: rebar design, formwork, a real footing, and an engineer.

## Choosing

- **Up to ~4 ft, good soil:** gravity wall wins on cost and simplicity.
- **Over 4 ft, tight space, or a surcharge:** cantilever (or reinforced SRW) wins.

The [calculator](/) designs the gravity case directly and flags when you've crossed into engineered-cantilever territory.`,
  },
  {
    slug: "why-retaining-walls-fail",
    title: "Why Retaining Walls Fail (and How to Avoid It)",
    description:
      "Bulging, leaning, cracking and sliding: the real reasons retaining walls fail and the details that prevent each one.",
    date: "2026-06-05",
    readMins: 6,
    body: `Retaining walls rarely fail from one big mistake, it's usually a missing detail. The big four:

## 1. No drainage (the #1 cause)
Water builds up behind the wall, adds hydrostatic pressure and saturates the soil. **Fix:** drain rock, perforated pipe to daylight, filter fabric. Always.

## 2. A bad base
A thin or unlevel leveling pad lets the wall settle and lean. **Fix:** 6 inches of compacted crushed stone, dead level, with the first course buried.

## 3. Too narrow / too tall for gravity
A gravity wall without enough base width overturns or slides; built too tall without geogrid, it bulges. **Fix:** size the base to FS ≥ 2.0 overturning and 1.5 sliding, and reinforce when the checks fail.

## 4. Ignored surcharge
A driveway or slope above the wall that wasn't in the design overloads it. **Fix:** include the surcharge, it often means an engineer and a permit.

The [calculator](/) addresses all four: it sizes the base, includes drainage, checks the factors of safety, and accounts for surcharge and slope. Above 4 ft, still hire an engineer.`,
  },
  {
    slug: "terraced-retaining-walls",
    title: "Terraced Retaining Walls: When Two Short Walls Beat One Tall One",
    description:
      "Terracing a slope with multiple short walls can avoid engineering, but only if the walls are far enough apart. Here's the rule.",
    date: "2026-06-04",
    readMins: 5,
    body: `Splitting a tall slope into **two or three short walls** (terraces) is popular because each wall can stay under the 4-ft engineering line and look better. But there's a catch.

## The surcharge trap

If the terraces are too close, the **upper wall acts as a surcharge on the lower one**, and now the lower wall is designed for far more than its own height. A common engineering guideline is that walls behave independently only when the **horizontal offset between them is at least twice the height of the lower wall** (some codes use the sum of the heights). Closer than that, treat them as **one tall wall** and design accordingly.

## Practical takeaways

- Wide, well-separated terraces = two genuinely independent short walls (often no engineer).
- Stacked, close terraces = one tall wall in disguise (engineer + permit).
- Each terrace still needs its own drainage; water from the upper bench must not dump behind the lower wall.

Design the lower wall in the [calculator](/) with the upper wall's load entered as a surcharge to see the difference for yourself.`,
  },
  {
    slug: "retaining-wall-engineering-basics",
    title: "Retaining Wall Engineering Basics: The Three Checks",
    description:
      "Overturning, sliding and bearing: the three stability checks every retaining wall must pass, explained in plain English.",
    date: "2026-06-03",
    readMins: 6,
    body: `Every retaining wall has to pass three classical checks. Here's what each one means.

## 1. Overturning
The soil tries to **tip the wall forward** about its toe. You compare the wall's righting moment (its weight × the distance to the toe) with the soil's tipping moment. The ratio is the factor of safety; the standard minimum is **2.0**.

## 2. Sliding
The soil tries to **push the whole wall outward**. You compare the friction under the base (weight × a friction coefficient) with the horizontal push. The standard minimum factor of safety is **1.5**.

## 3. Bearing
The wall's weight, offset by the soil push, concentrates pressure under the **toe**. That peak pressure must stay below the soil's allowable bearing (IBC Table 1806.2), and ideally the resultant stays in the **middle third** of the base so the heel doesn't lift.

## The earth pressure that drives them

The push itself comes from IBC Table 1610.1 (or Rankine theory): an equivalent-fluid pressure that grows with the square of the height. Surcharge, slope and water all add to it.

Our [calculator](/) computes all three factors of safety for your wall and solves for the base width that passes them. Above 4 ft, an engineer must run these for your specific site.`,
  },
];

export function postBySlug(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
