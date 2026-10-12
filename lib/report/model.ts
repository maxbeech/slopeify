// The paid design report as plain data. It is built from one thing only: the
// DesignResult that designWall() returns for the buyer's inputs. No number is
// typed in here; every figure is read from that result, and every sentence either
// restates a formula the engine uses or a code citation already on /methodology.
//
// The model is rendered twice from the same object: as HTML on the success page
// (components/ReportView.tsx) and as the PDF (lib/report/pdf.ts). Because both
// read this, what the buyer sees on screen is what is in the file.
import { BLOCK_SIZES } from "../materials";
import { WATER_UNIT_WEIGHT } from "../earth-pressure";
import { SITE } from "../site";
import { stateBySlug } from "../states";
import { FS_OVERTURNING_MIN, FS_SLIDING_MIN } from "../wall";
import type { DesignResult } from "../design";
import { buildNextSteps, permitHeadline, verdictFor, type Verdict } from "../result-text";
import { fix, int, money } from "./format";
import { describeWall } from "./purchase";

export type Status = "pass" | "fail";

export interface Row {
  label: string;
  value: string;
  /** Short qualifier shown under the value. */
  note?: string;
  status?: Status;
}

export interface CalcStep {
  label: string;
  /** The formula with this wall's numbers substituted in. */
  expression: string;
  result: string;
  status?: Status;
}

export interface TableColumn {
  label: string;
  align: "left" | "right";
}

export type ReportSection =
  | { kind: "rows"; title: string; intro?: string; rows: Row[] }
  | { kind: "steps"; title: string; intro?: string; steps: CalcStep[] }
  | { kind: "table"; title: string; columns: TableColumn[]; rows: string[][]; foot: string[][]; note?: string }
  | { kind: "bullets"; title: string; items: string[] }
  | { kind: "diagram"; title: string; caption: string };

export interface ReportModel {
  title: string;
  /** One line naming the wall. */
  subtitle: string;
  reference: string;
  /** YYYY-MM-DD the report was issued (the purchase date). */
  issuedOn: string;
  verdict: Verdict;
  sections: ReportSection[];
  disclaimer: string[];
}

export interface ReportMeta {
  reference: string;
  issuedOn: string;
}

const pf = (n: number) => `${fix(n, 1)} psf per ft`;

/** The engine returns Infinity when the resultant falls outside the base: say that, not "n/a". */
const bearingPressure = (psf: number) => (Number.isFinite(psf) ? `${int(psf)} psf` : "Not stable");

const GOVERNING: Record<string, string> = {
  overturning: "overturning",
  sliding: "sliding",
  bearing: "bearing pressure",
  uplift: "resultant outside the middle third (heel uplift)",
  none: "none",
};

export function buildReport(r: DesignResult, meta: ReportMeta): ReportModel {
  const list: ReportSection[] = [
    atAGlance(r),
    designInputs(r),
    { kind: "diagram", title: "Cross-section", caption: `${wallCaption(r)} Dimensions are the calculated values.` },
    lateralPressure(r),
    stability(r),
    footing(r),
    ...(r.reinforcement.needed ? [reinforcement(r)] : []),
    permit(r),
    // Notes come before the cost section on purpose: the engine's own warning text
    // says "the estimate below assumes reinforcement", which must stay true here.
    notes(r),
    materials(r),
    references(r),
  ];

  return {
    title: "Retaining wall design report",
    subtitle: describeWall(r.inputs),
    reference: meta.reference,
    issuedOn: meta.issuedOn,
    verdict: verdictFor(r),
    sections: list.map((s, i) => ({ ...s, title: `${i + 1}. ${s.title}` })),
    disclaimer: [
      "This report is a planning document produced by an online calculator. It is not a stamped engineering design.",
      "A wall that retains more than 4 ft of earth, or any wall that carries a surcharge, needs a licensed engineer's stamped design and a local permit (IRC R404.1 / IBC §1807.2). Confirm local requirements with your building department before you build.",
      "Costs are estimates from typical published ranges scaled by a regional index. Get exact pricing from a local contractor.",
    ],
  };
}

function wallCaption(r: DesignResult): string {
  return `Schematic cross-section of a ${r.inputs.heightFt} ft wall on a ${r.base.check.baseWidth} ft base.`;
}

function atAGlance(r: DesignResult): ReportSection {
  const c = r.base.check;
  const v = verdictFor(r);
  return {
    kind: "rows",
    title: "Result at a glance",
    rows: [
      { label: "Verdict", value: v.title, note: v.sub, status: r.base.found ? "pass" : undefined },
      { label: r.base.found ? "Minimum base width" : "Widest base tried", value: `${fix(c.baseWidth)} ft` },
      { label: "Bury the base below grade", value: `${r.footingDepth} in`, note: "Below the frost line for your state" },
      { label: "Lateral earth pressure (EFP)", value: pf(r.pressure.efp) },
      { label: "Total horizontal force", value: `${int(r.pressure.totalH)} lb per ft of wall` },
      { label: `Overturning factor of safety (min ${FS_OVERTURNING_MIN})`, value: fix(c.fsOverturning), status: c.fsOverturning >= FS_OVERTURNING_MIN ? "pass" : "fail" },
      { label: `Sliding factor of safety (min ${FS_SLIDING_MIN})`, value: fix(c.fsSliding), status: c.fsSliding >= FS_SLIDING_MIN ? "pass" : "fail" },
      {
        label: "Bearing: maximum vs allowable",
        value: Number.isFinite(c.bearingMax) ? `${int(c.bearingMax)} / ${int(c.bearingAllow)} psf` : `Not stable (allowable ${int(c.bearingAllow)} psf)`,
        status: c.bearingOk ? "pass" : "fail",
      },
      { label: "Permit", value: permitHeadline(r.permit) },
      { label: "Estimated installed cost", value: `${money(r.materials.installedLow)} to ${money(r.materials.installedHigh)}` },
    ],
  };
}

function designInputs(r: DesignResult): ReportSection {
  const i = r.inputs;
  const state = stateBySlug(i.stateSlug);
  const rows: Row[] = [
    { label: "Retained height", value: `${i.heightFt} ft` },
    { label: "Wall length", value: `${int(i.lengthFt)} ft` },
    { label: "Wall type", value: r.wall.label },
  ];
  if (i.wallTypeId === "segmental") {
    const block = BLOCK_SIZES.find((b) => b.id === i.blockSizeId);
    if (block) rows.push({ label: "Block size", value: block.label });
  }
  rows.push(
    { label: "Backfill soil", value: `${r.backfill.label} (${r.backfill.uscs})` },
    { label: "Foundation soil", value: `${r.foundation.label} (${int(r.foundation.bearing)} psf allowable)` },
    { label: "Backfill slope", value: i.slopeDeg > 0 ? `${i.slopeDeg} degrees` : "Level" },
    { label: "Surcharge behind the wall", value: i.surcharge > 0 ? `${int(i.surcharge)} psf` : "None" },
    { label: "Pressure case", value: i.restrained ? "At-rest (wall restrained at the top)" : "Active" },
    { label: "Drainage", value: i.saturated ? "No working drainage (hydrostatic pressure added)" : "Drained (drain rock and perforated pipe)" },
  );
  if (state) rows.push({ label: "State", value: state.name, note: `${state.code}. Cost index ${fix(state.costIndex)} (1.00 is the US average).` });
  return { kind: "rows", title: "Design inputs", rows };
}

function lateralPressure(r: DesignResult): ReportSection {
  const p = r.pressure;
  const H = r.inputs.heightFt;
  const q = r.inputs.surcharge;
  const baseEfp = r.inputs.restrained ? r.backfill.efpAtRest : r.backfill.efpActive;
  const factor = baseEfp > 0 ? p.efp / baseEfp : 1;
  const steps: CalcStep[] = [
    {
      label: `Code lateral soil load, ${r.inputs.restrained ? "at-rest" : "active"}`,
      expression: `IBC Table 1610.1, ${r.backfill.label} (${r.backfill.uscs})`,
      result: pf(baseEfp),
    },
  ];
  if (r.inputs.slopeDeg > 0) {
    steps.push({
      label: "Sloped-backfill increase",
      expression: `Rankine ratio for a ${r.inputs.slopeDeg} degree slope, applied only when above 1.00`,
      result: `x ${fix(factor, 3)}`,
    });
  }
  steps.push(
    {
      label: "Design equivalent-fluid pressure (EFP)",
      expression: r.inputs.slopeDeg > 0 ? `${baseEfp} x ${fix(factor, 3)}` : "Level backfill, no increase",
      result: pf(p.efp),
    },
    {
      label: "Effective active coefficient Ka",
      expression: `EFP / unit weight = ${fix(p.efp, 1)} / ${r.backfill.gamma} pcf`,
      result: fix(p.kaEff, 3),
    },
    { label: "Soil force Pa", expression: `0.5 x ${fix(p.efp, 1)} x ${H}^2`, result: `${int(p.soilForce)} lb/ft` },
    { label: "Soil force acts above the base at", expression: `H / 3 = ${H} / 3`, result: `${fix(p.soilArm)} ft` },
  );
  if (q > 0) {
    steps.push(
      { label: "Surcharge force", expression: `Ka x q x H = ${fix(p.kaEff, 3)} x ${q} x ${H}`, result: `${int(p.surchargeForce)} lb/ft` },
      { label: "Surcharge force acts above the base at", expression: `H / 2 = ${H} / 2`, result: `${fix(p.surchargeArm)} ft` },
    );
  } else {
    steps.push({ label: "Surcharge force", expression: "No surcharge", result: "0 lb/ft" });
  }
  if (r.inputs.saturated) {
    steps.push({ label: "Hydrostatic force", expression: `0.5 x ${WATER_UNIT_WEIGHT} x ${H}^2`, result: `${int(p.waterForce)} lb/ft` });
  } else {
    steps.push({ label: "Hydrostatic force", expression: "Drained, none applied", result: "0 lb/ft" });
  }
  steps.push(
    {
      label: "Total horizontal force",
      expression: `${int(p.soilForce)} + ${int(p.surchargeForce)} + ${int(p.waterForce)}`,
      result: `${int(p.totalH)} lb/ft`,
    },
    {
      label: "Overturning moment about the toe",
      expression: `Sum of each force x its height above the base`,
      result: `${int(p.overturningMoment)} ft-lb/ft`,
    },
  );
  return {
    kind: "steps",
    title: "Lateral earth pressure",
    intro: "Equivalent-fluid pressure from IBC Table 1610.1, increased for slope and surcharge with Rankine theory. Forces are per linear foot of wall.",
    steps,
  };
}

function stability(r: DesignResult): ReportSection {
  const c = r.base.check;
  const p = r.pressure;
  const H = r.inputs.heightFt;
  const resisting = c.weight * (c.baseWidth / 2);
  const steps: CalcStep[] = [
    {
      label: r.base.found ? "Minimum base width B" : "Base width B (widest tried)",
      expression: r.base.found
        ? "Smallest width, in 0.25 ft steps, that passes every check below"
        : `No width up to ${fix(r.wall.maxBaseRatio * H)} ft (${r.wall.maxBaseRatio} x H) passes. This is the widest tried.`,
      result: `${fix(c.baseWidth)} ft`,
    },
    {
      label: "Wall weight W",
      expression: `${r.wall.label}: ${r.wall.unitWeight} pcf x ${fix(c.baseWidth)} x ${H}`,
      result: `${int(c.weight)} lb/ft`,
    },
    { label: "Resisting moment about the toe", expression: `W x B / 2 = ${int(c.weight)} x ${fix(c.baseWidth)} / 2`, result: `${int(resisting)} ft-lb/ft` },
    {
      label: `Overturning factor of safety (min ${FS_OVERTURNING_MIN})`,
      expression: `${int(resisting)} / ${int(p.overturningMoment)}`,
      result: fix(c.fsOverturning),
      status: c.fsOverturning >= FS_OVERTURNING_MIN ? "pass" : "fail",
    },
    {
      label: `Sliding factor of safety (min ${FS_SLIDING_MIN})`,
      expression: `W x friction / total horizontal force = ${int(c.weight)} x ${r.wall.baseFriction} / ${int(p.totalH)}`,
      result: fix(c.fsSliding),
      status: c.fsSliding >= FS_SLIDING_MIN ? "pass" : "fail",
    },
    {
      label: "Resultant eccentricity e",
      expression: `B / 2 - (resisting - overturning moment) / W; middle third limit B / 6 = ${fix(c.baseWidth / 6)} ft`,
      result: `${fix(c.eccentricity)} ft`,
      status: c.middleThird ? "pass" : "fail",
    },
    {
      label: "Maximum bearing pressure at the toe",
      expression: `Allowable for ${r.foundation.label}, IBC Table 1806.2: ${int(c.bearingAllow)} psf`,
      result: bearingPressure(c.bearingMax),
      status: c.bearingOk ? "pass" : "fail",
    },
    {
      label: "Overall",
      expression: r.base.found ? "All checks pass at this base width" : `Does not pass. Governing check: ${GOVERNING[r.base.governing] ?? r.base.governing}`,
      result: c.passes ? "PASS" : "FAIL",
      status: c.passes ? "pass" : "fail",
    },
  ];
  return {
    kind: "steps",
    title: "Stability",
    intro: "Classical statics on a rectangular wall mass: overturning about the toe, sliding on the base, and bearing under the toe. Targets follow the NCMA Design Manual for SRW and IBC §1807.",
    steps,
  };
}

function footing(r: DesignResult): ReportSection {
  const state = stateBySlug(r.inputs.stateSlug);
  return {
    kind: "rows",
    title: "Footing depth",
    intro: "The base must sit below the frost line (IRC R403.1.4 / IBC §1809.5). The depth used is the larger of the state frost depth and the buried-course rule: at least 12 in, and at least 10% of wall height.",
    rows: [
      { label: `Frost depth, ${state?.name ?? "state"}`, value: `${r.frostDepth} in`, note: "Representative value. Frost depth varies inside a state; confirm locally." },
      { label: "Footing depth used", value: `${r.footingDepth} in below grade` },
    ],
  };
}

function reinforcement(r: DesignResult): ReportSection {
  const g = r.reinforcement;
  return {
    kind: "rows",
    title: "Geogrid reinforcement",
    intro: "A plain gravity wall cannot pass at this height and soil. This is a planning estimate of geogrid (NCMA practice: length at least 0.6 H and 4 ft, a layer about every 16 in). A reinforced wall must be engineered.",
    rows: [
      { label: "Geogrid layers", value: String(g.layers) },
      { label: "Geogrid length", value: `${fix(g.length)} ft` },
      { label: "Vertical spacing", value: `${fix(g.verticalSpacing)} ft` },
    ],
  };
}

function permit(r: DesignResult): ReportSection {
  return {
    kind: "bullets",
    title: "Permit",
    items: [`${permitHeadline(r.permit)}.`, ...r.permit.reasons],
  };
}

function materials(r: DesignResult): ReportSection {
  const m = r.materials;
  const state = stateBySlug(r.inputs.stateSlug);
  return {
    kind: "table",
    title: "Materials and cost",
    columns: [
      { label: "Material", align: "left" },
      { label: "Quantity", align: "right" },
      { label: "Cost", align: "right" },
    ],
    rows: m.lines.map((l) => [l.item, `${int(l.qty)} ${l.unit}`, money(l.cost)]),
    foot: [
      ["DIY materials total", "", money(m.materialsCost)],
      [`Estimated installed cost (${int(m.faceArea)} sq ft of face)`, "", `${money(m.installedLow)} to ${money(m.installedHigh)}`],
    ],
    note: `Estimates only. Installed cost is face area times a typical dollar-per-square-foot range for the chosen material, times a regional cost index${state ? ` (${state.name}: ${fix(r.costIndex)}, where 1.00 is the US average)` : ""}.`,
  };
}

function references(r: DesignResult): ReportSection {
  const items = [
    "IBC Table 1610.1: design lateral soil loads (equivalent-fluid pressure), used for the earth pressure.",
    "IBC Table 1806.2: presumptive allowable foundation bearing pressure, used for the bearing check.",
    "Rankine earth-pressure theory: increase for sloped backfill and the surcharge force.",
    "NCMA Design Manual for SRW and IBC §1807: target factors of safety (overturning 2.0, sliding 1.5).",
    "IRC R403.1.4 / IBC §1809.5: footing depth below the frost line.",
    "IRC R404.1 / IBC §1807.2: engineered design for walls over 4 ft or with a surcharge.",
    "NAVFAC DM-7.1 and Coduto, Foundation Design: representative soil friction angles and unit weights.",
  ];
  if (r.reinforcement.needed) items.push("NCMA practice: geogrid length and spacing estimate.");
  items.push(`Full method and tables: ${SITE.url}/methodology`);
  return { kind: "bullets", title: "Code and method references", items };
}

function notes(r: DesignResult): ReportSection {
  return {
    kind: "bullets",
    title: "Notes and next steps",
    items: [...r.warnings, ...buildNextSteps(r)],
  };
}
