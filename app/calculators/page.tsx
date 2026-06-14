import Link from "next/link";
import { CALCULATORS } from "@/lib/calculators";

export const metadata = {
  title: "Retaining Wall Calculators",
  description:
    "Every RetainCalc HQ tool: design, cost, block count, base width, and per-material calculators for segmental block, concrete, timber and boulder retaining walls.",
};

export default function CalculatorsIndex() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900">Retaining wall calculators</h1>
      <p className="mt-2 text-slate-600">Pick the tool for the job. Each one uses the same code-based engine.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {CALCULATORS.map((c) => (
          <Link key={c.slug} href={`/calculators/${c.slug}`}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:border-emerald-300 hover:shadow-sm">
            <div className="font-semibold text-slate-900">{c.h1}</div>
            <p className="mt-1 text-sm text-slate-500">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
