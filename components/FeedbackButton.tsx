"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

/**
 * The user-facing feedback control. Opens Sentry's feedback form, so a report
 * from a visitor lands in the same Sentry project as the exceptions.
 *
 * The SDK is imported lazily so the marketing pages do not pull the browser
 * SDK into their initial bundle just to render a link.
 */
export function FeedbackButton({
  className = "",
  variant = "link",
  user,
}: {
  className?: string;
  variant?: "link" | "pill";
  /** Signed-in user, used to pre-fill the form. Slopeify has no accounts yet. */
  user?: { email?: string | null; name?: string | null };
}) {
  const [unavailable, setUnavailable] = useState(false);

  const open = async () => {
    const Sentry = await import("@sentry/nextjs");
    const feedback = Sentry.getFeedback();
    if (!feedback) {
      // No DSN on this deployment: say so rather than a button that does nothing.
      setUnavailable(true);
      return;
    }
    if (user?.email) Sentry.setUser({ email: user.email, ...(user.name ? { username: user.name } : {}) });
    const form = await feedback.createForm();
    form.appendToDom();
    form.open();
  };

  if (unavailable) {
    return (
      <span className={className}>
        Feedback is not switched on here. Email{" "}
        <a className="underline underline-offset-2" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </span>
    );
  }

  const base = variant === "pill"
    ? "rounded-md px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900"
    : "hover:text-slate-900";
  return (
    <button type="button" onClick={open} className={`${base} ${className}`.trim()}>
      Send feedback
    </button>
  );
}
