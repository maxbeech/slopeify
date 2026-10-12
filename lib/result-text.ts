// Plain-language wording for a calculation result: the verdict banner, the permit
// headline and the recommended next steps. Shared by the on-screen results panel
// (components/CalcResults.tsx) and the paid report (lib/report/model.ts) so the two
// can never disagree. Pure: every statement is derived from a DesignResult.
import type { DesignResult } from "./design";
import type { PermitVerdict } from "./permit";

export interface Verdict {
  tone: "emerald" | "amber" | "rose";
  title: string;
  sub: string;
}

export function verdictFor(r: DesignResult): Verdict {
  if (r.base.found) {
    return {
      tone: "emerald",
      title: "This gravity wall works",
      sub: `A ${r.base.check.baseWidth}-ft base passes all three stability checks.`,
    };
  }
  if (r.reinforcement.needed) {
    return {
      tone: "amber",
      title: "Needs geogrid reinforcement",
      sub: "A plain gravity wall cannot pass here. Reinforce it, or use an engineered cantilever.",
    };
  }
  return {
    tone: "rose",
    title: "This wall does not pass",
    sub: "Reduce the height, improve the soil and drainage, or have it engineered.",
  };
}

export function permitHeadline(permit: PermitVerdict): string {
  if (permit.engineeringRequired) return "Permit and engineered design required";
  if (permit.permitLikely) return "A permit is likely, check locally";
  return "May be permit-exempt, confirm locally";
}

export function buildNextSteps(r: DesignResult): string[] {
  const steps: string[] = [];
  steps.push(
    `Excavate and compact a 6-inch crushed-stone leveling pad, then bury the base at least ${r.footingDepth} in below grade, below the frost line for your state.`,
  );
  if (r.base.found) {
    steps.push(`Build to a ${r.base.check.baseWidth}-ft base width and batter the wall back into the slope.`);
  } else if (r.reinforcement.needed) {
    steps.push(`Add about ${r.reinforcement.layers} geogrid layers (${r.reinforcement.length.toFixed(1)} ft long), or switch to an engineered cantilever wall.`);
  }
  steps.push("Install the drainage system: clean drain rock behind the wall, a perforated pipe at the base daylighted to a low point, and filter fabric.");
  steps.push("Backfill and compact in 6 to 8 inch lifts, and finish the grade so surface water runs away from the wall.");
  if (r.permit.engineeringRequired) {
    steps.push("Hire a licensed engineer for a stamped design and pull a permit before you build.");
  } else if (r.permit.permitLikely) {
    steps.push("Check with your local building department; a permit is likely for a wall this size.");
  }
  return steps;
}
