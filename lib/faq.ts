// FAQ entries, rendered on the home page and emitted as FAQPage JSON-LD for
// rich results. Answers are grounded in the same codes the engine uses.
export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: "How tall can a retaining wall be without a permit or engineer?",
    a: "The common code line is 4 feet. IRC R404.1 and IBC §1807.2 call for an engineered design once a wall retains more than 4 ft of earth, and at ANY height if there is a surcharge (a driveway, slope, or structure pressing on the backfill). Most building departments require a permit at the same 4-ft point, though some require one for any retaining wall. Always confirm with your local building department.",
  },
  {
    q: "What is the minimum base width for a retaining wall?",
    a: "For a gravity wall (segmental block, stacked stone, concrete mass) a useful rule of thumb is a base depth of about 0.5-0.7 times the wall height. Our calculator solves for the exact minimum width that gives a factor of safety of at least 2.0 against overturning, 1.5 against sliding, and keeps the bearing pressure under the allowable soil value, so you get a number, not a guess.",
  },
  {
    q: "When does a retaining wall need geogrid?",
    a: "When a gravity wall can't pass the stability checks, usually above about 4 ft, on weak or clay soils, or with a surcharge, you reinforce it with geogrid, turning the soil itself into a stable mass (a reinforced SRW). As a rule the geogrid layers extend back into the slope at least 0.6 times the wall height. Our tool flags when reinforcement is needed and estimates the layers and length.",
  },
  {
    q: "What soil pressure does a retaining wall have to resist?",
    a: "Soil behaves like a heavy fluid pushing on the wall. IBC Table 1610.1 gives the design lateral load as an equivalent fluid pressure, 30 pcf for clean sand or gravel, up to 60 pcf for clayey soils. The total push is ½ × (that pressure) × height², acting one-third of the way up. Poor drainage adds water pressure on top and can double the load.",
  },
  {
    q: "Why is drainage the most important part of a retaining wall?",
    a: "Walls fail far more often from water than from soil. Trapped water adds hydrostatic pressure (62.4 pcf, heavier than most soils) and saturates the backfill so it pushes harder. A drainage system (clean drain rock behind the wall, a perforated pipe at the base daylighted to the surface, and filter fabric) keeps the design loads valid. Every estimate here includes it.",
  },
  {
    q: "How much does a retaining wall cost?",
    a: "Installed, most walls run about $30-$60 per square foot of wall face for segmental block, $40-$75 for poured concrete, $20-$40 for timber, and $25-$55 for boulders. Reinforced and engineered walls cost more. Our calculator multiplies the face area by these ranges and a regional cost index, and also lists a DIY materials takeoff.",
  },
  {
    q: "Is this calculator a substitute for an engineer?",
    a: "No. It uses real, code-based methods (IBC Tables 1610.1 and 1806.2, Rankine earth pressure, classical stability) to give you a defensible planning estimate and a materials list. Walls over 4 ft, walls with a surcharge, and any wall you're unsure about must be designed and stamped by a licensed engineer and permitted locally.",
  },
];
