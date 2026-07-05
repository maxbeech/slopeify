// Results panel: verdict, the three factors of safety, footing depth, the
// cross-section, the permit call, a materials takeoff with shop links, the
// hire-a-pro next step, and recommended steps. Presentation only; every number
// comes from designWall().
import type { DesignResult } from "@/lib/design";
import type { Focus } from "@/lib/calculators";
import { FS_OVERTURNING_MIN, FS_SLIDING_MIN } from "@/lib/wall";
import { stateBySlug } from "@/lib/states";
import { shopLinksForItem, AFFILIATE_DISCLOSURE } from "@/lib/leadgen";
import WallDiagram from "./WallDiagram";
import FindAPro from "./FindAPro";

const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const fix = (n: number, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : "—");

function Stat({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${ok === undefined ? "border-slate-200 bg-white" : ok ? "border-emerald-300 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`tabular mt-0.5 text-lg font-semibold ${ok === false ? "text-rose-700" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}

export default function CalcResults({ r, focus = "design" }: { r: DesignResult; focus?: Focus }) {
  const c = r.base.check;
  const passes = r.base.found;
  const state = stateBySlug(r.inputs.stateSlug);
  const verdict = passes
    ? { tone: "emerald", title: "This gravity wall works", sub: `A ${c.baseWidth}-ft base passes all three stability checks.` }
    : r.reinforcement.needed
      ? { tone: "amber", title: "Needs geogrid reinforcement", sub: "A plain gravity wall cannot pass here. Reinforce it, or use an engineered cantilever." }
      : { tone: "rose", title: "This wall does not pass", sub: "Reduce the height, improve the soil and drainage, or have it engineered." };

  const nextSteps = buildNextSteps(r);

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border p-4 ${verdict.tone === "emerald" ? "border-emerald-300 bg-emerald-50" : verdict.tone === "amber" ? "border-amber-300 bg-amber-50" : "border-rose-200 bg-rose-50"}`}>
        <div className="text-lg font-bold text-slate-900">{verdict.title}</div>
        <p className="text-sm text-slate-600">{verdict.sub}</p>
      </div>

      {focus === "cost" && <CostBlock r={r} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Minimum base width" value={`${c.baseWidth} ft`} />
        <Stat label="Bury base below grade (frost line)" value={`${r.footingDepth} in`} />
        <Stat label="Lateral earth pressure (EFP)" value={`${fix(r.pressure.efp, 0)} pcf`} />
        <Stat label="Total horizontal push" value={`${fix(r.pressure.totalH, 0)} lb/ft`} />
        <Stat label={`Overturning FS (min ${FS_OVERTURNING_MIN})`} value={fix(c.fsOverturning)} ok={c.fsOverturning >= FS_OVERTURNING_MIN} />
        <Stat label={`Sliding FS (min ${FS_SLIDING_MIN})`} value={fix(c.fsSliding)} ok={c.fsSliding >= FS_SLIDING_MIN} />
        <Stat label="Bearing: max vs allowable" value={`${fix(c.bearingMax, 0)} / ${fix(c.bearingAllow, 0)} psf`} ok={c.bearingOk} />
        <Stat label="Resultant in middle third" value={c.middleThird ? "Yes, no heel uplift" : "No, heel lifts"} ok={c.middleThird} />
      </div>

      {r.reinforcement.needed && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Geogrid estimate:</strong> about {r.reinforcement.layers} layers at {fix(r.reinforcement.length, 2)} ft long,
          spaced roughly {fix(r.reinforcement.verticalSpacing, 2)} ft apart. Planning figure only; a reinforced wall must be engineered.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <WallDiagram r={r} />
      </div>

      <div className={`rounded-lg border p-3 text-sm ${r.permit.engineeringRequired ? "border-rose-200 bg-rose-50 text-rose-900" : "border-slate-200 bg-white text-slate-700"}`}>
        <div className="font-semibold">
          {r.permit.engineeringRequired ? "Permit and engineered design required" : r.permit.permitLikely ? "A permit is likely, check locally" : "May be permit-exempt, confirm locally"}
        </div>
        <ul className="mt-1 list-disc pl-5">
          {r.permit.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
        </ul>
      </div>

      {focus !== "cost" && <CostBlock r={r} />}

      <FindAPro
        engineeringRequired={r.permit.engineeringRequired}
        stateSlug={r.inputs.stateSlug}
        stateName={state?.name}
        heightFt={r.inputs.heightFt}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">Recommended next steps</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {nextSteps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </div>

      {r.warnings.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <div className="mb-1 font-semibold text-slate-800">Notes and cautions</div>
          <ul className="list-disc space-y-1 pl-5">
            {r.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function buildNextSteps(r: DesignResult): string[] {
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

function CostBlock({ r }: { r: DesignResult }) {
  const m = r.materials;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-900">Cost and materials</h3>
        <div className="text-xs text-slate-500">{m.faceArea.toLocaleString()} sq ft of face</div>
      </div>
      <div className="mt-2 rounded-lg bg-emerald-50 p-3 text-center">
        <div className="text-xs text-emerald-800">Estimated installed cost</div>
        <div className="tabular text-2xl font-bold text-emerald-900">{money(m.installedLow)} to {money(m.installedHigh)}</div>
      </div>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="py-1">Material</th>
            <th className="py-1 text-right">Qty</th>
            <th className="py-1 text-right">Cost</th>
            <th className="py-1 text-right print:hidden">Buy</th>
          </tr>
        </thead>
        <tbody>
          {m.lines.map((l, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-1.5 text-slate-700">{l.item}</td>
              <td className="tabular py-1.5 text-right text-slate-600">{l.qty.toLocaleString()} {l.unit}</td>
              <td className="tabular py-1.5 text-right text-slate-800">{money(l.cost)}</td>
              <td className="py-1.5 text-right print:hidden">
                <span className="inline-flex gap-1.5">
                  {shopLinksForItem(l.item).map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener sponsored nofollow"
                      className="whitespace-nowrap text-xs font-medium text-emerald-700 hover:underline">
                      {s.label}
                    </a>
                  ))}
                </span>
              </td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-1.5">DIY materials total</td>
            <td></td>
            <td className="tabular py-1.5 text-right">{money(m.materialsCost)}</td>
            <td className="print:hidden"></td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">
        Estimates only. Installed cost is face area times a typical dollar-per-square-foot range for the
        chosen material, times a regional cost index. Get exact pricing from a local contractor.
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-slate-400 print:hidden">{AFFILIATE_DISCLOSURE}</p>
    </div>
  );
}
