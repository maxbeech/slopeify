import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

/** Paths whose URL carries the Stripe session id that unlocks the paid report. */
export const NO_REFERRER_PATHS = ["/report", "/api/report/:path*"];

const nextConfig: NextConfig = {
  // Send no Referer from these pages, so the session id in their URL never leaves
  // for a script, font or link host. The page also sets the meta tag, and the PDF
  // route sets the header itself; this covers every response on those paths.
  async headers() {
    return NO_REFERRER_PATHS.map((source) => ({
      source,
      headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
    }));
  },
};

/**
 * Sentry wraps the build to upload source maps. The upload is skipped without
 * an auth token, so `npm run build` still works for anyone without Sentry set up.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "maxed-labs",
  project: process.env.SENTRY_PROJECT || "slopeify_web",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Route the browser SDK through our own domain so an ad blocker does not
  // drop reports. `true` picks a random path per build; a fixed "/monitoring"
  // is on ad-blocker lists.
  tunnelRoute: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
