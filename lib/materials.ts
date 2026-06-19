// Materials takeoff + cost. Quantities are derived from wall geometry; unit
// costs are representative 2026 US retail figures and the installed $/sq-ft
// ranges are typical published ranges (HomeAdvisor / Angi style), scaled by a
// per-state regional cost index. All clearly labelled as estimates.
import type { Reinforcement } from "./wall";

export const DEFAULT_BLOCK_FACE_SQFT = 1.0; // standard SRW unit, 8″H × 18″W
const WASTE = 1.05; // 5% cutting / breakage allowance

export interface MaterialLine {
  item: string;
  qty: number;
  unit: string;
  unitCost: number;
  cost: number;
}

export interface CostInputs {
  lengthFt: number;
  heightFt: number;
  baseWidthFt: number;
  wallTypeId: string;
  reinforcement: Reinforcement;
  costIndex: number; // 1.0 = US average
  blockFaceSqFt?: number; // face area of one block, for segmental walls
}

// Installed cost ranges, $/sq-ft of wall face, by wall type (US average).
const INSTALLED_PER_SQFT: Record<string, [number, number]> = {
  segmental: [30, 60],
  "concrete-gravity": [40, 75],
  timber: [20, 40],
  boulder: [25, 55],
};

const UNIT = {
  block: 6.5,
  cap: 8.0,
  concreteCuYd: 175, // ready-mix delivered
  rebarLb: 1.1,
  timber: 26, // 6×6×8 ft pressure-treated
  boulderTon: 130, // delivered landscape boulders
  gravelCuYd: 50,
  drainStoneCuYd: 55,
  drainPipeFt: 1.75,
  geogridSqFt: 1.5,
  fabricSqFt: 0.4,
  adhesiveTube: 9,
};

export interface MaterialsResult {
  faceArea: number;
  lines: MaterialLine[];
  materialsCost: number; // DIY materials only
  installedLow: number;
  installedHigh: number;
}

export function computeMaterials(c: CostInputs): MaterialsResult {
  const { lengthFt: L, heightFt: H, baseWidthFt: B, wallTypeId, reinforcement, costIndex } = c;
  const blockFace = c.blockFaceSqFt && c.blockFaceSqFt > 0 ? c.blockFaceSqFt : DEFAULT_BLOCK_FACE_SQFT;
  const faceArea = L * H;
  const lines: MaterialLine[] = [];
  const push = (item: string, qty: number, unit: string, unitCost: number) =>
    lines.push({ item, qty: Math.ceil(qty), unit, cost: Math.round(Math.ceil(qty) * unitCost * costIndex), unitCost });

  // --- Primary wall material (one branch per wall type) ---
  if (wallTypeId === "segmental") {
    push("Retaining wall blocks", (faceArea / blockFace) * WASTE, "blocks", UNIT.block);
    push("Cap blocks", L * WASTE, "caps", UNIT.cap);
    push("Construction adhesive", L / 6, "tubes", UNIT.adhesiveTube);
  } else if (wallTypeId === "concrete-gravity") {
    // Concrete mass = base width × height × length (the stem/footing block).
    push("Ready-mix concrete", (B * H * L) / 27, "cu yd", UNIT.concreteCuYd);
    // Light reinforcement ~ 0.5 lb per cubic foot of concrete (planning figure).
    push("Reinforcing steel (rebar)", B * H * L * 0.5, "lb", UNIT.rebarLb);
  } else if (wallTypeId === "timber") {
    // 6×6 timbers face 6 in high × 8 ft long ≈ 4 sq ft of face each, plus
    // deadman tiebacks (~1 per 6 ft of length per 4 ft of height).
    push("6×6 pressure-treated timbers", (faceArea / 4) * WASTE, "timbers", UNIT.timber);
    push("Deadman tieback timbers", (L / 6) * Math.max(1, H / 4), "timbers", UNIT.timber);
  } else if (wallTypeId === "boulder") {
    // Boulder volume = base × height × length, at ~150 pcf → tons.
    push("Landscape boulders", (B * H * L * 150) / 2000, "tons", UNIT.boulderTon);
  }

  // --- Common to every wall: base, drainage, fabric ---
  // Leveling pad: (B + 0.5 ft) wide × 6 in deep × length.
  push("Crushed-stone leveling pad", ((B + 0.5) * 0.5 * L) / 27, "cu yd", UNIT.gravelCuYd);
  // Drainage chimney: 12 in wide × full height × length.
  push("Drainage stone (¾\" clean)", (1 * H * L) / 27, "cu yd", UNIT.drainStoneCuYd);
  push("Perforated drain pipe (4\")", L * 1.1, "ft", UNIT.drainPipeFt);
  // Filter fabric wraps the drain zone: ~ (H + 2) × L.
  push("Filter fabric", (H + 2) * L, "sq ft", UNIT.fabricSqFt);

  if (reinforcement.needed) {
    push("Geogrid reinforcement", reinforcement.layers * reinforcement.length * L * WASTE, "sq ft", UNIT.geogridSqFt);
  }

  const materialsCost = lines.reduce((s, l) => s + l.cost, 0);

  const [lo, hi] = INSTALLED_PER_SQFT[wallTypeId] ?? INSTALLED_PER_SQFT.segmental;
  const reinFactor = reinforcement.needed ? 1.3 : 1;
  const installedLow = Math.round(faceArea * lo * costIndex * reinFactor);
  const installedHigh = Math.round(faceArea * hi * costIndex * reinFactor);

  return { faceArea, lines, materialsCost, installedLow, installedHigh };
}

// Common real SRW unit sizes (face area, sq ft) the block calculator can use.
export const BLOCK_SIZES: { id: string; label: string; faceSqFt: number }[] = [
  { id: "standard", label: "Standard SRW — 8″H × 18″W", faceSqFt: 1.0 },
  { id: "jumbo", label: "Jumbo SRW — 8″H × 12″W", faceSqFt: 0.667 },
  { id: "garden", label: "Garden wall — 4″H × 12″W", faceSqFt: 0.333 },
  { id: "big", label: "Big block — 6″H × 18″W", faceSqFt: 0.75 },
];
export function blockSizeById(id: string): number {
  return BLOCK_SIZES.find((b) => b.id === id)?.faceSqFt ?? DEFAULT_BLOCK_FACE_SQFT;
}
