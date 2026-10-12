// Emailing the report. Uses the repo's own sender (lib/openhelm-mail.ts); no new
// email code. The Stripe session id is the idempotency key, so a retried webhook
// or a second event for the same purchase (completed, then async_payment_succeeded)
// returns the original message instead of delivering twice.
import { emailEnabled, sendEmail, type SendEmailInput, type SendResult } from "../openhelm-mail";
import { SITE } from "../site";
import { siteBase } from "./config";
import { reportPdf, type ReadyReport } from "./load";

export type DeliveryResult =
  | { ok: true; status: string }
  /** `retry` says whether trying again later could help (config or provider trouble), so the webhook knows whether to ask Stripe to redeliver. */
  | { ok: false; retry: boolean; reason: "no_email" | "not_configured" | "send_failed"; detail?: string };

export interface DeliverDeps {
  send?: (input: SendEmailInput) => Promise<SendResult>;
  enabled?: () => boolean;
}

/** Idempotency key for a purchase's email. */
export const emailClientId = (sessionId: string) => `slopeify-report-${sessionId}`;

export function reportEmail(ready: ReadyReport): Pick<SendEmailInput, "subject" | "markdown"> {
  const link = `${siteBase()}/report?session_id=${ready.sessionId}`;
  const { verdict, subtitle } = ready.model;
  return {
    subject: `Your Slopeify design report (${ready.reference})`,
    markdown: [
      "Your Slopeify design report is attached as a PDF.",
      `**${subtitle}**\n${verdict.title}. ${verdict.sub}`,
      `Reference: ${ready.reference}`,
      `You can also open it online at ${link}. Anyone with that link can open the report, so keep it to yourself.`,
      "This is a planning report, not a stamped engineering design. A wall over 4 ft, or any wall with a surcharge, needs a licensed engineer and a local permit.",
      `Questions, or a problem with the report? Write to ${SITE.contactEmail}.`,
      "Slopeify",
    ].join("\n\n"),
  };
}

export async function emailReport(ready: ReadyReport, deps: DeliverDeps = {}): Promise<DeliveryResult> {
  if (!ready.email) return { ok: false, retry: false, reason: "no_email" };
  if (!(deps.enabled ?? emailEnabled)()) return { ok: false, retry: true, reason: "not_configured" };

  const pdf = await reportPdf(ready);
  const { subject, markdown } = reportEmail(ready);
  const result = await (deps.send ?? sendEmail)({
    to: ready.email,
    subject,
    markdown,
    clientId: emailClientId(ready.sessionId),
    attachments: [
      {
        filename: `slopeify-retaining-wall-report-${ready.reference}.pdf`,
        content: Buffer.from(pdf).toString("base64"),
        contentType: "application/pdf",
      },
    ],
  });
  if (!result.sent) return { ok: false, retry: true, reason: "send_failed", detail: result.reason === "error" ? result.error : result.reason };
  return { ok: true, status: result.status };
}
