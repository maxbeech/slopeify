// Permit logic. The threshold is grounded in the model codes, NOT invented:
//
//  • IRC R404.1 / IBC §1807.2 require *engineered design* for any wall retaining
//    earth where the difference in ground level exceeds 4 ft, OR where the wall
//    supports a surcharge (slope, driveway, structure) at any height.
//  • Most local building departments require a *permit* at or above the same
//    4-ft line; many use 3 ft or 4 ft of exposed height. Exact local thresholds
//    vary, so we present the code baseline and tell people to confirm locally.
//
// We never fabricate a specific city ordinance — we state the universal rule and
// the conditions (height, surcharge, slope) that trigger it.

export const ENGINEERING_HEIGHT_FT = 4; // IRC R404.1 / IBC 1807.2.3

export interface PermitVerdict {
  permitLikely: boolean;
  engineeringRequired: boolean;
  reasons: string[];
}

export function permitVerdict(opts: {
  height: number; // retained height, ft
  surcharge: number; // psf
  slopeDeg: number;
}): PermitVerdict {
  const reasons: string[] = [];
  const tallerThanThreshold = opts.height > ENGINEERING_HEIGHT_FT;
  const hasSurcharge = opts.surcharge > 0;
  const hasSlope = opts.slopeDeg > 0;

  if (tallerThanThreshold) {
    reasons.push(
      `The wall retains more than ${ENGINEERING_HEIGHT_FT} ft of earth, so IRC R404.1 / IBC §1807.2 call for an engineered design.`,
    );
  }
  if (hasSurcharge) {
    reasons.push(
      "There is a surcharge (driveway, slope or structure) behind the wall — the codes drop the engineering trigger to any height when a surcharge is present.",
    );
  }
  if (hasSlope) {
    reasons.push("The backfill is sloped, which adds load and commonly lowers the local permit threshold.");
  }
  if (reasons.length === 0) {
    reasons.push(
      `At ${opts.height} ft with no surcharge, many jurisdictions exempt the wall from a permit — but always confirm with your local building department, as some require one for any retaining wall.`,
    );
  }

  const engineeringRequired = tallerThanThreshold || hasSurcharge;
  const permitLikely = engineeringRequired || opts.height >= 3;
  return { permitLikely, engineeringRequired, reasons };
}
