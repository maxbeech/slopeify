// What the buyer sees on /report for each outcome of loadReport(): the report
// itself, or a plain explanation of why there isn't one yet. A server component,
// kept apart from the page so every state can be rendered in tests.
import Link from "next/link";
import type { ReactNode } from "react";
import { maskEmail } from "@/lib/report/format";
import type { ReportLoad } from "@/lib/report/load";
import { emailEnabled } from "@/lib/openhelm-mail";
import { SITE } from "@/lib/site";
import ReportView from "./ReportView";

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <div className="mt-2 space-y-2 text-sm text-slate-600">{children}</div>
    </div>
  );
}

const linkCls = "font-medium text-emerald-700 hover:underline";

const contact = (
  <p>
    Need a hand? Email <a className={linkCls} href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> with your Stripe receipt.
  </p>
);

export default function ReportOutcome({ load, sessionId }: { load: ReportLoad; sessionId: string }) {
  const retry = `/report?status=success&session_id=${encodeURIComponent(sessionId)}`;

  switch (load.state) {
    case "ready":
      return (
        <div className="space-y-5">
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5">
            <h1 className="text-xl font-bold text-slate-900">Payment received. Your report is ready.</h1>
            <p className="mt-1 text-sm text-slate-700">Download the PDF to keep, print or hand to a reviewer.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href={`/api/report/pdf?session_id=${encodeURIComponent(load.sessionId)}`}
                className="inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Download the PDF
              </a>
              {emailEnabled() && load.email && (
                <span className="text-xs text-slate-600">We also email a copy to {maskEmail(load.email)}. It can take a minute.</span>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">This tab keeps your report while it stays open, so download the PDF to keep a copy. Anyone with your report link can open it, so keep that link to yourself.</p>
          </div>
          <ReportView model={load.model} design={load.design} />
        </div>
      );
    case "waiting":
      return (
        <Notice title="Your payment is still clearing">
          <p>Stripe has not confirmed the payment yet. Card payments usually clear within a minute.</p>
          <p>Bank debits can take a few days. The report is emailed to you as soon as it clears.</p>
          <p><a className={linkCls} href={retry}>Check again</a></p>
          {contact}
        </Notice>
      );
    case "failed":
      return (
        <Notice title={load.why === "expired" ? "That checkout expired" : "That checkout was not paid"}>
          <p>No money was taken, and no report was made.</p>
          <p><Link className={linkCls} href="/pricing">Back to pricing</Link></p>
        </Notice>
      );
    case "no_wall":
      return (
        <Notice title="Payment received, but the wall is missing">
          <p>Your payment went through, but it has no wall details attached, so there is nothing to build the report from.</p>
          {contact}
        </Notice>
      );
    case "error":
      return (
        <Notice title="Could not confirm your payment">
          <p>We could not reach Stripe just now. Nothing is lost.</p>
          <p><a className={linkCls} href={retry}>Try again</a></p>
          {contact}
        </Notice>
      );
    case "unconfigured":
      return (
        <Notice title="Reports are not switched on here">
          <p>This site is not connected to payments, so it cannot show a report.</p>
        </Notice>
      );
    case "invalid":
      return (
        <Notice title="We could not find that report">
          <p>The link is incomplete or does not match a report purchase. Open the link from your receipt or from the email we sent.</p>
          {contact}
        </Notice>
      );
  }
}
