import Link from "next/link";
import { STATES, stateBySlug } from "@/lib/states";
import { SITE, breadcrumbLd } from "@/lib/site";
import { proReferral, CONTRACTOR_PARTNER_URL } from "@/lib/leadgen";

export const metadata = {
  title: "Find a Retaining Wall Contractor or Engineer Near You",
  description:
    "Get matched with vetted retaining wall contractors and licensed structural engineers near you. Compare quotes against a free, code-based design estimate first, so you know a fair price.",
  alternates: { canonical: "/find-a-pro" },
};

const STEPS = [
  {
    t: "Design and budget it first",
    d: "Run your wall through the free calculator. You get a base width, the factors of safety, a materials takeoff and an installed cost range, so you walk into every conversation knowing the numbers.",
  },
  {
    t: "Get matched with the right pro",
    d: "Tall wall or a surcharge means you need a licensed engineer for a stamped design before a contractor builds it. Shorter walls on good soil usually just need a good installer. We point you to the right one.",
  },
  {
    t: "Compare real quotes",
    d: "Collect two or three quotes and check them against the calculator's cost range. A fair bid lines up with the face-area estimate for your material, plus drainage and any reinforcement.",
  },
];

const CHECKLIST = [
  "Ask for a drainage detail: drain rock, perforated pipe to daylight, and filter fabric. This is the number one thing that fails.",
  "Confirm the base is buried below the frost line and sits on a compacted crushed-stone pad.",
  "For any wall over 4 ft, or with a driveway or slope above it, ask who stamps the engineered design.",
  "Get the permit responsibility in writing before work starts.",
  "Check licensing, insurance, and a few local references for walls at your height.",
];

export default async function FindAPro({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const sp = (await searchParams) ?? {};
  const need = sp.need === "engineer" ? "engineer" : "contractor";
  const state = sp.state ? stateBySlug(sp.state) : undefined;
  const contractor = proReferral("contractor", { stateSlug: state?.slug });
  const engineer = proReferral("engineer", { stateSlug: state?.slug });
  const hasPartner = Boolean(CONTRACTOR_PARTNER_URL);

  const crumbs = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Find a pro", path: "/find-a-pro" },
  ]);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <nav className="mb-3 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Home</Link> / Find a pro
      </nav>

      <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
        Find a retaining wall contractor or engineer {state ? `in ${state.name}` : "near you"}
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        The smartest way to hire is to know the design and the budget before you call anyone. Price your
        wall with the free calculator, then compare quotes from vetted local pros against real numbers.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {need === "engineer" ? (
          <>
            <CtaLink {...engineer} variant="clay">Get matched with an engineer</CtaLink>
            <CtaLink {...contractor} variant="pine">Get contractor quotes</CtaLink>
          </>
        ) : (
          <>
            <CtaLink {...contractor} variant="clay">Get matched with a contractor</CtaLink>
            <CtaLink {...engineer} variant="pine">Talk to an engineer</CtaLink>
          </>
        )}
        <Link href="/" className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Design my wall first
        </Link>
      </div>
      {!hasPartner && (
        <p className="mt-3 text-xs text-slate-500">
          Our matching network is rolling out by region. Email{" "}
          <a href={`mailto:${SITE.contactEmail}?subject=Retaining%20wall%20pro%20match`} className="font-medium text-emerald-700 hover:underline">
            {SITE.contactEmail}
          </a>{" "}
          with your location and wall height and we will connect you.
        </p>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">How to hire the right way</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.t} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="tabular text-sm font-bold text-emerald-700">{i + 1}</div>
              <div className="mt-1 font-semibold text-slate-900">{s.t}</div>
              <p className="mt-1 text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-bold text-slate-900">What to ask every retaining wall contractor</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {CHECKLIST.map((c) => (
            <li key={c} className="flex gap-2">
              <span className="mt-0.5 text-emerald-700">✓</span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">Browse by state</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATES.map((s) => (
            <Link key={s.slug} href={`/find-a-pro?state=${s.slug}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-emerald-300">
              {s.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function CtaLink({ href, external, variant, children }: { href: string; external: boolean; variant: "clay" | "pine"; children: React.ReactNode }) {
  const cls = variant === "clay" ? "bg-clay-600 text-white hover:bg-clay-700" : "bg-emerald-700 text-white hover:bg-emerald-800";
  return (
    <Link href={href} target={external ? "_blank" : undefined} rel={external ? "noopener sponsored" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${cls}`}>
      {children} <span aria-hidden>→</span>
    </Link>
  );
}
