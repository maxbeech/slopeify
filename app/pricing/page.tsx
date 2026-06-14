import Link from "next/link";
import CheckoutButton from "@/components/CheckoutButton";

export const metadata = {
  title: "Pricing — Free calculator & Pro design report",
  description:
    "The retaining wall calculator is free forever. Pro is a one-time $29 permit-ready design report PDF with the full earth-pressure and stability calculations.",
};

const FREE = [
  "Full wall designer (all materials)",
  "Base width + factors of safety",
  "Geogrid reinforcement check",
  "Materials takeoff + cost",
  "Permit verdict (4-ft rule)",
  "Print / save as PDF",
  "Shareable result links",
];
const PRO = [
  "Everything in Free, plus:",
  "Branded, permit-ready design report PDF",
  "Full earth-pressure & stability calculation sheet",
  "Cited code references (IBC 1610.1 / 1806.2)",
  "Cross-section drawing with dimensions",
  "Saved projects (coming soon)",
];

export default function Pricing() {
  return (
    <div>
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Simple pricing</h1>
        <p className="mt-2 text-slate-600">The calculator is free. Pay once if you need a document for a permit or a client.</p>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Free</h2>
          <div className="mt-1 text-3xl font-extrabold text-slate-900">$0</div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {FREE.map((f) => <li key={f} className="flex gap-2"><span className="text-emerald-600">✓</span>{f}</li>)}
          </ul>
          <Link href="/" className="mt-5 block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
            Open the calculator
          </Link>
        </div>

        <div className="rounded-xl border-2 border-emerald-600 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Pro design report</h2>
          <div className="mt-1 text-3xl font-extrabold text-slate-900">$29<span className="text-base font-normal text-slate-500"> one-time</span></div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {PRO.map((f) => <li key={f} className="flex gap-2"><span className="text-emerald-600">✓</span>{f}</li>)}
          </ul>
          <div className="mt-5"><CheckoutButton /></div>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-slate-400">
        The Pro report is a planning aid. A wall over 4 ft or with a surcharge still needs a licensed
        engineer’s stamped design and a local permit.
      </p>
    </div>
  );
}
