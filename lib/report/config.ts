// What the paid Pro report needs from the environment, and what to tell a
// customer when it is missing. Values are read at call time (never at import) so a
// Helm7 variable change takes effect on restart without a rebuild, and nothing
// here ever returns or logs a secret: failures name the variable, not its value.
import { SITE } from "../site";

/** Env var names, in one place so the pricing page, routes and README agree. */
export const ENV = {
  secretKey: "STRIPE_SECRET_KEY",
  priceId: "STRIPE_PRICE_ID",
  webhookSecret: "STRIPE_WEBHOOK_SECRET",
} as const;

type Env = Record<string, string | undefined>;

// Shapes Stripe issues. A value that does not match is treated as not set, so a
// pasted dashboard label or a stray space fails loudly here, not at the first sale.
const SECRET_KEY = /^(sk|rk)_(test|live)_[A-Za-z0-9]{10,}$/;
const PRICE_ID = /^price_[A-Za-z0-9]{6,}$/;
const WEBHOOK_SECRET = /^whsec_[A-Za-z0-9]{10,}$/;

function read(env: Env, name: string, shape: RegExp): string | null {
  const v = env[name]?.trim();
  return v && shape.test(v) ? v : null;
}

/** What is needed to look up and render a paid report (success page, PDF download). */
export interface ReadConfig {
  secretKey: string;
  priceId: string;
}

/** What is needed to sell and to fulfil: checkout creation and the webhook. */
export interface SellConfig extends ReadConfig {
  webhookSecret: string;
}

export function readConfig(env: Env = process.env): ReadConfig | null {
  const secretKey = read(env, ENV.secretKey, SECRET_KEY);
  const priceId = read(env, ENV.priceId, PRICE_ID);
  return secretKey && priceId ? { secretKey, priceId } : null;
}

export function sellConfig(env: Env = process.env): SellConfig | null {
  const base = readConfig(env);
  const webhookSecret = read(env, ENV.webhookSecret, WEBHOOK_SECRET);
  return base && webhookSecret ? { ...base, webhookSecret } : null;
}

/** Names (never values) of the variables that are missing or malformed. */
export function missingEnv(env: Env = process.env): string[] {
  const missing: string[] = [];
  if (!read(env, ENV.secretKey, SECRET_KEY)) missing.push(ENV.secretKey);
  if (!read(env, ENV.priceId, PRICE_ID)) missing.push(ENV.priceId);
  if (!read(env, ENV.webhookSecret, WEBHOOK_SECRET)) missing.push(ENV.webhookSecret);
  return missing;
}

/**
 * Selling needs all three variables. The webhook secret is required even though
 * the success page works without it: the webhook is the only thing that reaches a
 * customer who closes the tab after paying, and we do not take money we cannot
 * fulfil.
 */
export function canSell(env: Env = process.env): boolean {
  return sellConfig(env) !== null;
}

/** The one sentence shown (and returned by /api/checkout) while payments are off. */
export const REPORT_UNAVAILABLE_MESSAGE =
  `The Pro report can't be bought yet because card payments aren't connected on this site; ` +
  `email ${SITE.contactEmail} to hear when that changes.`;

/** Base URL for links back to the site (Stripe redirects, email). Same rule the checkout route always used. */
export function siteBase(env: Env = process.env): string {
  return (env.NEXT_PUBLIC_SITE_URL || SITE.url).replace(/\/+$/, "");
}
