// Single source of truth for encoding/decoding the designer inputs to URL query
// params, so any result is shareable, bookmarkable and deep-linkable. Pure +
// validated: every value is clamped or checked against its allowed set, so a
// hand-edited or tracking-param-only URL can never produce NaN or a bad input.
import { DEFAULT_INPUTS, type DesignInputs } from "./design";
import { SOILS, FOUNDATION_SOILS } from "./soil";
import { WALL_TYPES } from "./wall";
import { STATES } from "./states";

const SOIL_IDS = SOILS.map((s) => s.id);
const FOUND_IDS = FOUNDATION_SOILS.map((s) => s.id);
const WALL_IDS = WALL_TYPES.map((w) => w.id);
const STATE_SLUGS = STATES.map((s) => s.slug);

function num(v: string | null, min: number, max: number, fallback: number): number {
  if (v === null || v.trim() === "") return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
function pick<T extends string>(v: string | null, allowed: T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}
function bool(v: string | null, fallback: boolean): boolean {
  if (v === null) return fallback;
  return v === "1" || v === "true";
}

export function encodeInputs(i: DesignInputs): string {
  return new URLSearchParams({
    h: String(i.heightFt),
    l: String(i.lengthFt),
    b: i.backfillSoilId,
    f: i.foundationSoilId,
    w: i.wallTypeId,
    sl: String(i.slopeDeg),
    sc: String(i.surcharge),
    r: i.restrained ? "1" : "0",
    sat: i.saturated ? "1" : "0",
    st: i.stateSlug,
  }).toString();
}

export function decodeInputs(search: string, fallbackState = DEFAULT_INPUTS.stateSlug): DesignInputs {
  const p = new URLSearchParams(search);
  if ([...p.keys()].length === 0) return { ...DEFAULT_INPUTS, stateSlug: fallbackState };
  return {
    heightFt: num(p.get("h"), 1, 30, DEFAULT_INPUTS.heightFt),
    lengthFt: num(p.get("l"), 1, 2000, DEFAULT_INPUTS.lengthFt),
    backfillSoilId: pick(p.get("b"), SOIL_IDS, DEFAULT_INPUTS.backfillSoilId),
    foundationSoilId: pick(p.get("f"), FOUND_IDS, DEFAULT_INPUTS.foundationSoilId),
    wallTypeId: pick(p.get("w"), WALL_IDS, DEFAULT_INPUTS.wallTypeId),
    slopeDeg: num(p.get("sl"), 0, 34, DEFAULT_INPUTS.slopeDeg),
    surcharge: num(p.get("sc"), 0, 2000, DEFAULT_INPUTS.surcharge),
    restrained: bool(p.get("r"), DEFAULT_INPUTS.restrained),
    saturated: bool(p.get("sat"), DEFAULT_INPUTS.saturated),
    stateSlug: pick(p.get("st"), STATE_SLUGS, fallbackState),
  };
}
