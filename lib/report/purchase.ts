// How a purchase remembers which wall it is for. Slopeify has no database, so the
// buyer's inputs ride on the Stripe Checkout Session itself (metadata.wall), using
// the same compact query-string encoding the share links use. The report is then
// rebuilt from those inputs by the real engine, so Stripe is the only record and
// there is no table to keep in sync.
import { createHash } from "node:crypto";
import { clampInputs, type DesignInputs } from "../design";
import { decodeInputs, encodeInputs } from "../calc-url";
import { stateBySlug } from "../states";
import { wallTypeById } from "../wall";

/** The metadata key on the Checkout Session. Stripe allows 500 chars per value; ours is ~100. */
export const WALL_METADATA_KEY = "wall";

/** Every parameter encodeInputs() writes. A purchase must carry all of them. */
export const WALL_KEYS = ["h", "l", "b", "f", "w", "sl", "sc", "r", "sat", "st", "bs"] as const;

/**
 * Strictly parse a wall string. Returns the validated, clamped inputs, or null
 * when anything is missing. Strict on purpose: a partial string would silently
 * fill the gaps with defaults and sell the buyer a report for a wall they never
 * described.
 */
export function parseWall(raw: unknown): DesignInputs | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 500) return null;
  const params = new URLSearchParams(raw);
  if (!WALL_KEYS.every((k) => params.has(k))) return null;
  return clampInputs(decodeInputs(raw));
}

/** The canonical string stored in metadata and echoed in links: normalised by the same code that reads it. */
export function wallParam(inputs: DesignInputs): string {
  return encodeInputs(inputs);
}

/** One line naming the wall, for Stripe's checkout page, the email and the PDF title. */
export function describeWall(inputs: DesignInputs): string {
  const wall = wallTypeById(inputs.wallTypeId);
  const state = stateBySlug(inputs.stateSlug);
  return `${wall.label}, ${inputs.heightFt} ft high, ${inputs.lengthFt} ft long${state ? `, ${state.name}` : ""}`;
}

/**
 * A short reference printed on the report so a buyer can quote it to support.
 * Derived from the session id by a one-way hash, so the printed reference never
 * exposes the id that unlocks the download.
 */
export function reportReference(sessionId: string): string {
  return "SLP-" + createHash("sha256").update(sessionId).digest("hex").slice(0, 8).toUpperCase();
}
