import { FAQS } from "@/lib/faq";

export default function Faq() {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-slate-900">Frequently asked questions</h2>
      <div className="mt-4 space-y-3">
        {FAQS.map((f, i) => (
          <details key={i} className="group rounded-lg border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer list-none font-medium text-slate-800 marker:hidden">
              {f.q}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
