// Lateral earth-pressure mechanics. Pure functions, no UI.
//
// Design basis: IBC §1610 + Table 1610.1 give the "design lateral soil load" as
// an equivalent-fluid pressure (EFP, psf per foot of depth). The lateral force
// behind a wall of retained height H is then the area of a triangle:
//
//     Pa = ½ · EFP · H²            (lb per linear foot of wall)
//
// acting at H/3 above the base. Surcharge and sloped backfill are added on top
// using classical Rankine theory, kept consistent with the code EFP by deriving
// an effective active coefficient Ka = EFP / γ.
import type { SoilType } from "./soil";

export const WATER_UNIT_WEIGHT = 62.4; // pcf

const deg = (d: number) => (d * Math.PI) / 180;

/** Rankine active coefficient for level backfill: Ka = tan²(45 − φ/2). */
export function rankineKa(phiDeg: number): number {
  const t = Math.tan(deg(45 - phiDeg / 2));
  return t * t;
}

/**
 * Rankine active coefficient for backfill sloped at β degrees above horizontal.
 * Ka(β) = cosβ · (cosβ − √(cos²β − cos²φ)) / (cosβ + √(cos²β − cos²φ)).
 * Falls back to the level value if the slope exceeds φ (unstable backfill).
 */
export function rankineKaSloped(phiDeg: number, betaDeg: number): number {
  if (betaDeg <= 0) return rankineKa(phiDeg);
  const b = deg(betaDeg);
  const p = deg(phiDeg);
  const cb = Math.cos(b);
  const root = Math.cos(b) ** 2 - Math.cos(p) ** 2;
  if (root <= 0) return rankineKa(phiDeg) * 2; // slope ≥ φ: not stable, penalise hard
  const s = Math.sqrt(root);
  return cb * ((cb - s) / (cb + s));
}

export interface PressureInput {
  soil: SoilType;
  height: number; // retained height H, ft
  restrained: boolean; // true → at-rest (wall cannot rotate, e.g. tied at top)
  slopeDeg: number; // backfill slope above wall, degrees (0 = level)
  surcharge: number; // uniform surcharge load on backfill, psf
  saturated: boolean; // true → no working drainage, full hydrostatic added
}

export interface PressureResult {
  efp: number; // effective equivalent-fluid pressure used (psf/ft)
  kaEff: number; // effective active coefficient (EFP / γ), incl. slope
  soilForce: number; // lb/ft from retained soil
  soilArm: number; // ft above base
  surchargeForce: number; // lb/ft
  surchargeArm: number;
  waterForce: number; // lb/ft (0 if drained)
  waterArm: number;
  totalH: number; // total horizontal force, lb/ft
  overturningMoment: number; // about the toe, ft-lb/ft
}

export function computePressure(inp: PressureInput): PressureResult {
  const { soil, height: H, restrained, slopeDeg, surcharge, saturated } = inp;

  // Code EFP, increased for a sloped backfill by the Rankine slope ratio.
  const baseEfp = restrained ? soil.efpAtRest : soil.efpActive;
  const slopeRatio = slopeDeg > 0 ? rankineKaSloped(soil.phi, slopeDeg) / rankineKa(soil.phi) : 1;
  const efp = baseEfp * Math.max(1, slopeRatio);
  const kaEff = efp / soil.gamma;

  const soilForce = 0.5 * efp * H * H;
  const soilArm = H / 3;

  // Uniform surcharge → rectangular lateral pressure Ka·q over full height.
  const surchargeForce = kaEff * surcharge * H;
  const surchargeArm = H / 2;

  // Hydrostatic only if drainage has failed (we always design WITH a drain).
  const waterForce = saturated ? 0.5 * WATER_UNIT_WEIGHT * H * H : 0;
  const waterArm = H / 3;

  const totalH = soilForce + surchargeForce + waterForce;
  const overturningMoment =
    soilForce * soilArm + surchargeForce * surchargeArm + waterForce * waterArm;

  return {
    efp,
    kaEff,
    soilForce,
    soilArm,
    surchargeForce,
    surchargeArm,
    waterForce,
    waterArm,
    totalH,
    overturningMoment,
  };
}

// Common surcharge presets (psf) drivers can pick instead of guessing a number.
export const SURCHARGE_PRESETS: { id: string; label: string; psf: number }[] = [
  { id: "none", label: "Nothing behind the wall", psf: 0 },
  { id: "patio", label: "Patio / foot traffic", psf: 100 },
  { id: "driveway", label: "Driveway / parked cars", psf: 250 },
  { id: "road", label: "Road / heavy vehicles", psf: 600 },
];
