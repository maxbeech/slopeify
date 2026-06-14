import Link from "next/link";
import { STATES } from "@/lib/states";

export const metadata = {
  title: "Retaining Wall Permits & Cost by State",
  description:
    "Retaining wall permit rules and cost estimates for all 50 states and DC — the 4-foot engineering threshold, the adopted building code, and a regional cost index.",
};

export default function StatesIndex() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900">Retaining walls by state</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Permit rules and cost estimates for every state. Most jurisdictions base retaining-wall
        permitting on the IBC/IRC; the calculator on each page is pre-set to that state’s cost index.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {STATES.map((s) => (
          <Link key={s.slug} href={`/states/${s.slug}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-emerald-300 hover:text-slate-900">
            {s.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
