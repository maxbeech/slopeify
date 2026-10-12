// Shared fixtures for the paid-report tests. Every credential here is an obviously
// fake placeholder shaped like Stripe's; none is, or was ever, a real key.
import { PDFArray, PDFDocument, decodePDFRawStream, type PDFRawStream } from "pdf-lib";
import { DEFAULT_INPUTS, type DesignInputs } from "../../lib/design.ts";
import { encodeInputs } from "../../lib/calc-url.ts";

export const SESSION_ID = "cs_test_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6";
export const PRICE_ID = "price_1TestSlopeifyReport";
/**
 * A Stripe-shaped fake, assembled at runtime from its prefix and body so that no
 * literal anywhere in the repo matches a Stripe key or secret pattern (secret
 * scanners flag those even when they are fakes). Fixed values, so failures reproduce.
 */
export const fakeStripe = (prefix: "sk_test" | "sk_live" | "rk_live" | "pk_test" | "whsec", body: string) =>
  [prefix, body].join("_");

export const SECRET_KEY = fakeStripe("sk_test", "FAKEFAKEFAKE0000");
export const WEBHOOK_SECRET = fakeStripe("whsec", "FAKEFAKEFAKEFAKEFAKE0000");
export const BUYER_EMAIL = "buyer@example.com";

/** Complete, valid environment for selling and fulfilling. */
export const ENV_OK = {
  STRIPE_SECRET_KEY: SECRET_KEY,
  STRIPE_PRICE_ID: PRICE_ID,
  STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
} as const;

// Walls taken from the engine's own test data (test/engine.test.mts).
export const WALLS: Record<string, DesignInputs> = {
  // DEFAULT_INPUTS: 4 ft clean-sand segmental wall in California. Passes with a 2 ft base.
  default: DEFAULT_INPUTS,
  // "8 ft weak-soil gravity wall fails" and needs geogrid.
  tallWeak: { ...DEFAULT_INPUTS, heightFt: 8, backfillSoilId: "silt-clay", foundationSoilId: "silt-clay" },
  // The Minnesota frost-depth case (footing 60 in).
  minnesota: { ...DEFAULT_INPUTS, stateSlug: "minnesota" },
  // Every optional input switched on: slope, surcharge, drainage failure, at-rest.
  loaded: { ...DEFAULT_INPUTS, heightFt: 6, slopeDeg: 18, surcharge: 250, saturated: true, restrained: true, wallTypeId: "concrete-gravity" },
};

/** A Checkout Session as Stripe returns it with line_items expanded, paid and ours. */
export function fakeSession(over: Record<string, unknown> = {}, wall: DesignInputs = DEFAULT_INPUTS) {
  return {
    id: SESSION_ID,
    object: "checkout.session",
    mode: "payment",
    status: "complete",
    payment_status: "paid",
    livemode: false,
    created: 1760000000, // 2025-10-09 UTC
    currency: "usd",
    amount_total: 2900,
    customer_details: { email: BUYER_EMAIL },
    metadata: { wall: encodeInputs(wall) },
    line_items: { data: [{ price: { id: PRICE_ID }, quantity: 1 }] },
    ...over,
  };
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

/** Replace global fetch for the duration of a test. Anything the handler declines to answer throws, so no test can reach the network. */
export function stubFetch(handler: (call: Call) => Response | Promise<Response> | undefined) {
  const calls: Call[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const call: Call = {
      url,
      method: init?.method ?? "GET",
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
      body: typeof init?.body === "string" ? init.body : init?.body ? String(init.body) : "",
    };
    calls.push(call);
    const res = await handler(call);
    if (!res) throw new Error(`test stub: unexpected fetch ${call.method} ${url}`);
    return res;
  }) as typeof fetch;
  return { calls, restore: () => { globalThis.fetch = original; } };
}

/** Stub that answers Stripe's session lookup with `session` (or a status) and refuses everything else. */
export function stripeReturns(session: unknown, status = 200) {
  return stubFetch((c) => (c.url.startsWith("https://api.stripe.com/v1/checkout/sessions/") ? json(session, status) : undefined));
}

/** Set env vars for a block, then put them back exactly as they were. */
export function withEnv<T>(env: Record<string, string | undefined>, run: () => T): T {
  const before: Record<string, string | undefined> = {};
  for (const k of Object.keys(env)) before[k] = process.env[k];
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  const restore = () => {
    for (const [k, v] of Object.entries(before)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };
  try {
    const out = run();
    if (out instanceof Promise) return out.finally(restore) as T;
    restore();
    return out;
  } catch (err) {
    restore();
    throw err;
  }
}

/** Every string a PDF draws, in order, by decoding the page content streams. */
export async function pdfText(bytes: Uint8Array): Promise<string> {
  const doc = await PDFDocument.load(bytes);
  const parts: string[] = [];
  for (const page of doc.getPages()) {
    const contents = page.node.Contents();
    const streams = contents instanceof PDFArray ? contents.asArray().map((ref) => doc.context.lookup(ref)) : [contents];
    for (const stream of streams) {
      if (!stream) continue;
      const content = Buffer.from(decodePDFRawStream(stream as PDFRawStream).decode()).toString("latin1");
      for (const m of content.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) parts.push(Buffer.from(m[1], "hex").toString("latin1"));
    }
  }
  return parts.join("\n");
}

/** Pick named exports from an already-imported module, whether tsx exposes them directly or under `default`. */
export function pick<T extends string>(mod: unknown, ...names: T[]): Record<T, (...a: never[]) => unknown> {
  const m = mod as Record<string, unknown> & { default?: Record<string, unknown> };
  const out: Record<string, unknown> = {};
  for (const n of names) out[n] = m[n] ?? m.default?.[n];
  return out as Record<T, (...a: never[]) => unknown>;
}
