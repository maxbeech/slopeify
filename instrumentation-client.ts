import * as Sentry from "@sentry/nextjs";
import { sharedSentryOptions } from "@/lib/sentry-options";

/**
 * Browser error reporting. Loaded by Next on the client at boot.
 *
 * The feedback integration backs the "Send feedback" controls in the header and
 * footer, so a report from a person lands in the same Sentry project as the
 * exceptions from the code.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const shared = sharedSentryOptions();

if (dsn) {
  Sentry.init({
    dsn,
    ...shared,
    // Requests go through our own tunnel route (next.config.ts). Required, not
    // cosmetic: when a feedback report includes a screenshot the browser sends
    // the envelope as a raw ArrayBuffer with NO Content-Type header, and the
    // tunnel then receives an empty body, so the submit silently fails.
    // See getsentry/sentry-javascript#16112.
    transportOptions: { headers: { "content-type": "application/x-sentry-envelope" } },
    integrations: [
      ...shared.integrations,
      Sentry.feedbackIntegration({
        colorScheme: "system",
        // Opened by our own controls; no floating Sentry button over the page.
        autoInject: false,
        showBranding: false,
        formTitle: "Send feedback",
        submitButtonLabel: "Send feedback",
        messagePlaceholder: "A bug, an idea, anything on your mind.",
        successMessageText: "Thank you. That has gone straight to the team.",
      }),
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
