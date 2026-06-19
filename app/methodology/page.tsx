import { SOILS } from "@/lib/soil";

export const metadata = {
  title: "Methodology & Code References",
  description:
    "Exactly how RetainCalc HQ computes a retaining wall: IBC Table 1610.1 lateral soil loads, IBC Table 1806.2 presumptive bearing, Rankine earth pressure, and the overturning / sliding / bearing stability checks.",
};

export default function Methodology() {
  return (
    <article className="prose-slate max-w-none">
      <h1 className="text-3xl font-extrabold text-slate-900">Methodology &amp; code references</h1>
      <p className="mt-3 text-slate-600">
        Every number this calculator produces comes from a published code table or a standard
        geotechnical method. Nothing is invented. Here is exactly what we use, so an engineer or a
        plan reviewer can check us.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">1. Lateral earth pressure — IBC Table 1610.1</h2>
      <p className="mt-2 text-slate-600">
        The push of the retained soil is taken as a <strong>design lateral soil load</strong> (an
        equivalent-fluid pressure, in psf per foot of depth) from <strong>IBC Table 1610.1</strong>.
        The total horizontal force on a wall of height <em>H</em> is the area of the pressure triangle,
        <code className="mx-1 rounded bg-slate-100 px-1">P = ½ · EFP · H²</code>, acting at <em>H</em>/3
        above the base. We use these active values (and the at-rest column when the wall is restrained):
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-slate-500">
              <th className="py-1">Soil (USCS)</th>
              <th className="py-1 text-right">Active (pcf)</th>
              <th className="py-1 text-right">At-rest (pcf)</th>
            </tr>
          </thead>
          <tbody>
            {SOILS.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-1 text-slate-700">{s.label} ({s.uscs})</td>
                <td className="py-1 text-right">{s.efpActive}</td>
                <td className="py-1 text-right">{s.efpAtRest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        For a sloped backfill we increase the pressure by the ratio of Rankine active coefficients
        Ka(β)/Ka(0). A uniform surcharge <em>q</em> adds a rectangular pressure Ka·q over the full height
        (Ka taken as EFP/γ for consistency with the code value). Where a row combines two USCS classes
        (ML, CL) we use the more conservative value (60 pcf, the CL figure; ML alone is 45). IBC lists
        high-plasticity clays (CH/MH) as <em>unsuitable backfill</em> with no tabulated value — if you
        select one we apply a conservative 100 pcf and warn you to replace it.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">2. Presumptive bearing — IBC Table 1806.2</h2>
      <p className="mt-2 text-slate-600">
        The allowable pressure under the base is the presumptive load-bearing value from{" "}
        <strong>IBC Table 1806.2</strong>:
      </p>
      <ul className="mt-2 list-disc pl-6 text-slate-600">
        <li>Crystalline bedrock — <strong>12,000 psf</strong></li>
        <li>Sedimentary and foliated rock — <strong>4,000 psf</strong></li>
        <li>Sandy gravel and/or gravel (GW, GP) — <strong>3,000 psf</strong></li>
        <li>Sand, silty sand, clayey sand, silty/clayey gravel (SW, SP, SM, SC, GM, GC) — <strong>2,000 psf</strong></li>
        <li>Clay, sandy clay, silty clay, clayey silt, silt and sandy silt (CL, ML, MH, CH) — <strong>1,500 psf</strong></li>
      </ul>

      <h2 className="mt-8 text-xl font-bold text-slate-900">3. Stability — the three classical checks</h2>
      <p className="mt-2 text-slate-600">
        Modelling the wall as a rectangular mass of width <em>B</em> and height <em>H</em> with unit
        weight γ<sub>wall</sub> (conservative for a segmental wall, which also gains soil weight on its
        setback heel that we ignore on the safe side):
      </p>
      <ul className="mt-2 list-disc pl-6 text-slate-600">
        <li><strong>Overturning</strong> about the toe: FS = W·(B/2) / (driving moment) ≥ <strong>2.0</strong>.</li>
        <li><strong>Sliding</strong>: FS = W·μ / (horizontal force) ≥ <strong>1.5</strong>, μ = base-friction coefficient.</li>
        <li><strong>Bearing</strong>: from the resultant eccentricity <em>e</em>, the peak toe pressure must stay below the allowable value, and ideally <em>e</em> ≤ B/6 (resultant in the middle third, no heel uplift).</li>
      </ul>
      <p className="mt-2 text-slate-600">
        The solver scans base widths from 0.3·H upward and returns the smallest that passes all three.
        If none passes, it recommends a reinforced (geogrid) SRW or an engineered cantilever and
        estimates the geogrid layers and length (NCMA practice: length ≥ 0.6·H, min 4 ft; a layer
        roughly every two courses).
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">4. Footing depth below the frost line</h2>
      <p className="mt-2 text-slate-600">
        The base must bear below the frost line so frost heave can&apos;t lift it (IRC R403.1.4 /
        IBC §1809.5). We recommend a minimum depth below grade of the larger of: your state&apos;s
        typical frost depth, one buried course (≈ 10% of wall height), and a 12-inch practical
        minimum to reach stable bearing soil. Frost depth varies within a state — the per-state
        figure is a representative permit value; confirm yours with the local building department.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">5. Friction angle &amp; unit weight</h2>
      <p className="mt-2 text-slate-600">
        Representative effective friction angles and moist unit weights are typical design values from
        standard references (NAVFAC DM-7.1; Coduto, <em>Foundation Design</em>). They drive the Rankine
        slope/surcharge adjustment and the base friction. Your geotechnical report always governs over
        these defaults.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Important limits</h2>
      <p className="mt-2 text-slate-600">
        This tool produces a <strong>planning estimate</strong>, not a stamped design. A wall retaining
        more than 4 ft, or any wall with a surcharge, requires an engineered design (IRC R404.1 / IBC
        §1807.2) and a local permit. Confirm soil parameters with a geotechnical investigation and the
        final design with a licensed engineer.
      </p>
    </article>
  );
}
