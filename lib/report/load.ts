// Turns a Stripe Checkout Session id into either a ready report or an honest
// reason there isn't one. The success page, the PDF download and the webhook all
// go through here, so none of them can show or send a report that the others
// would refuse.
import { designWall, type DesignResult } from "../design";
import { captureServerMessage } from "../observability";
import { wallSection } from "../wall-section";
import { readConfig } from "./config";
import { isoDate } from "./format";
import { buildReport, type ReportModel } from "./model";
import { renderReportPdf } from "./pdf";
import { reportReference } from "./purchase";
import { checkReportSession, fetchCheckoutSession, type SessionCheck } from "./session";

type Env = Record<string, string | undefined>;

export interface ReadyReport {
  state: "ready";
  sessionId: string;
  /** The buyer's address from Checkout, or null. Only for sending; never printed in the report. */
  email: string | null;
  reference: string;
  design: DesignResult;
  model: ReportModel;
}

export type ReportLoad =
  /** STRIPE_SECRET_KEY / STRIPE_PRICE_ID are not set or malformed. */
  | { state: "unconfigured" }
  /** Malformed id, unknown session, or a session that is not a Slopeify report. */
  | { state: "invalid" }
  /** Ours, checkout is open or the payment is still clearing. */
  | { state: "waiting"; why: "processing" | "open" }
  /** Ours, but it never paid. */
  | { state: "failed"; why: "expired" | "not_paid" }
  /** Paid and ours, but with no usable wall attached. Needs a human. */
  | { state: "no_wall" }
  /** Stripe could not be reached or refused the request. */
  | { state: "error" }
  | ReadyReport;

/** Build the report from a session that has already passed checkReportSession(). */
export function buildReady(check: Extract<SessionCheck, { ok: true }>): ReadyReport {
  const design = designWall(check.wall);
  const reference = reportReference(check.sessionId);
  return {
    state: "ready",
    sessionId: check.sessionId,
    email: check.email,
    reference,
    design,
    model: buildReport(design, { reference, issuedOn: isoDate(check.created) }),
  };
}

export async function loadReport(
  sessionId: string | null | undefined,
  deps: { env?: Env; fetchImpl?: typeof fetch } = {},
): Promise<ReportLoad> {
  const cfg = readConfig(deps.env ?? process.env);
  if (!cfg) return { state: "unconfigured" };

  const fetched = await fetchCheckoutSession(sessionId, cfg.secretKey, deps.fetchImpl);
  if (!fetched.ok) {
    if (fetched.kind === "invalid_id" || fetched.kind === "not_found") return { state: "invalid" };
    captureServerMessage("Stripe session lookup failed", { scope: "report", kind: fetched.kind, httpStatus: fetched.httpStatus ?? 0 });
    return { state: "error" };
  }

  const check = checkReportSession(fetched.session, cfg.priceId);
  if (check.ok) return buildReady(check);

  switch (check.reason) {
    case "foreign":
      return { state: "invalid" };
    case "processing":
    case "open":
      return { state: "waiting", why: check.reason };
    case "expired":
    case "not_paid":
      return { state: "failed", why: check.reason };
    case "no_wall":
      captureServerMessage("Paid report session has no usable wall", { scope: "report" });
      return { state: "no_wall" };
  }
}

/** The PDF bytes for a ready report: the same model the page shows, drawn with the shared cross-section. */
export async function reportPdf(ready: ReadyReport): Promise<Uint8Array> {
  return renderReportPdf({ model: ready.model, section: wallSection(ready.design) });
}

export const REPORT_FILENAME = "slopeify-retaining-wall-report.pdf";
