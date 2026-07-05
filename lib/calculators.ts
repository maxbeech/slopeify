// Calculator variants. Each one renders the SAME designer engine but foregrounds
// a different job-to-be-done (cost, block count, base width, or a specific wall
// material) with its own copy, H1 and result emphasis, so every page earns its
// keyword instead of being a thin duplicate of the home page.
export type Focus = "design" | "cost" | "materials" | "base";

export interface CalcVariant {
  slug: string;
  title: string; // <title>
  h1: string;
  description: string; // meta + intro
  focus: Focus;
  presetWallType?: string;
  intro: string;
  bullets: string[];
}

export const CALCULATORS: CalcVariant[] = [
  {
    slug: "retaining-wall-cost-calculator",
    title: "Retaining Wall Cost Calculator",
    h1: "Retaining Wall Cost Calculator",
    description:
      "Estimate retaining wall cost by material, height and length, installed price range plus a DIY materials takeoff, adjusted for your state.",
    focus: "cost",
    intro:
      "Enter your wall and get an installed cost range plus a line-by-line materials cost, priced per square foot of wall face and adjusted by a regional cost index.",
    bullets: [
      "Installed cost range by material (block, concrete, timber, boulder)",
      "DIY materials cost with quantities",
      "Regional cost index for your state",
      "Reinforcement and drainage included",
    ],
  },
  {
    slug: "retaining-wall-blocks-calculator",
    title: "Retaining Wall Block Calculator",
    h1: "Retaining Wall Block Calculator",
    description:
      "How many retaining wall blocks, caps, base stone and drain rock do you need? Get a full materials takeoff for your wall.",
    focus: "materials",
    presetWallType: "segmental",
    intro:
      "Get an exact materials takeoff for a segmental block wall: blocks, caps, leveling-pad stone, drain rock, pipe, fabric and adhesive, all from your length and height.",
    bullets: [
      "Block and cap counts with a waste allowance",
      "Leveling pad + drainage stone in cubic yards",
      "Perforated pipe and filter fabric",
      "Geogrid when the wall needs reinforcement",
    ],
  },
  {
    slug: "retaining-wall-base-calculator",
    title: "Retaining Wall Base & Footing Calculator",
    h1: "Retaining Wall Base Width Calculator",
    description:
      "Find the minimum base width for a stable gravity retaining wall, solved for the overturning, sliding and bearing factors of safety.",
    focus: "base",
    intro:
      "We solve for the minimum base width that gives a factor of safety of at least 2.0 against overturning, 1.5 against sliding, and keeps bearing under the allowable soil pressure.",
    bullets: [
      "Minimum base width for a stable gravity wall",
      "Overturning, sliding and bearing factors of safety",
      "Resultant kept in the middle third (no heel uplift)",
      "Flags when geogrid reinforcement is required",
    ],
  },
  {
    slug: "segmental-block-retaining-wall-calculator",
    title: "Segmental Block (SRW) Retaining Wall Calculator",
    h1: "Segmental Block Retaining Wall Calculator",
    description:
      "Design and price a segmental (SRW) block retaining wall, base width, geogrid, block count and cost.",
    focus: "design",
    presetWallType: "segmental",
    intro:
      "The DIY favourite: mortarless interlocking blocks on a crushed-stone pad. Get the base width, whether you need geogrid, the block count and the cost.",
    bullets: [
      "Base width and stability factors of safety",
      "Geogrid layers and length when needed",
      "Full block + drainage materials takeoff",
      "Installed cost range and DIY cost",
    ],
  },
  {
    slug: "concrete-retaining-wall-calculator",
    title: "Concrete Retaining Wall Calculator",
    h1: "Concrete Retaining Wall Calculator",
    description:
      "Design and price a poured-concrete gravity retaining wall, earth pressure, base width, stability and cost.",
    focus: "design",
    presetWallType: "concrete-gravity",
    intro:
      "A solid concrete mass wall, strongest and the smallest footprint at height, but it needs formwork and usually an engineer. Get the base width, stability and cost.",
    bullets: [
      "Lateral earth pressure and overturning / sliding / bearing checks",
      "Minimum base width for the concrete mass",
      "Installed cost range per square foot of face",
      "Permit / engineering flag above 4 ft",
    ],
  },
  {
    slug: "timber-retaining-wall-calculator",
    title: "Timber Retaining Wall Calculator",
    h1: "Timber / Sleeper Retaining Wall Calculator",
    description:
      "Design and price a timber or sleeper retaining wall, base width, stability, materials and cost.",
    focus: "design",
    presetWallType: "timber",
    intro:
      "Cheapest and fastest for short walls. Get the base width, stability factors of safety and a cost estimate, and a clear flag when a timber wall needs deadman anchors or an engineer.",
    bullets: [
      "Base width and stability for a timber mass wall",
      "Cost range per square foot of face",
      "Drainage materials included",
      "Warns past the practical height for stacked timber",
    ],
  },
  {
    slug: "boulder-retaining-wall-calculator",
    title: "Boulder Retaining Wall Calculator",
    h1: "Boulder / Rock Retaining Wall Calculator",
    description:
      "Design and price a boulder retaining wall, base width, stability and cost for stacked natural stone.",
    focus: "design",
    presetWallType: "boulder",
    intro:
      "Stacked natural boulders battered into the slope, durable and natural-looking, but they need a wide base and machinery. Get the base width, stability and cost.",
    bullets: [
      "Base width and stability factors of safety",
      "Cost range per square foot of face",
      "Drainage materials included",
      "Permit / engineering flag above 4 ft",
    ],
  },
];

export function calcBySlug(slug: string): CalcVariant | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}
