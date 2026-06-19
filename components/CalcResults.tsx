// Results panel — verdict, the three factors of safety, footing depth, the
// cross-section, the permit call, materials + cost, and recommended next steps.
// Presentation only; all numbers come from designWall().
import Link from "next/link";
import type { DesignResult } from "@/lib/design";
import type { Focus } from "@/lib/calculators";
import { FS_OVERTURNING_MIN, FS_SLIDING_MIN } from "@/lib/wall";
import WallDiagram from "./WallDiagram";

const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const fix = (n: number, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : "—");

function Stat({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${ok === undefined ? "border-slate-200 bg-white" : ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold ${ok === false ? "text-rose-700" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}

export default function CalcResults({ r, focus = "design" }: { r: DesignResult; focus?: Focus }) {
  const c = r.base.check;
  const passes = r.base.found;
  const verdict = passes
    ? { tone: "emerald", title: "This gravity wall works", sub: `A ${c.baseWidth}-ft base passes all three stability checks.` }
    : r.reinforcement.needed
      ? { tone: "amber", title: "Needs geogrid reinforcement", sub: "A plain gravity wall can't pass — reinforce it or use an engineered cantilever." }
      : { tone: "rose", title: "This wall does not pass", sub: "Reduce height, improve soil/drainage, or have it engineered." };

  const nextSteps = buildNextSteps(r);

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border p-4 ${verdict.tone === "emerald" ? "border-emerald-200 bg-emerald-50" : verdict.tone === "amber" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"}`}>
        <div className="text-lg font-bold text-slate-900">{verdict.title}</div>
        <p className="text-sm text-slate-600">{verdict.sub}</p>
      </div>

      {/* Cost-first ordering for the cost variant */}
      {focus === "cost" && <CostBlock r={r} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Minimum base width" value={`${c.baseWidth} ft`} />
        <Stat label="Bury base below grade (frost line)" value={`${r.footingDepth} in`} />
        <Stat label="Lateral earth pressure (EFP)" value={`${fix(r.pressure.efp, 0)} pcf`} />
        <Stat label="Total horizontal push" value={`${fix(r.pressure.totalH, 0)} lb/ft`} />
        <Stat label={`Overturning FS (≥ ${FS_OVERTURNING_MIN})`} value={fix(c.fsOverturning)} ok={c.fsOverturning >= FS_OVERTURNING_MIN} />
        <Stat label={`Sliding FS (≥ ${FS_SLIDING_MIN})`} value={fix(c.fsSliding)} ok={c.fsSliding >= FS_SLIDING_MIN} />
        <Stat label="Bearing: max vs allowable" value={`${fix(c.bearingMax, 0)} / ${fix(c.bearingAllow, 0)} psf`} ok={c.bearingOk} />
        <Stat label="Resultant in middle third" value={c.middleThird ? "Yes — no heel uplift" : "No — heel lifts"} ok={c.middleThird} />
      </div>

      {r.reinforcement.needed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Geogrid estimate:</strong> ~{r.reinforcement.layers} layers at {fix(r.reinforcement.length, 2)} ft long,
          spaced ~{fix(r.reinforcement.verticalSpacing, 2)} ft vertically. Planning estimate — a reinforced wall must be engineered.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <WallDiagram r={r} />
      </div>

      {/* Permit */}
      <div className={`rounded-lg border p-3 text-sm ${r.permit.engineeringRequired ? "border-rose-200 bg-rose-50 text-rose-900" : "border-slate-200 bg-white text-slate-700"}`}>
        <div className="font-semibold">
          {r.permit.engineeringRequired ? "Permit + engineered design required" : r.permit.permitLikely ? "A permit is likely — check locally" : "May be permit-exempt — confirm locally"}
        </div>
        <ul className="mt-1 list-disc pl-5">
          {r.permit.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
        </ul>
      </div>

      {focus !== "cost" && <CostBlock r={r} />}

      {/* Recommended next steps */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <h3 className="font-semibold text-slate-900">Recommended next steps</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {nextSteps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        {r.permit.engineeringRequired && (
          <Link href="/pricing" className="mt-3 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 print:hidden">
            Get the permit-ready design report (Pro, $29) →
          </Link>
        )}
      </div>

      {/* Warnings */}
      {r.warnings.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <div className="mb-1 font-semibold text-slate-800">Notes &amp; cautions</div>
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
    `Excavate and compact a 6-inch crushed-stone leveling pad, then bury the base at least ${r.footingDepth} in below grade (below the frost line for your state).`,
  );
  if (r.base.found) {
    steps.push(`Build to a ${r.base.check.baseWidth}-ft base width and batter the wall back into the slope.`);
  } else if (r.reinforcement.needed) {
    steps.push(`Add ~${r.reinforcement.layers} geogrid layers (${r.reinforcement.length.toFixed(1)} ft long) — or switch to an engineered cantilever wall.`);
  }
  steps.push("Install the drainage system: clean drain rock behind the wall, a perforated pipe at the base daylighted to a low point, and filter fabric.");
  steps.push("Backfill and compact in 6–8 inch lifts; finish grade so surface water runs away from the wall.");
  if (r.permit.engineeringRequired) {
    steps.push("Hire a licensed engineer for a stamped design and pull a permit before you build.");
  } else if (r.permit.permitLikely) {
    steps.push("Check with your local building department — a permit is likely for a wall this size.");
  }
  return steps;
}

function CostBlock({ r }: { r: DesignResult }) {
  const m = r.materials;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-900">Cost &amp; materials</h3>
        <div className="text-xs text-slate-500">{m.faceArea.toLocaleString()} sq ft of face</div>
      </div>
      <div className="mt-2 rounded-lg bg-emerald-50 p-3 text-center">
        <div className="text-xs text-emerald-800">Estimated installed cost</div>
        <div className="text-2xl font-bold text-emerald-900">{money(m.installedLow)} – {money(m.installedHigh)}</div>
      </div>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="py-1">Material</th><th className="py-1 text-right">Qty</th><th className="py-1 text-right">Cost</th>
          </tr>
        </thead>
        <tbody>
          {m.lines.map((l, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-1 text-slate-700">{l.item}</td>
              <td className="py-1 text-right text-slate-600">{l.qty.toLocaleString()} {l.unit}</td>
              <td className="py-1 text-right text-slate-800">{money(l.cost)}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-1.5">DIY materials total</td><td></td>
            <td className="py-1.5 text-right">{money(m.materialsCost)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">
        Estimates only. Installed cost = face area × a typical $/sq-ft range for the chosen material × a regional cost index.
        Get exact pricing from a local contractor.
      </p>
    </div>
  );
}
