import { SITE } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.name} collects, uses and protects information. The calculator runs entirely in your browser; we do not require an account.`,
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-extrabold text-slate-900">Privacy policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated July 7, 2026.</p>

      <p className="mt-6 text-slate-600">
        {SITE.name} ({SITE.domain}) is built so that using the calculator does not require handing over
        personal information. This page explains exactly what we collect, when, and why.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">The calculator itself</h2>
      <p className="mt-2 text-slate-600">
        The wall designer runs entirely in your browser. The numbers you enter (height, soil type,
        surcharge, and so on) are never sent to our servers. There is no account, no login and no
        database record of your project. If you use &quot;Copy share link,&quot; your inputs are encoded
        directly into the URL, which only you hold.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Analytics</h2>
      <p className="mt-2 text-slate-600">
        We use Vercel Web Analytics to understand which pages get traffic and how the site performs. It
        is cookieless and reports aggregated counts (page views, referrers, rough device/location), not
        individual browsing history tied to you.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Affiliate and referral links</h2>
      <p className="mt-2 text-slate-600">
        Materials takeoff lines link out to retailers (Home Depot, Amazon) and, where configured, the
        &quot;find a pro&quot; CTAs link to a contractor or engineer matching partner. Some of these are
        affiliate or referral links: if you buy through one or submit a match request, we may earn a
        commission at no extra cost to you. Once you click through, that retailer or partner&apos;s own
        privacy policy governs the data they collect, not ours. We only pass along the minimal job
        context needed for the match (for example, your state and wall height), never your name, address
        or contact details, unless you choose to share those directly with them.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Email</h2>
      <p className="mt-2 text-slate-600">
        If you email {SITE.contactEmail} (for example, to ask about the Pro report or to get matched with
        a pro before the matching network covers your region), we use your message and reply address only
        to respond to you or make that introduction. We do not add you to a mailing list from a support
        email.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Payments</h2>
      <p className="mt-2 text-slate-600">
        The Pro design report is purchased through Stripe&apos;s hosted checkout. We never see or store
        your card number; Stripe processes the payment under its own privacy policy and PCI compliance
        obligations. We receive confirmation that a purchase happened and the report is delivered to the
        email you provide at checkout.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Cookies</h2>
      <p className="mt-2 text-slate-600">
        We do not set advertising or tracking cookies of our own. Third-party links (retailers, payment
        processor, matching partners) may set their own cookies once you leave {SITE.domain}, governed by
        their policies.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Your choices</h2>
      <p className="mt-2 text-slate-600">
        Because we hold no account and no project database, there is nothing to export or delete on our
        end beyond email correspondence. To have an email exchange removed, contact us at{" "}
        {SITE.contactEmail}.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Changes</h2>
      <p className="mt-2 text-slate-600">
        If this policy changes in a material way, we will update the date at the top of this page.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Contact</h2>
      <p className="mt-2 text-slate-600">
        Questions about this policy: {SITE.contactEmail}.
      </p>
    </article>
  );
}
