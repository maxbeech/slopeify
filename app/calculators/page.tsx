import Link from "next/link";
import { CALCULATORS } from "@/lib/calculators";
import { POSTS } from "@/lib/posts";

export const metadata = {
  title: "Retaining Wall Calculators",
  description:
    "Every Slopeify tool: design, cost, block count, base width, and per-material calculators for segmental block, concrete, timber and boulder retaining walls.",
  alternates: { canonical: "/calculators" },
};

export default function CalculatorsIndex() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Retaining wall calculators</h1>
      <p className="mt-3 max-w-2xl text-slate-600">Pick the tool for the job. Each one runs the same code-based engine, so the numbers match wherever you start.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {CALCULATORS.map((c) => (
          <Link key={c.slug} href={`/calculators/${c.slug}`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm">
            <div className="font-semibold text-slate-900 group-hover:text-emerald-800">{c.h1}</div>
            <p className="mt-1 text-sm text-slate-500">{c.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Open <span aria-hidden>→</span></span>
          </Link>
        ))}
      </div>
      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">Guides behind the numbers</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {POSTS.slice(0, 8).map((p) => (
            <li key={p.slug}><Link href={`/blog/${p.slug}`} className="text-emerald-700 hover:underline">{p.title}</Link></li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-500"><Link href="/blog" className="text-emerald-700 hover:underline">All retaining wall guides</Link></p>
      </section>
    </div>
  );
}
