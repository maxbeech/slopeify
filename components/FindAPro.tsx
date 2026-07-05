// The primary lead-gen surface. Shown in-context on every result: when the wall
// needs an engineered design we lead with a licensed engineer; otherwise we lead
// with local contractor quotes. Both are the segments advertisers pay the most
// to reach, so this is where the free tool earns its keep.
import Link from "next/link";
import { proReferral } from "@/lib/leadgen";

function ArrowLink({
  href,
  external,
  children,
  variant,
}: {
  href: string;
  external: boolean;
  children: React.ReactNode;
  variant: "clay" | "pine" | "ghost";
}) {
  const cls =
    variant === "clay"
      ? "bg-clay-600 text-white hover:bg-clay-700"
      : variant === "pine"
        ? "bg-emerald-700 text-white hover:bg-emerald-800"
        : "border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50";
  const rel = external ? "noopener sponsored" : undefined;
  const target = external ? "_blank" : undefined;
  return (
    <Link href={href} target={target} rel={rel}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${cls}`}>
      {children}
      <span aria-hidden>→</span>
    </Link>
  );
}

export default function FindAPro({
  engineeringRequired,
  stateSlug,
  stateName,
  heightFt,
}: {
  engineeringRequired: boolean;
  stateSlug?: string;
  stateName?: string;
  heightFt?: number;
}) {
  const contractor = proReferral("contractor", { stateSlug, heightFt });
  const engineer = proReferral("engineer", { stateSlug, heightFt });
  const where = stateName ? `in ${stateName}` : "near you";

  return (
    <div className="overflow-hidden rounded-xl border border-clay-200 bg-clay-50 print:hidden">
      <div className="border-b border-clay-100 bg-white/60 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-clay-700">
        Next step
      </div>
      <div className="p-5">
        {engineeringRequired ? (
          <>
            <h3 className="text-lg font-bold text-slate-900">This wall needs a stamped design</h3>
            <p className="mt-1 text-sm text-slate-600">
              At this height or with a surcharge, the code calls for a licensed engineer and a permit.
              Get matched with a structural engineer {where} who stamps residential retaining walls, then
              a contractor to build it. Comparing quotes is free and there is no obligation.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <ArrowLink href={engineer.href} external={engineer.external} variant="clay">
                Get a stamped design quote
              </ArrowLink>
              <ArrowLink href={contractor.href} external={contractor.external} variant="ghost">
                Also get build quotes
              </ArrowLink>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-slate-900">Get it priced by local pros</h3>
            <p className="mt-1 text-sm text-slate-600">
              You have the design and a budget range. The next step is a real quote. Compare vetted
              retaining wall contractors {where} against the numbers above, so you know a fair price
              before anyone starts digging. It is free and there is no obligation.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <ArrowLink href={contractor.href} external={contractor.external} variant="clay">
                Compare contractor quotes
              </ArrowLink>
              <ArrowLink href={engineer.href} external={engineer.external} variant="ghost">
                Talk to an engineer first
              </ArrowLink>
            </div>
          </>
        )}
        <p className="mt-3 text-xs text-slate-500">
          We may be paid a referral fee by a matched pro. It never affects your price or our estimate.
        </p>
      </div>
    </div>
  );
}
