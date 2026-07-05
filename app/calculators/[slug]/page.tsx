import Link from "next/link";
import { notFound } from "next/navigation";
import Calculator from "@/components/Calculator";
import Faq from "@/components/Faq";
import { CALCULATORS, calcBySlug } from "@/lib/calculators";
import { breadcrumbLd } from "@/lib/site";

export const revalidate = 604800; // 1 week ISR

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = calcBySlug(slug);
  if (!c) return {};
  return { title: c.title, description: c.description, alternates: { canonical: `/calculators/${c.slug}` } };
}

export default async function CalcPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = calcBySlug(slug);
  if (!c) notFound();

  const crumbs = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Calculators", path: "/calculators" },
    { name: c.h1, path: `/calculators/${c.slug}` },
  ]);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <nav className="mb-3 text-sm text-slate-500">
        <Link href="/calculators" className="hover:text-slate-900">Calculators</Link> / {c.h1}
      </nav>
      <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{c.h1}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">{c.intro}</p>
      <ul className="mt-4 flex flex-wrap gap-2 text-xs">
        {c.bullets.map((b) => <li key={b} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800">{b}</li>)}
      </ul>

      <div className="mt-6">
        <Calculator
          focus={c.focus}
          initial={c.presetWallType ? { wallTypeId: c.presetWallType } : undefined}
          lockWallType={Boolean(c.presetWallType)}
        />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">Other calculators</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {CALCULATORS.filter((x) => x.slug !== c.slug).map((x) => (
            <Link key={x.slug} href={`/calculators/${x.slug}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-emerald-300">
              {x.h1}
            </Link>
          ))}
        </div>
      </section>

      <Faq />
    </div>
  );
}
