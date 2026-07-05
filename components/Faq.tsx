import { FAQS } from "@/lib/faq";

export default function Faq() {
  return (
    <section className="mt-14">
      <h2 className="text-xl font-bold text-slate-900">Frequently asked questions</h2>
      <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {FAQS.map((f, i) => (
          <details key={i} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-slate-800 marker:hidden hover:bg-slate-50">
              {f.q}
              <span className="shrink-0 text-slate-400 transition group-open:rotate-45" aria-hidden>+</span>
            </summary>
            <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
