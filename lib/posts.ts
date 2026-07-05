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

const WEEK2_POSTS: Post[] = [
  {
    slug: "retaining-wall-cost-per-linear-foot",
    title: "Retaining Wall Cost Per Linear Foot: 2026 Guide",
    description:
      "The real cost per linear foot for retaining walls by material and height, based on the installed price ranges our calculator uses. Updated for 2026.",
    date: "2026-06-20",
    readMins: 5,
    body: `Cost per linear foot is a convenient shorthand, but it hides the most important variable: **wall height**. A 30-ft wall that is 2 ft tall costs far less per foot than the same 30-ft wall at 6 ft.

## Cost per linear foot by material and height

These are installed costs (labour + materials) at a 4-ft wall height, which is the most common residential case:

- **Segmental block (SRW):** $120–$240 / linear ft
- **Poured concrete:** $160–$300 / linear ft
- **Timber / sleepers:** $80–$160 / linear ft
- **Boulder / natural stone:** $100–$220 / linear ft

At 2 ft tall, halve those numbers. At 6 ft (usually engineered), add 40–60%.

## Why height matters more than length

The wall face area — **length × height** — is what drives labour and materials. A 4-ft wall uses roughly twice the blocks, twice the drain rock and twice the labour of a 2-ft wall for the same run. When you're pricing per linear foot, always anchor the number to a specific height.

## What adds cost beyond material and height

- **Drainage:** drain rock, perforated pipe and filter fabric are not optional — budget $15–$30 / linear ft extra.
- **Engineering and permit:** past 4 ft (or any height with a surcharge) you're looking at $500–$2,000 for stamped drawings and permit fees.
- **Site access and excavation:** tight lots and heavy machinery time add quickly.
- **Regional index:** our [calculator](/) applies a per-state labour and material factor.

## The bottom line

For rough budgeting, use $150–$250 per linear foot at 4 ft tall for a block wall. Run the [calculator](/) with your exact length, height and material to get a wall-face cost range and a full materials takeoff.`,
  },
  {
    slug: "retaining-wall-surcharge-explained",
    title: "Retaining Wall Surcharge Load: What Changes?",
    description:
      "A surcharge (driveway, slope, or structure above the wall) adds soil pressure. Here's how engineers account for it and when it changes the design.",
    date: "2026-06-20",
    readMins: 5,
    body: `**Surcharge** is any load applied to the soil behind a retaining wall: a driveway, parked cars, a shed, a deck, a road, or the slope of the hill itself. It increases the lateral (horizontal) pressure the wall must resist — sometimes dramatically.

## How it's calculated

Engineers treat a uniform surcharge (like a driveway) as an **equivalent additional soil height**. Using a common surcharge value of 100 psf (dead + live for a driveway) and a soil unit weight of 120 pcf, that works out to roughly **0.83 ft of extra soil height** pressing against the wall.

For Rankine or equivalent-fluid-pressure methods (IBC Table 1610.1), the lateral force from a surcharge = **q × Ka × H**, where q is the surcharge load in psf, Ka is the active earth pressure coefficient (roughly 0.33 for most soils), and H is the wall height.

## Practical impact

A 3-ft gravity wall that comfortably passes stability checks on its own may **fail overturning** when a 100-psf driveway is added behind it — and doing so under what looks like a "short" wall that wouldn't normally need a permit. That's why building codes (IRC R404, IBC §1807) require engineering for **any** wall under a surcharge, regardless of height.

## In the calculator

The [calculator](/) has a dedicated surcharge field. Enter the load (typical values: 100 psf for a driveway, 250 psf for a light structure, 0 for a clean slope) and the result shows how the base width, factor of safety and materials list all shift. If surcharge pushes you past the gravity-wall limit, the calculator flags that you need an engineer and a permit.`,
  },
  {
    slug: "retaining-wall-footing-depth",
    title: "Retaining Wall Footing Depth: The Right Number",
    description:
      "Footing depth for a retaining wall depends on frost depth, soil bearing and wall height. Here's the standard guidance and how our calculator uses it.",
    date: "2026-06-20",
    readMins: 5,
    body: `Footing depth affects two things: **frost heave** and **bearing capacity**. Get it wrong and the wall lifts in winter or slowly sinks.

## Frost depth rule

Most building codes require the bottom of the footing to sit **at or below the local frost depth** — the point below which the ground doesn't freeze. In northern states this can be 48 inches or more; in the south it's effectively zero.

Use the [calculator](/) to find the frost depth for your state; it pulls from ASCE 7 ground temperature data. For a quick check: Minnesota is ~60 in, Chicago ~36 in, North Carolina ~12 in, Texas ~4–6 in, Florida ~0.

## Bearing capacity rule

Even in a frost-free zone, the footing should sit on **undisturbed, competent soil**. If the existing grade is fill, topsoil or disturbed material, go down until you hit native ground regardless of the frost rule. Minimum bearing for most residential walls is 1,500 psf.

## Segmental block vs poured walls

Segmental block walls (SRW) don't have a traditional poured footing — instead they use a **compacted crushed-stone leveling pad**, typically 6 inches deep, with the first block course buried. The pad distributes the load; the buried course prevents undermining.

Poured concrete walls (gravity or cantilever) need a real cast-in-place footing: typically **1 ft wide for every 1 ft of wall height**, at frost depth. An engineer specifies this based on bearing tests for anything over 4 ft.

## Bottom line

For SRW block: 6-inch stone pad, first course buried, total excavation depth = pad + one block (≈ 16–18 inches). For poured concrete: match frost depth, minimum 12 inches below grade for warm climates. The [calculator](/) shows which rule applies to your configuration.`,
  },
  {
    slug: "tiered-retaining-wall-spacing",
    title: "Tiered Retaining Wall Spacing: Getting It Right",
    description:
      "Tiered retaining walls only avoid engineering if the terraces are far enough apart. Here is the spacing rule and when tiering beats one tall wall.",
    date: "2026-06-20",
    readMins: 5,
    body: `A **tiered** (terraced or stepped) retaining wall breaks a tall slope into two or more shorter walls. Each wall can often stay under the 4-ft engineering trigger — but only if they're spaced far enough apart.

## The key spacing rule

If the horizontal distance between the toes of two walls is **less than twice the height of the lower wall**, the upper wall is treated as a surcharge on the lower one. At that separation, you're essentially building one taller system and an engineer must evaluate the combined load.

A common practical guideline: **space terraces at least 2× the lower wall's height apart**. Some jurisdictions use the sum of both wall heights. When in doubt, call the building department.

## When tiering wins

- The slope is gentle enough to allow wide terraces with planting beds between them.
- You want a landscaped, stepped look rather than a single tall face.
- You're DIY-building and want to stay under the permit trigger on each tier.

## When a single tall wall wins

- The lot is tight — there's no room for horizontal separation between terraces.
- The slope is steep, so tiering would eat the yard.
- You have a budget for engineering and want a single structure that's easier to waterproof and maintain.

## In the calculator

Design each tier separately. For the **lower** tier, use the upper wall's load as a surcharge (typically 100–250 psf depending on what sits up there). The [calculator](/) will tell you whether that lower wall still stays in gravity-wall territory or crosses into engineered-cantilever/reinforced ground.`,
  },
  {
    slug: "gravity-retaining-wall-sizing",
    title: "Gravity Retaining Wall Design Explained",
    description:
      "A gravity retaining wall relies on its own weight to resist soil pressure. Here's how the design is sized, what the base width means and when gravity fails.",
    date: "2026-06-20",
    readMins: 6,
    body: `A **gravity retaining wall** resists lateral soil pressure using only its own weight — no reinforcement, no steel, no anchors. The categories include segmental block (SRW), stacked stone, mass concrete, and boulders.

## The key principle

Gravity keeps the wall stable in two ways:
1. **Overturning:** the wall's weight × the distance to the toe creates a righting moment. The soil's horizontal push × the wall height creates a tipping moment. For safety, the righting moment must be at least **2× the tipping moment** (factor of safety ≥ 2.0).
2. **Sliding:** friction between the base and soil resists forward movement. The friction force (weight × friction coefficient) must be at least **1.5× the horizontal push** (FS ≥ 1.5).

## What drives the base width

To pass both checks, the base must be wide enough that the wall is heavy enough. The rule of thumb is **0.5–0.7 × wall height**, but the actual number depends on:
- The soil's equivalent-fluid pressure (30–60 pcf depending on soil type)
- Any surcharge above the wall
- The wall's own density (concrete block vs stone)
- The foundation soil's bearing capacity

## When gravity fails

Past roughly **4 ft** (or any height with a surcharge), the base width needed for a pure gravity wall becomes impractically large. That's when you switch to **reinforced segmental walls** (geogrid extending into the backfill) or engineered **cantilever walls** (rebar in a poured-concrete T or L shape). The [calculator](/) flags this crossover and shows the minimum base width at each wall height.`,
  },
  {
    slug: "segmental-retaining-wall-blocks",
    title: "Segmental Retaining Wall Blocks: Design Guide",
    description:
      "Segmental retaining walls (SRW) are the most popular residential choice. Here's how the design works, when geogrid is needed, and what the calculator shows.",
    date: "2026-06-20",
    readMins: 6,
    body: `**Segmental retaining walls (SRW)** use dry-stacked interlocking concrete units — no mortar, no footing pour. They're the dominant residential retaining wall because they're DIY-friendly, flexible and well-documented in published design tables.

## How SRW design works

Each block course steps back **slightly** (the batter), which shifts the wall's weight-line backward to help it resist overturning. Manufacturers publish design tables that show the maximum wall height for a given block and base-width configuration. The NCMA Design Manual (National Concrete Masonry Association) is the industry standard.

## The geogrid threshold

For walls under about **3.5–4 ft** with no surcharge, a gravity SRW (no geogrid) is usually adequate. Above that, or with a surcharge, you add geogrid: a polymer mesh laid between block courses and extending back into the compacted backfill. The geogrid ties the soil mass to the wall, turning the combined unit into what the NCMA calls a **mechanical earth stabilization (MSE)** system.

Our [calculator](/) determines whether gravity alone passes the stability checks or whether the solution requires geogrid, using the NCMA methodology.

## Drainage is always required

Every SRW design assumes free-draining backfill. If water builds up behind the blocks, the actual lateral pressure can far exceed the design value. Install drain rock, a 4-inch perforated pipe to daylight, and filter fabric on every SRW wall — the [calculator](/) includes these in the materials takeoff.

## Past 4 ft

Reinforced SRW walls above 4 ft need an engineer's stamp in most jurisdictions, even though the block system itself is well-documented. The engineer specifies the geogrid type, length and placement for your specific soil.`,
  },
  {
    slug: "retaining-wall-permit-guide",
    title: "Retaining Wall Permits: A State-by-State Guide",
    description:
      "Retaining wall permits are triggered by height, surcharge and location. Here's what the 4-foot rule means and what varies by state and jurisdiction.",
    date: "2026-06-20",
    readMins: 6,
    body: `Almost every jurisdiction uses the **same underlying code** (IRC R404 and IBC §1807) but applies it with local amendments. Here's what's consistent and what varies.

## What's consistent across the US

- Retained heights over **4 ft** (measured from the bottom of the footing to the top of the wall) trigger an engineered design requirement and typically a building permit.
- Any wall subject to a **surcharge** (driveway, parking, slope, structure) must be engineered regardless of height.
- **Proximity to property lines, easements or structures** often triggers a permit even for short walls.

## What varies by state and city

Some cities lower the permit threshold to **3 ft**. Some require a permit for any wall visible from the street. HOAs have their own rules on top of building codes. A few states have specific provisions for walls near hillsides or in high-seismic zones.

**Always call your local building department** before starting. This guide covers the code baseline; your municipality may be stricter.

## What the permit process involves

For a permitted wall you'll typically need:
1. A **site plan** showing the wall location, property lines and setbacks.
2. **Structural drawings** stamped by a licensed engineer (for anything that needs engineering).
3. A **permit fee** (usually $200–$1,000 depending on jurisdiction).
4. An **inspection** — often at base, geogrid layers and final grade.

## Quick reference by wall height

| Height | Typical requirement |
|--------|---------------------|
| < 3 ft | No permit in most areas (check locally) |
| 3–4 ft | Permit often needed; engineering if surcharge |
| > 4 ft | Permit + engineer's stamp almost universally |

Use the [calculator](/) to check height, surcharge and whether your wall likely needs engineering — then verify with your local building department.`,
  },
  {
    slug: "cmu-retaining-wall-design",
    title: "CMU Retaining Wall Design: When Blocks Beat SRW",
    description:
      "Concrete masonry unit (CMU) retaining walls are strong and affordable but different from SRW block. Here's how they compare and when CMU makes the most sense.",
    date: "2026-06-20",
    readMins: 5,
    body: `**CMU (concrete masonry unit) retaining walls** use standard 8×8×16 hollow-core concrete blocks, reinforced with rebar in the cores and grouted in place. They're different from **SRW block** (interlocking segmental retaining wall units): CMU is mortared, grouted and engineered, while SRW is dry-stacked on a stone pad.

## When CMU wins

- You need a **taller wall** (CMU cantilever walls can be designed to 8–10+ ft with proper reinforcement).
- You want a **flat-face** aesthetic (SRW has a stepped look; CMU can be stucco'd or clad).
- You're in a **commercial or light-industrial** setting where CMU is the standard.
- The wall must be **waterproofed** on the back face (SRW breathes through the joints; CMU can be membrane-coated).

## When SRW wins

- **DIY or residential** — no mortar, no rebar, no poured cores.
- The wall is **under 4 ft** — SRW gravity design is adequate and far simpler.
- You want a faster, cheaper install with a textured block face.

## Design requirements for CMU

Any CMU retaining wall is **structural masonry** and needs an engineer. The engineer specifies the rebar spacing and size (usually #4 or #5 at 32–48 inches on center), the grout mix, the footing size and depth, and the drainage detail. Expect a permit in every jurisdiction.

## Cost

CMU walls are roughly comparable to poured concrete — **$40–$75 / sq ft** installed — but less than engineered SRW at similar heights. The materials are cheap; the engineering and labour are not.`,
  },
  {
    slug: "retaining-wall-on-slope",
    title: "Building a Retaining Wall on a Slope: Key Rules",
    description:
      "Building a retaining wall on a slope changes the load calculation since the backfill slope adds pressure. Here's what changes and how to account for it correctly.",
    date: "2026-06-20",
    readMins: 5,
    body: `A retaining wall with a **sloped backfill** is under more pressure than one with a flat backfill at the same height — and the difference is significant enough to change the base width, geogrid requirement and permit status.

## Why slope adds pressure

When the backfill behind the wall slopes upward, the wedge of soil that could potentially slide outward is larger. The Coulomb or Rankine earth pressure equations add a slope-angle term (β) that increases the active earth pressure coefficient Ka. The steeper the slope, the higher the Ka, and the harder the wall must work.

As a rough guide: a backfill slope of **18° (about 3:1, run:rise)** adds approximately **15–20%** to the lateral force compared to a flat backfill at the same retained height.

## Practical consequences

- A wall that passes stability checks with flat backfill may fail with a moderate slope behind it.
- The minimum base width increases.
- Geogrid may be needed at a lower wall height than on flat ground.
- The engineering-trigger height (usually 4 ft) may effectively drop.

## In the calculator

The [calculator](/) has a backfill slope field. Enter the slope (in degrees or as a ratio) and the design updates automatically — base width, factors of safety and whether the wall crosses into engineered territory. For steep slopes (over 20°), still get an engineer's eyes on it.

## Drainage on a slope

Sloped sites concentrate runoff. Make the drainage detail especially robust: a larger drain-rock column, weep holes at close spacing and a diversion swale above the wall to redirect surface water before it soaks into the backfill.`,
  },
  {
    slug: "retaining-wall-near-foundation",
    title: "Retaining Wall Near a House Foundation",
    description:
      "Placing a retaining wall near a foundation adds load to both structures. Here's when you need a setback, an engineer, and what to watch for on site.",
    date: "2026-06-20",
    readMins: 5,
    body: `Building a retaining wall close to a house foundation creates a two-way load problem: the wall transfers load to the soil, and the foundation also transfers load to the same soil. If the wall is too close, one structure can undermine the other.

## The 45-degree rule

A common engineering guideline is the **45-degree pressure zone**: the footing of a new structure (including a retaining wall) should be set back far enough that the **pressure cone from the existing foundation does not intersect the new structure's bearing zone**. In practice, this often means keeping the retaining wall's footing at least as far from the house footing as the depth of the house footing below grade.

If the distance is less than this, an engineer must analyse the combined load effects.

## Lateral load from the wall on the foundation

A retaining wall pushing laterally against soil near a basement or crawl-space wall can transfer that pressure to the foundation wall. This is especially concerning for **unreinforced masonry foundations** (older homes) and for poured concrete foundations not designed for lateral soil load.

## When to always get an engineer

- The retaining wall is within **10 ft of a footing** (rule of thumb).
- The wall is taller than 3 ft near any structure.
- The house has a **basement** — below-grade walls are particularly sensitive.
- The site has **poor soil** (clay, fill, high water table).

## Site tip

Watch for **existing drainage patterns** around the foundation. A retaining wall that interrupts how water flows away from the house can redirect water toward the foundation and cause new problems. Integrate the wall's drainage system (perforated pipe, daylight outlet) with the site's existing grade.`,
  },
  {
    slug: "railroad-tie-retaining-wall",
    title: "Railroad Tie Retaining Wall: Pros, Cons, Cost",
    description:
      "Railroad tie retaining walls are fast and cheap but have real limits. Here's what they cost, how long they last and when timber makes no sense for your project.",
    date: "2026-06-20",
    readMins: 5,
    body: `**Railroad tie** (or **timber sleeper**) retaining walls use stacked pressure-treated timbers or salvaged railway ties. They're the cheapest and fastest to build for a short wall — and the ones most likely to fail if you ignore their limits.

## Cost

Installed cost: **$20–$40 per square foot** of wall face, the lowest of the common material choices. Materials are cheap; the labour to set deadmen (perpendicular tie-backs) and compact backfill adds up.

## Lifespan

Pressure-treated timber lasts **15–25 years** in most climates before rot, insect damage and weathering degrade structural performance. The ties at the base (always wet) deteriorate fastest. Railway ties treated with creosote last longer but are increasingly restricted and not approved for vegetable-garden use.

## When timber works

- Short walls (**under 3 ft**) with no surcharge.
- Low-traffic areas where the wall won't need to outlast the landscape plan.
- DIY projects on a budget.

## When timber doesn't work

- **Over 3 ft retained height** — you'll need deadman tie-backs at intervals, and past about 4 ft it needs engineering.
- Near **food gardens** — creosote-treated ties leach into soil.
- **Seismic zones** — timber lacks the ductility and connection details needed.
- **Long-term investment** — if you're building for 30+ years, block or concrete is a better value.

## Deadmen

For timber walls over about 3 ft, **deadman tie-backs** (tie sections perpendicular to the wall, extending 4–6 ft into the backfill) are required at every 6-ft spacing vertically and every 6–8 ft horizontally. Without them, the wall can tip or bow.

Use the [calculator](/) to compare timber vs block vs concrete at your wall dimensions — the cost difference narrows as height increases.`,
  },
  {
    slug: "retaining-wall-maintenance-checklist",
    title: "Retaining Wall Maintenance: What to Check Each Year",
    description:
      "A simple annual retaining wall maintenance checklist catches small problems before they become expensive failures. For homeowners and contractors alike.",
    date: "2026-06-20",
    readMins: 5,
    body: `Most retaining walls fail because of neglected maintenance, not poor design. An annual check (ideally in spring after freeze-thaw cycles) takes 20 minutes and can prevent a $5,000–$15,000 repair.

## Annual inspection checklist

**Drainage (most critical):**
- [ ] Weep holes or drain outlets are clear and flowing (test with a garden hose at the top of the wall).
- [ ] No soil or mulch is blocking the base of the wall face.
- [ ] Downspouts and surface water are still directed *away* from the wall.

**Wall face and structure:**
- [ ] No visible bulging, bowing, or outward lean in any section.
- [ ] No wide cracks (hairline cracks in concrete are normal; cracks wider than 1/8" warrant investigation).
- [ ] Block, stone or timber units are still tightly seated — no dislodged pieces or open gaps.
- [ ] Cap blocks or coping are still bonded; no lifting or shifting.

**Top of wall (backfill side):**
- [ ] Grade still slopes *away* from the wall; no low spots where water pools.
- [ ] No signs of settlement in the soil directly behind the wall (a depression signals water erosion in the drainage layer).
- [ ] Trees or large shrubs are not pushing roots into the wall structure.

## When to call an engineer

A single bulge, a section of wall that has moved noticeably forward, widespread cracking, or any sign of foundation movement are all situations for a structural engineer — not a contractor with a laser level.

Early intervention is dramatically cheaper than replacement. The [calculator](/) can give you rough repair cost estimates based on the affected wall area.`,
  },
];

POSTS.push(...WEEK2_POSTS);

export function postBySlug(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
