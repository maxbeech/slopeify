// On-screen version of the paid report. Renders the same ReportModel the PDF is
// drawn from (lib/report/model.ts), and the cross-section with the same component
// the free calculator uses, so what is on screen is what is in the file.
import type { DesignResult } from "@/lib/design";
import type { CalcStep, ReportModel, ReportSection, Row, Status } from "@/lib/report/model";
import WallDiagram from "./WallDiagram";

const tone = (s?: Status) => (s === "pass" ? "text-emerald-700" : s === "fail" ? "text-rose-700" : "text-slate-900");
// Colour alone is lost on a printout, so the result is also spelled out. Skipped when the value already says it.
const tag = (s?: Status, value = "") => (/^(pass|fail)$/i.test(value) ? "" : s === "pass" ? " (pass)" : s === "fail" ? " (FAIL)" : "");

function RowList({ rows }: { rows: Row[] }) {
  return (
    <dl className="divide-y divide-slate-100 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-x-4 gap-y-0.5 py-2 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <dt className="text-slate-500">{row.label}</dt>
          <dd>
            <div className={`font-semibold ${tone(row.status)}`}>{row.value}{tag(row.status, row.value)}</div>
            {row.note && <div className="text-xs text-slate-500">{row.note}</div>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function StepList({ steps }: { steps: CalcStep[] }) {
  return (
    <ol className="divide-y divide-slate-100 text-sm">
      {steps.map((step) => (
        <li key={step.label} className="grid gap-x-4 gap-y-0.5 py-2 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto]">
          <div className="font-semibold text-slate-900">{step.label}</div>
          <div className="text-slate-500">{step.expression}</div>
          <div className={`tabular font-semibold sm:text-right ${tone(step.status)}`}>{step.result}{tag(step.status, step.result)}</div>
        </li>
      ))}
    </ol>
  );
}

function Section({ section, design }: { section: ReportSection; design: DesignResult }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="border-b border-emerald-700 pb-1.5 text-base font-bold text-emerald-800">{section.title}</h2>
      {"intro" in section && section.intro && <p className="mt-2 text-xs text-slate-500">{section.intro}</p>}
      <div className="mt-2">
        {section.kind === "rows" && <RowList rows={section.rows} />}
        {section.kind === "steps" && <StepList steps={section.steps} />}
        {section.kind === "bullets" && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {section.items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )}
        {section.kind === "diagram" && (
          <figure>
            <div className="mx-auto max-w-md rounded-lg border border-slate-200 p-2"><WallDiagram r={design} /></div>
            <figcaption className="mt-1 text-center text-xs text-slate-500">{section.caption}</figcaption>
          </figure>
        )}
        {section.kind === "table" && (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-xs text-slate-500">
                  {section.columns.map((c) => <th key={c.label} className={`py-1 font-semibold ${c.align === "right" ? "text-right" : "text-left"}`}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {row.map((cell, j) => <td key={j} className={`tabular py-1.5 text-slate-700 ${section.columns[j].align === "right" ? "text-right" : ""}`}>{cell}</td>)}
                  </tr>
                ))}
                {section.foot.map((row, i) => (
                  <tr key={`f${i}`} className="border-b border-slate-100 font-semibold text-slate-900">
                    <td className="py-1.5" colSpan={2}>{row[0]}</td>
                    <td className="tabular py-1.5 text-right">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {section.note && <p className="mt-2 text-xs text-slate-500">{section.note}</p>}
          </>
        )}
      </div>
    </section>
  );
}

export default function ReportView({ model, design }: { model: ReportModel; design: DesignResult }) {
  const verdictCls =
    model.verdict.tone === "emerald" ? "border-emerald-300 bg-emerald-50" : model.verdict.tone === "amber" ? "border-amber-300 bg-amber-50" : "border-rose-200 bg-rose-50";
  return (
    <article className="space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold text-slate-900">{model.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{model.subtitle}</p>
        <p className="mt-0.5 text-xs text-slate-500">Reference {model.reference} · Issued {model.issuedOn}</p>
      </header>
      <div className={`rounded-xl border p-4 ${verdictCls}`}>
        <div className="text-lg font-bold text-slate-900">{model.verdict.title}</div>
        <p className="text-sm text-slate-700">{model.verdict.sub}</p>
      </div>
      {model.sections.map((s) => <Section key={s.title} section={s} design={design} />)}
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <h2 className="text-base font-bold text-slate-900">Important</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {model.disclaimer.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      </section>
    </article>
  );
}
