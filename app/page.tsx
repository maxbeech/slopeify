import Link from "next/link";
import Calculator from "@/components/Calculator";
import Faq from "@/components/Faq";
import { FAQS } from "@/lib/faq";
import { CALCULATORS } from "@/lib/calculators";
import { POSTS } from "@/lib/posts";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Retaining Wall Calculator — Design, Cost & Permit",
  description: SITE.description,
};

export default function Home() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE.name,
    applicationCategory: "Engineering",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: SITE.description,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <section className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Free Retaining Wall Calculator
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Get the earth pressure, the minimum base width, the overturning / sliding / bearing factors
          of safety, whether you need geogrid, a materials takeoff with cost, and whether your wall
          needs a permit — built on real engineering, not guesswork.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">IBC Table 1610.1 soil loads</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">IBC Table 1806.2 bearing</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">Rankine earth pressure</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">No sign-up</span>
        </div>
      </section>

      <Calculator />

      {/* Calculator variants */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">More retaining wall calculators</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CALCULATORS.map((c) => (
            <Link key={c.slug} href={`/calculators/${c.slug}`}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:border-emerald-300 hover:shadow-sm">
              <div className="font-semibold text-slate-900">{c.h1}</div>
              <div className="mt-1 text-sm text-slate-500">{c.intro.slice(0, 90)}…</div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works strip */}
      <section className="mt-12 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-slate-900">How RetainCalc HQ designs your wall</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm text-slate-600">
          <div>
            <div className="font-semibold text-slate-800">1. Earth pressure</div>
            <p className="mt-1">The soil load comes from IBC Table 1610.1 (equivalent-fluid pressure), increased for slope and surcharge via Rankine theory.</p>
          </div>
          <div>
            <div className="font-semibold text-slate-800">2. Stability</div>
            <p className="mt-1">We solve for the minimum base width that passes overturning (FS ≥ 2.0), sliding (FS ≥ 1.5) and bearing (IBC Table 1806.2).</p>
          </div>
          <div>
            <div className="font-semibold text-slate-800">3. Materials &amp; permit</div>
            <p className="mt-1">A full takeoff with cost, geogrid when needed, and a permit verdict based on the 4-ft code rule.</p>
          </div>
        </div>
        <Link href="/methodology" className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline">
          Read the full methodology &amp; code references →
        </Link>
      </section>

      {/* Latest guides */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">Retaining wall guides</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {POSTS.slice(0, 6).map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:border-emerald-300">
              <div className="font-semibold text-slate-900">{p.title}</div>
              <div className="mt-1 text-sm text-slate-500">{p.description}</div>
            </Link>
          ))}
        </div>
      </section>

      <Faq />
    </>
  );
}
