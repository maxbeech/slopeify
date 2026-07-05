import Link from "next/link";
import { notFound } from "next/navigation";
import Calculator from "@/components/Calculator";
import { STATES, stateBySlug } from "@/lib/states";
import { ENGINEERING_HEIGHT_FT } from "@/lib/permit";
import { breadcrumbLd } from "@/lib/site";

export const revalidate = 604800; // 1 week ISR

export function generateStaticParams() {
  return STATES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = stateBySlug(slug);
  if (!s) return {};
  return {
    title: `${s.name} Retaining Wall Permit & Cost`,
    description: `Do you need a permit for a retaining wall in ${s.name}? The 4-ft rule, the ${s.code} adoption, and a free ${s.name} retaining wall cost & design calculator.`,
    alternates: { canonical: `/states/${s.slug}` },
  };
}

export default async function StatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = stateBySlug(slug);
  if (!s) notFound();
  const pct = Math.round((s.costIndex - 1) * 100);
  const costNote =
    pct === 0 ? "right around the US average" : pct > 0 ? `about ${pct}% above the US average` : `about ${Math.abs(pct)}% below the US average`;
  const crumbs = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "By state", path: "/states" },
    { name: s.name, path: `/states/${s.slug}` },
  ]);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <nav className="mb-3 text-sm text-slate-500">
        <Link href="/states" className="hover:text-slate-900">By state</Link> / {s.name}
      </nav>
      <h1 className="text-3xl font-extrabold text-slate-900">{s.name} Retaining Wall Permit &amp; Cost</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        {s.name} builds on the <strong>{s.code}</strong>. Construction costs here run {costNote}
        {" "}(cost index {s.costIndex.toFixed(2)}). The calculator below is pre-set to {s.name}.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <h2 className="font-semibold text-slate-900">Do you need a permit in {s.name}?</h2>
          <p className="mt-2">
            The model-code line is {ENGINEERING_HEIGHT_FT} ft: under IRC R404.1 / IBC §1807.2, a wall
            retaining more than {ENGINEERING_HEIGHT_FT} ft of earth needs an engineered design, and at
            any height when there is a surcharge (driveway, slope or structure). Most {s.name} building
            departments require a permit at the same point.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Thresholds are set locally. {s.name} delegates enforcement to city/county building
            departments, so always confirm with yours before you build.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <h2 className="font-semibold text-slate-900">{s.name} retaining wall cost</h2>
          <p className="mt-2">
            With a regional cost index of {s.costIndex.toFixed(2)}, a typical segmental block wall in {s.name}
            runs roughly ${Math.round(30 * s.costIndex)} to ${Math.round(60 * s.costIndex)} per square foot of
            wall face installed. Enter your dimensions for a full estimate and materials list.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-900">Frost depth and footing in {s.name}</h2>
        <p className="mt-2">
          The typical frost depth in {s.name} is about <strong>{s.frost} in</strong>. Per IRC R403.1.4 /
          IBC §1809.5 the wall&apos;s base must sit below the frost line, so bury the leveling pad at least
          {" "}{s.frost} in below grade (or one buried course / 12 in minimum, whichever is greater). The
          calculator works this out for your exact wall height. Frost depth varies with elevation, so confirm
          the local figure with your building department.
        </p>
      </div>

      <div className="mt-6">
        <Calculator initial={{ stateSlug: s.slug }} />
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-clay-200 bg-clay-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Hire a retaining wall pro in {s.name}</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Compare quotes from vetted {s.name} contractors and licensed engineers against the numbers
            above. It is free and there is no obligation.
          </p>
        </div>
        <Link href={`/find-a-pro?state=${s.slug}`}
          className="mt-4 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-clay-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-clay-700 sm:mt-0">
          Find a pro in {s.abbr} <span aria-hidden>→</span>
        </Link>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">Other states</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATES.filter((x) => x.slug !== s.slug).slice(0, 14).map((x) => (
            <Link key={x.slug} href={`/states/${x.slug}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-emerald-300">
              {x.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
