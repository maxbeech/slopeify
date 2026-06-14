"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_INPUTS, designWall, type DesignInputs } from "@/lib/design";
import { decodeInputs, encodeInputs } from "@/lib/calc-url";
import { SOILS, FOUNDATION_SOILS } from "@/lib/soil";
import { WALL_TYPES } from "@/lib/wall";
import { STATES } from "@/lib/states";
import { SURCHARGE_PRESETS } from "@/lib/earth-pressure";
import type { Focus } from "@/lib/calculators";
import CalcResults from "./CalcResults";

const SLOPES = [
  { deg: 0, label: "Level" },
  { deg: 14, label: "Gentle (4:1)" },
  { deg: 18, label: "Moderate (3:1)" },
  { deg: 26, label: "Steep (2:1)" },
];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-0.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const selCls =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

export default function Calculator({
  initial,
  focus = "design",
  lockWallType = false,
}: {
  initial?: Partial<DesignInputs>;
  focus?: Focus;
  lockWallType?: boolean;
}) {
  const [inputs, setInputs] = useState<DesignInputs>({ ...DEFAULT_INPUTS, ...initial });

  // Hydrate from a shared URL once on mount, then keep the URL in sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = decodeInputs(window.location.search, inputs.stateSlug);
    // Hydrate once from a shared link — a legitimate sync from an external
    // system (the URL), not derived render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.location.search) setInputs({ ...fromUrl, ...(lockWallType && initial?.wallTypeId ? { wallTypeId: initial.wallTypeId } : {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = encodeInputs(inputs);
    window.history.replaceState(null, "", `${window.location.pathname}?${qs}`);
  }, [inputs]);

  const result = useMemo(() => designWall(inputs), [inputs]);
  const set = <K extends keyof DesignInputs>(k: K, v: DesignInputs[K]) => setInputs((p) => ({ ...p, [k]: v }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 print:hidden" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Wall height" hint="Retained, ft">
            <input type="number" min={1} max={30} step={0.5} value={inputs.heightFt}
              onChange={(e) => set("heightFt", Number(e.target.value))} className={selCls} />
          </Field>
          <Field label="Wall length" hint="ft">
            <input type="number" min={1} max={2000} step={1} value={inputs.lengthFt}
              onChange={(e) => set("lengthFt", Number(e.target.value))} className={selCls} />
          </Field>
        </div>

        {!lockWallType && (
          <Field label="Wall type">
            <select value={inputs.wallTypeId} onChange={(e) => set("wallTypeId", e.target.value)} className={selCls}>
              {WALL_TYPES.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </Field>
        )}

        <Field label="Backfill soil (behind the wall)">
          <select value={inputs.backfillSoilId} onChange={(e) => set("backfillSoilId", e.target.value)} className={selCls}>
            {SOILS.map((s) => <option key={s.id} value={s.id}>{s.label} ({s.uscs})</option>)}
          </select>
        </Field>

        <Field label="Foundation soil (under the base)">
          <select value={inputs.foundationSoilId} onChange={(e) => set("foundationSoilId", e.target.value)} className={selCls}>
            {FOUNDATION_SOILS.map((s) => <option key={s.id} value={s.id}>{s.label} — {s.bearing.toLocaleString()} psf</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Backfill slope">
            <select value={inputs.slopeDeg} onChange={(e) => set("slopeDeg", Number(e.target.value))} className={selCls}>
              {SLOPES.map((s) => <option key={s.deg} value={s.deg}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Load behind wall">
            <select value={inputs.surcharge} onChange={(e) => set("surcharge", Number(e.target.value))} className={selCls}>
              {SURCHARGE_PRESETS.map((s) => <option key={s.id} value={s.psf}>{s.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="State (for cost + permit)">
          <select value={inputs.stateSlug} onChange={(e) => set("stateSlug", e.target.value)} className={selCls}>
            {STATES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </Field>

        <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
          <label className="flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={inputs.restrained} onChange={(e) => set("restrained", e.target.checked)} />
            Wall is restrained at the top (use at-rest pressure)
          </label>
          <label className="flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={inputs.saturated} onChange={(e) => set("saturated", e.target.checked)} />
            No working drainage (add hydrostatic — not recommended)
          </label>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => window.print()}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Print / Save PDF
          </button>
          <button type="button"
            onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
            className="flex-1 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500">
            Copy share link
          </button>
        </div>
      </form>

      <div>
        <CalcResults r={result} focus={focus} />
      </div>
    </div>
  );
}
