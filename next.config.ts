import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
