import Link from "next/link";
import Calculator from "@/components/Calculator";
import Faq from "@/components/Faq";
import { FAQS } from "@/lib/faq";
import { CALCULATORS } from "@/lib/calculators";
import { POSTS } from "@/lib/posts";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Retaining Wall Calculator: Design, Cost & Permit",
  description: SITE.description,
  alternates: { canonical: "/" },
};

const TRUST = [
  "IBC Table 1610.1 soil loads",
  "IBC Table 1806.2 bearing",
  "Rankine earth pressure",
  "No sign-up",
];

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

      <section className="mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="blueprint px-6 py-10 sm:px-10 sm:py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Built on real engineering, not guesswork
          </div>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            Design a retaining wall that actually stands up.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Enter your wall and get the earth pressure, the minimum base width, the overturning, sliding
            and bearing factors of safety, a geogrid check, a full materials takeoff with cost, and a
            permit verdict. Every number traces back to a published code table.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {TRUST.map((t) => (
              <span key={t} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">{t}</span>
            ))}
          </div>
        </div>
      </section>

      <Calculator />

      <section className="mt-14">
        <h2 className="text-xl font-bold text-slate-900">More retaining wall calculators</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CALCULATORS.map((c) => (
            <Link key={c.slug} href={`/calculators/${c.slug}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm">
              <div className="font-semibold text-slate-900 group-hover:text-emerald-800">{c.h1}</div>
              <div className="mt-1 text-sm text-slate-500">{c.intro.slice(0, 88)}…</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900">How Slopeify designs your wall</h2>
        <div className="mt-5 grid gap-6 text-sm text-slate-600 sm:grid-cols-3">
          <Step n="01" title="Earth pressure" body="The soil load comes from IBC Table 1610.1 as an equivalent-fluid pressure, then increased for slope and surcharge with Rankine theory." />
          <Step n="02" title="Stability" body="We solve for the minimum base width that passes overturning (FS 2.0), sliding (FS 1.5) and bearing against IBC Table 1806.2." />
          <Step n="03" title="Materials and permit" body="A full takeoff with cost, geogrid when the checks fail, and a permit verdict from the 4-ft code rule." />
        </div>
        <Link href="/methodology" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
          Read the full methodology and code references <span aria-hidden>→</span>
        </Link>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-bold text-slate-900">Retaining wall guides</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {POSTS.slice(0, 6).map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm">
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

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="relative border-l-2 border-emerald-100 pl-4">
      <div className="tabular text-xs font-bold text-emerald-700">{n}</div>
      <div className="mt-1 font-semibold text-slate-900">{title}</div>
      <p className="mt-1">{body}</p>
    </div>
  );
}
