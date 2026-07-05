import Link from "next/link";
import CheckoutButton from "@/components/CheckoutButton";

export const metadata = {
  title: "Pricing: Free Calculator, Pro Design Report",
  description:
    "The retaining wall calculator is free forever. Get matched with local pros at no cost, or buy a one-time permit-ready design report PDF with the full earth-pressure and stability calculations.",
  alternates: { canonical: "/pricing" },
};

const FREE = [
  "Full wall designer, every material",
  "Base width and factors of safety",
  "Geogrid reinforcement check",
  "Materials takeoff with cost and shop links",
  "Permit verdict (the 4-ft rule)",
  "Free matching with local contractors and engineers",
  "Print or save as PDF, shareable links",
];

const PRO = [
  "Everything in Free, plus:",
  "Branded, permit-ready design report PDF",
  "Full earth-pressure and stability calculation sheet",
  "Cited code references (IBC 1610.1 and 1806.2)",
  "Cross-section drawing with dimensions",
  "Saved projects (coming soon)",
];

export default function Pricing() {
  return (
    <div>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Simple pricing</h1>
        <p className="mt-3 text-slate-600">
          The calculator is free, and so is getting matched with a pro. Pay once only if you need a
          formal document for a permit or a client.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Free</h2>
          <div className="tabular mt-1 text-3xl font-extrabold text-slate-900">$0</div>
          <p className="mt-1 text-sm text-slate-500">Everything most projects need.</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {FREE.map((f) => <li key={f} className="flex gap-2"><span className="text-emerald-700">✓</span>{f}</li>)}
          </ul>
          <Link href="/" className="mt-5 block rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Open the calculator
          </Link>
        </div>

        <div className="relative rounded-2xl border-2 border-emerald-700 bg-white p-6">
          <div className="absolute -top-3 left-6 rounded-full bg-emerald-700 px-3 py-0.5 text-xs font-semibold text-white">For permits and clients</div>
          <h2 className="text-lg font-bold text-slate-900">Pro design report</h2>
          <div className="tabular mt-1 text-3xl font-extrabold text-slate-900">$29<span className="text-base font-normal text-slate-500"> one-time</span></div>
          <p className="mt-1 text-sm text-slate-500">A document you can hand to a reviewer.</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {PRO.map((f) => <li key={f} className="flex gap-2"><span className="text-emerald-700">✓</span>{f}</li>)}
          </ul>
          <div className="mt-5"><CheckoutButton /></div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-clay-200 bg-clay-50 p-6 text-center">
        <h2 className="text-lg font-bold text-slate-900">Ready to build? Skip the guesswork.</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-slate-600">
          Compare quotes from vetted contractors and licensed engineers near you against the numbers you
          just calculated. It is free and there is no obligation.
        </p>
        <Link href="/find-a-pro" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-clay-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-clay-700">
          Find a pro near you <span aria-hidden>→</span>
        </Link>
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-slate-500">
        The Pro report is a planning aid. A wall over 4 ft, or with a surcharge, still needs a licensed
        engineer&apos;s stamped design and a local permit.
      </p>
    </div>
  );
}
