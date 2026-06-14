// Wall stability — overturning, sliding and bearing checks for a gravity-type
// retaining wall (segmental block, poured-concrete gravity, or timber), plus a
// solver that finds the minimum base width that satisfies all three.
//
// Method (classical statics, taught in every foundation-engineering text):
//   • Self-weight W = γ_wall · B · H, acting at B/2 from the toe (rectangular
//     mass model — conservative for an SRW, which also gets soil weight on the
//     setback heel that we ignore on the safe side).
//   • Overturning about the toe:  FS_OT = W·(B/2) / overturningMoment ≥ 2.0
//   • Sliding:  FS_SL = W·μ / totalHorizontalForce ≥ 1.5
//   • Bearing:  resultant eccentricity e → max toe pressure ≤ allowable bearing.
// Target factors of safety follow NCMA "Design Manual for SRW" and IBC §1807.
import type { PressureResult } from "./earth-pressure";
import type { SoilType } from "./soil";

export const FS_OVERTURNING_MIN = 2.0;
export const FS_SLIDING_MIN = 1.5;

export interface WallType {
  id: string;
  label: string;
  /** Unit weight of the wall mass, pcf. */
  unitWeight: number;
  /** Base-friction coefficient against the foundation soil / leveling pad. */
  baseFriction: number;
  /** Practical maximum base-to-height ratio before a gravity wall is silly. */
  maxBaseRatio: number;
  blurb: string;
}

export const WALL_TYPES: WallType[] = [
  {
    id: "segmental",
    label: "Segmental block (SRW)",
    unitWeight: 120, // block + aggregate infill
    baseFriction: 0.55, // block on compacted crushed-stone leveling pad
    maxBaseRatio: 0.7,
    blurb: "Mortarless interlocking concrete blocks on a crushed-stone pad. The DIY favourite.",
  },
  {
    id: "concrete-gravity",
    label: "Poured concrete (gravity)",
    unitWeight: 150,
    baseFriction: 0.6,
    maxBaseRatio: 0.6,
    blurb: "A solid concrete mass wall. Heavy, so it needs less width.",
  },
  {
    id: "timber",
    label: "Timber / sleeper",
    unitWeight: 45,
    baseFriction: 0.45,
    maxBaseRatio: 0.85,
    blurb: "Stacked pressure-treated timbers or sleepers. Light, so it leans on deadman anchors above ~3 ft.",
  },
  {
    id: "boulder",
    label: "Boulder / rock",
    unitWeight: 130,
    baseFriction: 0.6,
    maxBaseRatio: 0.75,
    blurb: "Stacked natural boulders. The base course is buried; battered back into the slope.",
  },
];

export function wallTypeById(id: string): WallType {
  return WALL_TYPES.find((w) => w.id === id) ?? WALL_TYPES[0];
}

export interface StabilityCheck {
  baseWidth: number; // B, ft
  weight: number; // W, lb/ft
  fsOverturning: number;
  fsSliding: number;
  eccentricity: number; // ft
  middleThird: boolean; // e ≤ B/6 → no heel uplift
  bearingMax: number; // psf at toe
  bearingAllow: number; // psf
  bearingOk: boolean;
  passes: boolean;
}

/** Check a *specific* base width against the demand. */
export function checkStability(
  B: number,
  H: number,
  wall: WallType,
  foundation: SoilType,
  p: PressureResult,
): StabilityCheck {
  const weight = wall.unitWeight * B * H;
  const resistingMoment = weight * (B / 2);
  const fsOverturning = p.overturningMoment > 0 ? resistingMoment / p.overturningMoment : Infinity;
  const fsSliding = p.totalH > 0 ? (weight * wall.baseFriction) / p.totalH : Infinity;

  // Resultant location from the toe, eccentricity about the base centre.
  const netMoment = resistingMoment - p.overturningMoment;
  const a = weight > 0 ? netMoment / weight : 0; // distance of resultant from toe
  const eccentricity = B / 2 - a;
  // e ≤ B/6 keeps the resultant in the middle third (no heel uplift). The
  // boundary case e = B/6 is acceptable; a tiny epsilon avoids float fragility.
  const middleThird = Math.abs(eccentricity) <= B / 6 + 1e-9;

  let bearingMax: number;
  if (middleThird) {
    bearingMax = (weight / B) * (1 + (6 * Math.abs(eccentricity)) / B);
  } else {
    // Resultant outside the middle third → triangular pressure block.
    bearingMax = a > 0 ? (2 * weight) / (3 * a) : Infinity;
  }
  const bearingAllow = foundation.bearing;
  const bearingOk = bearingMax <= bearingAllow;

  const passes =
    fsOverturning >= FS_OVERTURNING_MIN &&
    fsSliding >= FS_SLIDING_MIN &&
    bearingOk &&
    middleThird;

  return {
    baseWidth: B,
    weight,
    fsOverturning,
    fsSliding,
    eccentricity,
    middleThird,
    bearingMax,
    bearingAllow,
    bearingOk,
    passes,
  };
}

export interface BaseSolution {
  found: boolean;
  check: StabilityCheck; // the recommended (or best-attempt) base
  governing: "overturning" | "sliding" | "bearing" | "uplift" | "none";
}

/**
 * Find the minimum base width (rounded up to the nearest 0.25 ft) that passes
 * every check, scanning from 0.3·H to maxBaseRatio·H. If nothing passes the wall
 * needs reinforcement / an engineer; we return the widest attempt and flag what
 * governs.
 */
export function solveBaseWidth(
  H: number,
  wall: WallType,
  foundation: SoilType,
  p: PressureResult,
): BaseSolution {
  const maxB = wall.maxBaseRatio * H;
  let best: StabilityCheck | null = null;
  for (let B = 0.3 * H; B <= maxB + 1e-9; B += 0.25) {
    const Br = Math.round(B * 4) / 4;
    const c = checkStability(Br, H, wall, foundation, p);
    best = c;
    if (c.passes) return { found: true, check: c, governing: "none" };
  }
  const c = best ?? checkStability(maxB, H, wall, foundation, p);
  let governing: BaseSolution["governing"] = "none";
  if (!c.middleThird) governing = "uplift";
  else if (!c.bearingOk) governing = "bearing";
  else if (c.fsSliding < FS_SLIDING_MIN) governing = "sliding";
  else if (c.fsOverturning < FS_OVERTURNING_MIN) governing = "overturning";
  return { found: false, check: c, governing };
}

export interface Reinforcement {
  needed: boolean;
  layers: number; // number of geogrid layers
  length: number; // geogrid embedment length Le, ft
  verticalSpacing: number; // ft between layers
}

/**
 * Geogrid estimate for a reinforced SRW when a gravity wall can't pass.
 * NCMA practice: grid length Le ≥ 0.6·H (min 4 ft); a layer roughly every two
 * 8-inch courses (~16 in). This is a planning estimate, not a final design.
 */
export function estimateReinforcement(H: number, gravityWorks: boolean): Reinforcement {
  if (gravityWorks) return { needed: false, layers: 0, length: 0, verticalSpacing: 0 };
  const verticalSpacing = 16 / 12; // ft
  const layers = Math.max(2, Math.ceil(H / verticalSpacing) - 1);
  // Round the 0.6·H minimum length UP to the nearest 0.25 ft (stay conservative).
  const length = Math.max(4, Math.ceil(0.6 * H * 4) / 4);
  return { needed: true, layers, length, verticalSpacing };
}
