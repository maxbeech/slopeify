import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <div className="tabular text-5xl font-extrabold text-slate-300">404</div>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">We could not find that page</h1>
      <p className="mt-2 text-slate-600">It may have moved. Try the retaining wall calculator instead.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-block rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
          Open the calculator
        </Link>
        <Link href="/blog" className="inline-block rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Browse the guides
        </Link>
      </div>
    </div>
  );
}
