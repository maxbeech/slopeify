// Materials takeoff + cost. Quantities are derived from wall geometry; unit
// costs are representative 2026 US retail figures and the installed $/sq-ft
// ranges are typical published ranges (HomeAdvisor / Angi style), scaled by a
// per-state regional cost index. All clearly labelled as estimates.
import type { Reinforcement } from "./wall";

// One representative SRW unit faces 8 in high × 18 in wide = 1.0 sq ft of face.
const BLOCK_FACE_SQFT = 1.0;
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
  const faceArea = L * H;
  const lines: MaterialLine[] = [];
  const push = (item: string, qty: number, unit: string, unitCost: number) =>
    lines.push({ item, qty: Math.ceil(qty), unit, cost: Math.round(Math.ceil(qty) * unitCost * costIndex) , unitCost });

  const blockBased = wallTypeId === "segmental";
  if (blockBased) {
    push("Retaining wall blocks", (faceArea / BLOCK_FACE_SQFT) * WASTE, "blocks", UNIT.block);
    push("Cap blocks", L * WASTE, "caps", UNIT.cap);
    push("Construction adhesive", L / 6, "tubes", UNIT.adhesiveTube);
  }

  // Leveling pad: (B + 0.5 ft) wide × 6 in deep × length.
  const padCuYd = ((B + 0.5) * 0.5 * L) / 27;
  push("Crushed-stone leveling pad", padCuYd, "cu yd", UNIT.gravelCuYd);

  // Drainage chimney: 12 in wide × full height × length.
  const drainCuYd = (1 * H * L) / 27;
  push("Drainage stone (¾\" clean)", drainCuYd, "cu yd", UNIT.drainStoneCuYd);

  push("Perforated drain pipe (4\")", L * 1.1, "ft", UNIT.drainPipeFt);

  // Filter fabric wraps the drain zone: ~ (H + 2) × L.
  push("Filter fabric", (H + 2) * L, "sq ft", UNIT.fabricSqFt);

  if (reinforcement.needed) {
    const grid = reinforcement.layers * reinforcement.length * L;
    push("Geogrid reinforcement", grid * WASTE, "sq ft", UNIT.geogridSqFt);
  }

  const materialsCost = lines.reduce((s, l) => s + l.cost, 0);

  const [lo, hi] = INSTALLED_PER_SQFT[wallTypeId] ?? INSTALLED_PER_SQFT.segmental;
  const reinFactor = reinforcement.needed ? 1.3 : 1;
  const installedLow = Math.round(faceArea * lo * costIndex * reinFactor);
  const installedHigh = Math.round(faceArea * hi * costIndex * reinFactor);

  return { faceArea, lines, materialsCost, installedLow, installedHigh };
}
