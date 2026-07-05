// Top-level design orchestrator: turns a set of plain inputs into a complete,
// code-grounded retaining-wall result. This is the single source of truth the UI,
// the share-URL and the tests all call.
import { computePressure, type PressureResult } from "./earth-pressure";
import { computeMaterials, blockSizeById, type MaterialsResult } from "./materials";
import { permitVerdict, type PermitVerdict } from "./permit";
import { soilById, foundationById, type SoilType } from "./soil";
import { STATES, stateBySlug, footingDepthInches } from "./states";
import {
  estimateReinforcement,
  solveBaseWidth,
  wallTypeById,
  type BaseSolution,
  type Reinforcement,
  type WallType,
} from "./wall";

export interface DesignInputs {
  heightFt: number; // retained height H
  lengthFt: number; // wall run length
  backfillSoilId: string;
  foundationSoilId: string;
  wallTypeId: string;
  slopeDeg: number; // backfill slope (0 = level)
  surcharge: number; // psf
  restrained: boolean; // at-rest vs active
  saturated: boolean; // drainage failed?
  stateSlug: string; // for cost index + permit page
  blockSizeId: string; // SRW unit size (segmental walls only)
}

export const DEFAULT_INPUTS: DesignInputs = {
  heightFt: 4,
  lengthFt: 30,
  backfillSoilId: "sand",
  foundationSoilId: "sand",
  wallTypeId: "segmental",
  slopeDeg: 0,
  surcharge: 0,
  restrained: false,
  saturated: false,
  stateSlug: "california",
  blockSizeId: "standard",
};

export interface DesignResult {
  inputs: DesignInputs;
  backfill: SoilType;
  foundation: SoilType;
  wall: WallType;
  pressure: PressureResult;
  base: BaseSolution;
  reinforcement: Reinforcement;
  materials: MaterialsResult;
  permit: PermitVerdict;
  costIndex: number;
  frostDepth: number; // inches
  footingDepth: number; // inches below grade (max of frost, embedment, 12")
  warnings: string[];
}

export function clampInputs(i: DesignInputs): DesignInputs {
  return {
    ...i,
    heightFt: clamp(i.heightFt, 1, 30),
    lengthFt: clamp(i.lengthFt, 1, 2000),
    slopeDeg: clamp(i.slopeDeg, 0, 34),
    surcharge: clamp(i.surcharge, 0, 2000),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

export function designWall(raw: DesignInputs): DesignResult {
  const inputs = clampInputs(raw);
  const backfill = soilById(inputs.backfillSoilId);
  const foundation = foundationById(inputs.foundationSoilId);
  const wall = wallTypeById(inputs.wallTypeId);
  const costIndex = STATES.find((s) => s.slug === inputs.stateSlug)?.costIndex ?? 1.0;

  const pressure = computePressure({
    soil: backfill,
    height: inputs.heightFt,
    restrained: inputs.restrained,
    slopeDeg: inputs.slopeDeg,
    surcharge: inputs.surcharge,
    saturated: inputs.saturated,
  });

  const base = solveBaseWidth(inputs.heightFt, wall, foundation, pressure);
  const reinforcement = estimateReinforcement(inputs.heightFt, base.found);
  const materials = computeMaterials({
    lengthFt: inputs.lengthFt,
    heightFt: inputs.heightFt,
    baseWidthFt: base.check.baseWidth,
    wallTypeId: inputs.wallTypeId,
    reinforcement,
    costIndex,
    blockFaceSqFt: blockSizeById(inputs.blockSizeId),
  });
  const permit = permitVerdict({
    height: inputs.heightFt,
    surcharge: inputs.surcharge,
    slopeDeg: inputs.slopeDeg,
  });
  const frostDepth = stateBySlug(inputs.stateSlug)?.frost ?? 36;
  const footingDepth = footingDepthInches(inputs.stateSlug, inputs.heightFt);

  const warnings: string[] = [];
  if (!backfill.suitableBackfill) {
    warnings.push(
      `${backfill.label} is not a recommended backfill, it drains poorly and pushes harder. Most engineers replace it with clean granular fill behind the wall.`,
    );
  }
  if (inputs.saturated) {
    warnings.push(
      "You marked drainage as failed/saturated, which roughly doubles the load with hydrostatic pressure. A working drain (drain rock + perforated pipe) is the single most important detail, design for it.",
    );
  }
  if (!base.found) {
    warnings.push(
      reinforcement.needed
        ? "A simple gravity wall can't pass the checks at this height/soil, it needs geogrid reinforcement (a reinforced SRW) or an engineered cantilever wall. The estimate below assumes reinforcement."
        : "This wall does not pass the stability checks. Reduce the height, improve the soil/drainage, or have it engineered.",
    );
  }
  if (permit.engineeringRequired) {
    warnings.push(
      "This wall needs an engineered, stamped design and almost certainly a permit. Use this estimate to plan and budget, then hire a licensed engineer.",
    );
  }

  return {
    inputs,
    backfill,
    foundation,
    wall,
    pressure,
    base,
    reinforcement,
    materials,
    permit,
    costIndex,
    frostDepth,
    footingDepth,
    warnings,
  };
}
