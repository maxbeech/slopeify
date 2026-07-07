import { SITE } from "@/lib/site";

export const metadata = {
  title: "Terms of Service",
  description: `The terms for using ${SITE.name}'s free calculator, referral matching, and Pro design report.`,
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-extrabold text-slate-900">Terms of service</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated July 7, 2026.</p>

      <p className="mt-6 text-slate-600">
        These terms govern your use of {SITE.name} ({SITE.domain}). By using the site, you agree to them.
        If you do not agree, do not use the site.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">1. What this is: a planning tool</h2>
      <p className="mt-2 text-slate-600">
        {SITE.name} produces planning-level estimates for retaining wall design, cost and permit
        requirements, computed from published code tables (IBC Table 1610.1, IBC Table 1806.2, IRC
        provisions) and standard Rankine earth-pressure and stability methods, documented in full on{" "}
        <a href="/methodology" className="text-emerald-700 hover:underline">/methodology</a>. It is{" "}
        <strong>not a substitute for a licensed engineer&apos;s stamped design or a local building
        permit</strong>. Any wall over 4 feet, or with a surcharge (a driveway, structure, or slope above
        it), needs a licensed engineer and a permit, regardless of what the calculator shows. Soil
        conditions, drainage, seismic zone and local amendments vary by site, and only a site-specific
        geotechnical and structural review can confirm a design is safe to build.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">2. No warranty</h2>
      <p className="mt-2 text-slate-600">
        The calculator, the guides, the state pages and the Pro design report are provided &quot;as is,&quot;
        without warranty of any kind, express or implied, including fitness for a particular purpose or
        that results are error-free or applicable to your specific site or jurisdiction. You are
        responsible for verifying any output with a licensed professional and your local building
        department before construction.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">3. Limitation of liability</h2>
      <p className="mt-2 text-slate-600">
        To the fullest extent permitted by law, {SITE.name} and its operator are not liable for any
        damages, direct or indirect, arising from use of the site, reliance on any calculation, guide, or
        referral, or from work performed by a contractor or engineer you were matched with. Our total
        liability for any claim is limited to the amount you paid us in the twelve months before the
        claim, or $50 if you paid us nothing.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">4. Referrals to contractors and engineers</h2>
      <p className="mt-2 text-slate-600">
        The &quot;find a pro&quot; feature connects you with independent third-party contractors and
        licensed engineers. They are not our employees, agents or partners in a legal sense, and we do
        not supervise, warrant, or guarantee their work, licensing, insurance, or pricing. You are
        responsible for vetting anyone you hire, including confirming license and insurance status
        yourself. Some of these referrals are paid (see the affiliate disclosure on relevant pages and our{" "}
        <a href="/privacy" className="text-emerald-700 hover:underline">privacy policy</a>).
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">5. Affiliate links</h2>
      <p className="mt-2 text-slate-600">
        Materials takeoff lines include links to retailers such as Home Depot and Amazon. Some are
        affiliate links: if you buy through one, we may earn a commission at no extra cost to you. This
        never changes the quantities or prices the calculator computes.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">6. The Pro design report</h2>
      <p className="mt-2 text-slate-600">
        The Pro design report is a one-time paid PDF summarizing the same calculation shown for free on
        the site, formatted for a permit reviewer or client. It carries the same &quot;planning tool, not
        a stamped design&quot; limitation as the free calculator. Purchases are processed by Stripe;
        refund requests can be sent to {SITE.contactEmail} and are handled case by case.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">7. Acceptable use</h2>
      <p className="mt-2 text-slate-600">
        Don&apos;t attempt to disrupt the site, scrape it at abusive volume, or misrepresent calculator
        output as a licensed engineer&apos;s stamped design when submitting it to a building department.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">8. Changes</h2>
      <p className="mt-2 text-slate-600">
        We may update these terms as the site changes. The date at the top of this page reflects the most
        recent revision. Continued use after a change means you accept the update.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">9. Contact</h2>
      <p className="mt-2 text-slate-600">Questions about these terms: {SITE.contactEmail}.</p>
    </article>
  );
}
