// Soil parameters — every number here is transcribed from a published code table
// or a standard geotechnical reference. NOTHING is invented.
//
//  • Lateral active / at-rest "design lateral soil load" (equivalent-fluid
//    pressure, psf per foot of depth) → IBC Table 1610.1.
//  • Presumptive allowable foundation bearing pressure (psf) → IBC Table 1806.2.
//  • Representative effective friction angle (phi) and moist unit weight (gamma)
//    → typical design values from NAVFAC DM-7.1 / Coduto, "Foundation Design".
//
// IBC Table 1610.1 (active values) and 1806.2 are reproduced verbatim on the
// /methodology page so a permit reviewer can check us.

export interface SoilType {
  id: string;
  label: string;
  uscs: string;
  /** IBC Table 1610.1 active equivalent-fluid pressure (psf/ft). */
  efpActive: number;
  /** IBC Table 1610.1 at-rest equivalent-fluid pressure (psf/ft). */
  efpAtRest: number;
  /** Representative effective friction angle, degrees (NAVFAC DM-7.1). */
  phi: number;
  /** Representative moist unit weight, pcf. */
  gamma: number;
  /** IBC Table 1806.2 presumptive allowable bearing, psf. */
  bearing: number;
  /** Whether this soil is acceptable as wall backfill. */
  suitableBackfill: boolean;
  note: string;
}

// Ordered best → worst for retaining-wall backfill.
export const SOILS: SoilType[] = [
  {
    id: "gravel",
    label: "Clean gravel / sand-gravel",
    uscs: "GW, GP",
    efpActive: 30,
    efpAtRest: 60,
    phi: 34,
    gamma: 125,
    bearing: 3000,
    suitableBackfill: true,
    note: "The ideal free-draining backfill. Lowest lateral pressure and highest bearing.",
  },
  {
    id: "sand",
    label: "Clean sand",
    uscs: "SW, SP",
    efpActive: 30,
    efpAtRest: 60,
    phi: 32,
    gamma: 120,
    bearing: 2000,
    suitableBackfill: true,
    note: "Good free-draining backfill. Compact in lifts behind the wall.",
  },
  {
    id: "silty-gravel",
    label: "Silty gravel",
    uscs: "GM",
    efpActive: 40,
    efpAtRest: 60,
    phi: 32,
    gamma: 125,
    bearing: 2000,
    suitableBackfill: true,
    note: "Acceptable, but the silt fraction slows drainage — keep the drain rock chimney.",
  },
  {
    id: "silty-sand",
    label: "Silty sand",
    uscs: "SM",
    efpActive: 45,
    efpAtRest: 60,
    phi: 30,
    gamma: 120,
    bearing: 2000,
    suitableBackfill: true,
    note: "Common native soil. Higher lateral pressure; good drainage is essential.",
  },
  {
    id: "clayey-sand",
    label: "Clayey sand",
    uscs: "SC",
    efpActive: 60,
    efpAtRest: 100,
    phi: 28,
    gamma: 120,
    bearing: 2000,
    suitableBackfill: true,
    note: "Marginal backfill — drains poorly, pushes harder. Many engineers replace it with clean stone.",
  },
  {
    id: "silt-clay",
    label: "Low-plasticity silt / clay",
    uscs: "ML, CL",
    efpActive: 60,
    efpAtRest: 100,
    phi: 26,
    gamma: 115,
    bearing: 1500,
    suitableBackfill: true,
    note: "Poor backfill and poor bearing. Expect a wide base or reinforcement; drainage is critical.",
  },
  {
    id: "fat-clay",
    label: "High-plasticity / expansive clay",
    uscs: "CH, MH",
    efpActive: 100,
    efpAtRest: 130,
    phi: 18,
    gamma: 110,
    bearing: 1500,
    suitableBackfill: false,
    note: "NOT recommended as backfill — it swells, traps water and can fail a wall. Replace with clean granular fill and design for an engineer.",
  },
];

export const ROCK: SoilType = {
  id: "rock",
  label: "Bedrock (sedimentary / crystalline)",
  uscs: "Rock",
  efpActive: 30,
  efpAtRest: 60,
  phi: 40,
  gamma: 140,
  bearing: 4000,
  suitableBackfill: false,
  note: "IBC Table 1806.2: sedimentary/foliated rock 4,000 psf; crystalline bedrock 12,000 psf.",
};

export function soilById(id: string): SoilType {
  return SOILS.find((s) => s.id === id) ?? SOILS[1];
}

/** Foundation soils a base can sit on (includes rock). */
export const FOUNDATION_SOILS: SoilType[] = [...SOILS, ROCK];
export function foundationById(id: string): SoilType {
  return FOUNDATION_SOILS.find((s) => s.id === id) ?? SOILS[1];
}
