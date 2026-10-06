"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

type FeedbackUser = { email?: string | null; name?: string | null };
type FeedbackSdk = {
  getFeedback: () => { createForm: () => Promise<{ appendToDom: () => void; open: () => void }> } | undefined;
  setUser: (u: { email?: string; username?: string }) => void;
};

/** Opens Sentry's feedback form (pre-filled for a known user). False when feedback is not configured. */
export async function openFeedbackForm(load: () => Promise<FeedbackSdk>, user?: FeedbackUser): Promise<boolean> {
  const sdk = await load();
  const feedback = sdk.getFeedback();
  if (!feedback) return false;
  if (user?.email) sdk.setUser({ email: user.email, ...(user.name ? { username: user.name } : {}) });
  const form = await feedback.createForm();
  form.appendToDom();
  form.open();
  return true;
}

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
  label = "Send feedback",
  user,
}: {
  className?: string;
  variant?: "link" | "pill";
  label?: string;
  /** Signed-in user, used to pre-fill the form. Slopeify has no accounts yet. */
  user?: FeedbackUser;
}) {
  const [unavailable, setUnavailable] = useState(false);

  const open = async () => {
    try {
      const ok = await openFeedbackForm(() => import("@sentry/nextjs") as Promise<FeedbackSdk>, user);
      // No DSN on this deployment: say so rather than a button that does nothing.
      if (!ok) setUnavailable(true);
    } catch (err) {
      console.error("[feedback] could not open the form", err instanceof Error ? err.message : "error");
      setUnavailable(true);
    }
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
      {label}
    </button>
  );
}
