// Verifies the share-URL encode/decode is a lossless, validated round-trip and
// that stale / tracking-only URLs fall back to defaults instead of producing NaN.
import { encodeInputs, decodeInputs } from "../lib/calc-url.ts";
import { DEFAULT_INPUTS, type DesignInputs } from "../lib/design.ts";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name} ${detail}`); }
}

const sample: DesignInputs = {
  heightFt: 6, lengthFt: 45, backfillSoilId: "silty-sand", foundationSoilId: "gravel",
  wallTypeId: "concrete-gravity", slopeDeg: 18, surcharge: 250, restrained: true,
  saturated: false, stateSlug: "texas", blockSizeId: "jumbo",
};

const round = decodeInputs(encodeInputs(sample));
check("height round-trips", round.heightFt === sample.heightFt);
check("length round-trips", round.lengthFt === sample.lengthFt);
check("backfill round-trips", round.backfillSoilId === sample.backfillSoilId);
check("foundation round-trips", round.foundationSoilId === sample.foundationSoilId);
check("wall type round-trips", round.wallTypeId === sample.wallTypeId);
check("slope round-trips", round.slopeDeg === sample.slopeDeg);
check("surcharge round-trips", round.surcharge === sample.surcharge);
check("restrained round-trips", round.restrained === sample.restrained);
check("state round-trips", round.stateSlug === sample.stateSlug);
check("block size round-trips", round.blockSizeId === sample.blockSizeId);

// Empty / tracking-only URLs → defaults, never NaN.
const empty = decodeInputs("");
check("empty → defaults", empty.heightFt === DEFAULT_INPUTS.heightFt && empty.wallTypeId === DEFAULT_INPUTS.wallTypeId);
const tracking = decodeInputs("?utm_source=google&fbclid=abc");
check("tracking-only → defaults (no NaN)", Number.isFinite(tracking.heightFt) && tracking.heightFt === DEFAULT_INPUTS.heightFt);

// Garbage values are clamped / rejected.
const bad = decodeInputs("?h=abc&w=nonsense&b=invalid&sc=-99");
check("bad height → default", bad.heightFt === DEFAULT_INPUTS.heightFt);
check("bad wall type → default", bad.wallTypeId === DEFAULT_INPUTS.wallTypeId);
check("bad soil → default", bad.backfillSoilId === DEFAULT_INPUTS.backfillSoilId);
check("negative surcharge clamped to 0", bad.surcharge === 0);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
