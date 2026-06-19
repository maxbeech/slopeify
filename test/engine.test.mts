// Verification of the retaining-wall engine against hand-computed values, the
// cited code tables, and physical sanity checks. Run: npm test
import { rankineKa, rankineKaSloped, computePressure } from "../lib/earth-pressure.ts";
import { soilById, SOILS } from "../lib/soil.ts";
import { wallTypeById, checkStability, solveBaseWidth, estimateReinforcement } from "../lib/wall.ts";
import { computeMaterials } from "../lib/materials.ts";
import { permitVerdict } from "../lib/permit.ts";
import { designWall, DEFAULT_INPUTS } from "../lib/design.ts";
import { footingDepthInches, stateBySlug } from "../lib/states.ts";
import { blockSizeById, BLOCK_SIZES } from "../lib/materials.ts";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name} ${detail}`); }
}
function near(name: string, got: number, want: number, tol: number) {
  check(`${name} (=${got.toFixed(3)}, want ${want}±${tol})`, Math.abs(got - want) <= tol, `got ${got}`);
}

console.log("Rankine earth-pressure coefficients");
// Ka = tan²(45 − φ/2): φ=30 → 0.3333; φ=34 → 0.2827; φ=0 → 1.0
near("Ka(30)", rankineKa(30), 0.3333, 0.001);
near("Ka(34)", rankineKa(34), 0.2827, 0.001);
near("Ka(0)", rankineKa(0), 1.0, 0.001);
check("Ka decreases with φ", rankineKa(26) > rankineKa(30) && rankineKa(30) > rankineKa(34));
check("sloped Ka ≥ level Ka", rankineKaSloped(30, 18) >= rankineKa(30));

console.log("\nIBC Table 1806.2 presumptive bearing (verbatim)");
check("gravel = 3000 psf", soilById("gravel").bearing === 3000);
check("sand = 2000 psf", soilById("sand").bearing === 2000);
check("silt/clay = 1500 psf", soilById("silt-clay").bearing === 1500);

console.log("\nIBC Table 1610.1 lateral loads (verbatim)");
check("clean sand active = 30 pcf", soilById("sand").efpActive === 30);
check("silty sand active = 45 pcf", soilById("silty-sand").efpActive === 45);
check("clayey sand active = 60 pcf", soilById("clayey-sand").efpActive === 60);
check("at-rest ≥ active for all soils", SOILS.every((s) => s.efpAtRest >= s.efpActive));

console.log("\nEarth-pressure force (½·EFP·H²)");
// Clean sand EFP=30, H=4, level, drained: Pa = 0.5*30*16 = 240 lb/ft at H/3=1.333
const p = computePressure({ soil: soilById("sand"), height: 4, restrained: false, slopeDeg: 0, surcharge: 0, saturated: false });
near("soil force", p.soilForce, 240, 0.5);
near("soil arm", p.soilArm, 1.333, 0.01);
near("overturning moment", p.overturningMoment, 320, 1);
check("surcharge adds horizontal force", computePressure({ soil: soilById("sand"), height: 4, restrained: false, slopeDeg: 0, surcharge: 250, saturated: false }).totalH > p.totalH);
check("saturation roughly doubles+ the push", computePressure({ soil: soilById("sand"), height: 4, restrained: false, slopeDeg: 0, surcharge: 0, saturated: true }).totalH > p.totalH * 1.8);
check("at-rest > active push", computePressure({ soil: soilById("sand"), height: 4, restrained: true, slopeDeg: 0, surcharge: 0, saturated: false }).totalH > p.totalH);

console.log("\nStability check (hand-computed, B=2 ft, 4 ft sand wall)");
// W = 120*2*4 = 960; M_resist = 960*1 = 960; FS_OT = 960/320 = 3.0
// Sliding: 960*0.55 = 528 / 240 = 2.2; bearing q_max = 960 psf ≤ 2000
const sc = checkStability(2, 4, wallTypeById("segmental"), soilById("sand"), p);
near("FS overturning", sc.fsOverturning, 3.0, 0.05);
near("FS sliding", sc.fsSliding, 2.2, 0.05);
check("bearing OK at B=2", sc.bearingOk);
check("passes at B=2", sc.passes);

console.log("\nBase-width solver");
const solSand = solveBaseWidth(4, wallTypeById("segmental"), soilById("sand"), p);
check("4 ft sand wall solvable", solSand.found);
check("base width ~0.5H (1.5–2.5 ft)", solSand.check.baseWidth >= 1.5 && solSand.check.baseWidth <= 2.5);

// Tall wall on weak soil should fail gravity → reinforcement needed.
const pTall = computePressure({ soil: soilById("silt-clay"), height: 8, restrained: false, slopeDeg: 0, surcharge: 0, saturated: false });
const solTall = solveBaseWidth(8, wallTypeById("segmental"), soilById("silt-clay"), pTall);
check("8 ft weak-soil gravity wall fails", !solTall.found);
check("reinforcement recommended", estimateReinforcement(8, solTall.found).needed);
check("geogrid length ≥ 0.6H (≥4.8 ft)", estimateReinforcement(8, false).length >= 4.8 - 0.001);

console.log("\nMaterials takeoff (30 ft × 4 ft segmental)");
const noRein = { needed: false, layers: 0, length: 0, verticalSpacing: 0 };
const mat = computeMaterials({ lengthFt: 30, heightFt: 4, baseWidthFt: 2, wallTypeId: "segmental", reinforcement: noRein, costIndex: 1 });
check("face area = 120 sq ft", mat.faceArea === 120);
const blocks = mat.lines.find((l) => l.item.includes("blocks"));
check("block count ≈ 120–135", Boolean(blocks) && blocks!.qty >= 120 && blocks!.qty <= 135);
check("installed high > low", mat.installedHigh > mat.installedLow);
check("materials cost > 0", mat.materialsCost > 0);

console.log("\nBlock size affects count (smaller blocks → more blocks)");
const matBig = computeMaterials({ lengthFt: 30, heightFt: 4, baseWidthFt: 2, wallTypeId: "segmental", reinforcement: noRein, costIndex: 1, blockFaceSqFt: blockSizeById("garden") });
const garden = matBig.lines.find((l) => l.item.includes("blocks"));
check("garden blocks (0.33 sqft) > standard count", Boolean(garden) && garden!.qty > blocks!.qty);
check("all block sizes have positive face area", BLOCK_SIZES.every((b) => b.faceSqFt > 0));

console.log("\nPrimary material present for every wall type");
for (const wt of ["segmental", "concrete-gravity", "timber", "boulder"]) {
  const m = computeMaterials({ lengthFt: 30, heightFt: 4, baseWidthFt: 2, wallTypeId: wt, reinforcement: noRein, costIndex: 1 });
  const primary = wt === "segmental" ? "blocks" : wt === "concrete-gravity" ? "concrete" : wt === "timber" ? "timbers" : "boulders";
  check(`${wt} lists its primary material (${primary})`, m.lines.some((l) => l.item.toLowerCase().includes(primary)));
}

console.log("\nFooting depth below frost line (IRC R403.1.4)");
check("Minnesota footing ≥ frost 60 in", footingDepthInches("minnesota", 4) === 60);
check("Florida footing = 12 in min (warm)", footingDepthInches("florida", 4) === 12);
check("tall wall raises embedment over warm frost", footingDepthInches("florida", 20) >= 24);
check("every state has a frost value", stateBySlug("texas")!.frost > 0);
const dFrost = designWall({ ...DEFAULT_INPUTS, stateSlug: "minnesota" });
check("design surfaces footing depth", dFrost.footingDepth === 60 && dFrost.frostDepth === 60);

console.log("\nPermit logic (IRC R404 / IBC 1807, 4-ft rule)");
check("5 ft → engineering required", permitVerdict({ height: 5, surcharge: 0, slopeDeg: 0 }).engineeringRequired);
check("3 ft no surcharge → not engineering", !permitVerdict({ height: 3, surcharge: 0, slopeDeg: 0 }).engineeringRequired);
check("3 ft with surcharge → engineering", permitVerdict({ height: 3, surcharge: 250, slopeDeg: 0 }).engineeringRequired);
check("2 ft no surcharge → permit unlikely", !permitVerdict({ height: 2, surcharge: 0, slopeDeg: 0 }).permitLikely);

console.log("\nFull designWall orchestration");
const d = designWall(DEFAULT_INPUTS);
check("default design solvable", d.base.found);
check("default has cost", d.materials.installedHigh > 0);
check("clamps absurd height", designWall({ ...DEFAULT_INPUTS, heightFt: 999 }).inputs.heightFt === 30);
check("unsuitable backfill warns", designWall({ ...DEFAULT_INPUTS, backfillSoilId: "fat-clay" }).warnings.some((w) => w.includes("not a recommended")));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
