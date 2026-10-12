// The paid report from the real calculation output: the content model, the shared
// cross-section geometry, the PDF bytes (decoded and read back), and the download
// route. Fixture walls come from the engine's own test data. Run: npm test
import { PDFDocument } from "pdf-lib";
import { designWall, DEFAULT_INPUTS, type DesignInputs } from "../lib/design.ts";
import { SOILS, FOUNDATION_SOILS } from "../lib/soil.ts";
import { WALL_TYPES } from "../lib/wall.ts";
import { STATES } from "../lib/states.ts";
import { buildReport, type ReportModel, type ReportSection } from "../lib/report/model.ts";
import { renderReportPdf } from "../lib/report/pdf.ts";
import { fix, int, money, toWinAnsi } from "../lib/report/format.ts";
import { reportReference } from "../lib/report/purchase.ts";
import { verdictFor, permitHeadline } from "../lib/result-text.ts";
import { polygonPath, wallSection } from "../lib/wall-section.ts";
import { loadReport, reportPdf } from "../lib/report/load.ts";
import {
  BUYER_EMAIL, ENV_OK, SECRET_KEY, SESSION_ID, WALLS,
  fakeSession, pdfText, pick, stripeReturns, withEnv,
} from "./helpers/report-fixtures.mts";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name} ${detail}`); }
}
const META = { reference: reportReference(SESSION_ID), issuedOn: "2025-10-09" };
const compact = (s: string) => s.replace(/\s+/g, "");

/** Every string the model carries, for whole-model checks. */
function strings(model: ReportModel): string[] {
  const out = [model.title, model.subtitle, model.reference, model.verdict.title, model.verdict.sub, ...model.disclaimer];
  for (const s of model.sections) {
    out.push(s.title);
    if ("intro" in s && s.intro) out.push(s.intro);
    if (s.kind === "rows") for (const r of s.rows) out.push(r.label, r.value, ...(r.note ? [r.note] : []));
    if (s.kind === "steps") for (const r of s.steps) out.push(r.label, r.expression, r.result);
    if (s.kind === "table") { for (const r of [...s.rows, ...s.foot]) out.push(...r); out.push(...s.columns.map((c) => c.label), ...(s.note ? [s.note] : [])); }
    if (s.kind === "bullets") out.push(...s.items);
    if (s.kind === "diagram") out.push(s.caption);
  }
  return out;
}
const section = (m: ReportModel, title: string) => m.sections.find((s) => s.title.endsWith(title)) as ReportSection;
const stepResult = (m: ReportModel, label: string) => {
  const s = m.sections.find((x) => x.kind === "steps" && x.steps.some((t) => t.label.startsWith(label)));
  return s && s.kind === "steps" ? s.steps.find((t) => t.label.startsWith(label))?.result : undefined;
};

console.log("Report content comes from the engine result (4 ft sand wall, hand-computed in engine.test.mts)");
const d = designWall(DEFAULT_INPUTS);
const m = buildReport(d, META);
// W = 120*2*4 = 960; overturning moment 320; FS_OT = 3.0; sliding = 960*0.55/240 = 2.2; bearing 960 psf.
check("wall weight 960 lb/ft", stepResult(m, "Wall weight W") === "960 lb/ft", stepResult(m, "Wall weight W"));
check("soil force 240 lb/ft", stepResult(m, "Soil force Pa") === "240 lb/ft");
check("soil force acts at 1.33 ft", stepResult(m, "Soil force acts above the base at") === "1.33 ft");
check("overturning moment 320 ft-lb/ft", stepResult(m, "Overturning moment about the toe") === "320 ft-lb/ft");
check("overturning FS 3.00 and sliding FS 2.20", stepResult(m, "Overturning factor of safety") === "3.00" && stepResult(m, "Sliding factor of safety") === "2.20");
check("bearing 960 psf against 2,000 allowable", stepResult(m, "Maximum bearing pressure") === "960 psf" && JSON.stringify(m).includes("IBC Table 1806.2: 2,000 psf"));
check("minimum base width 2.00 ft", stepResult(m, "Minimum base width B") === "2.00 ft");
check("verdict is the engine's own verdict", JSON.stringify(m.verdict) === JSON.stringify(verdictFor(d)) && m.verdict.tone === "emerald");
check("permit headline is the shared one", JSON.stringify(m).includes(permitHeadline(d.permit)));
check("cost range and materials total are the engine's", JSON.stringify(m).includes(`${money(d.materials.installedLow)} to ${money(d.materials.installedHigh)}`) && JSON.stringify(m).includes(money(d.materials.materialsCost)));
check("every takeoff line appears", d.materials.lines.every((l) => JSON.stringify(m).includes(l.item.replace(/"/g, '\\"')) ));
check("footing depth is the engine's", JSON.stringify(m).includes(`${d.footingDepth} in below grade`));
check("title, date and reference carried through", m.title === "Retaining wall design report" && m.issuedOn === "2025-10-09" && m.reference === META.reference);
check("sections are numbered 1..n in order", m.sections.every((s, i) => s.title.startsWith(`${i + 1}. `)));
check("no geogrid section when gravity works", !m.sections.some((s) => s.title.endsWith("Geogrid reinforcement")));
check("cites the codes the methodology page cites", ["IBC Table 1610.1", "IBC Table 1806.2", "IRC R403.1.4", "IRC R404.1", "NCMA", "NAVFAC"].every((c) => JSON.stringify(m).includes(c)));
check("states it is not a stamped design", m.disclaimer.some((x) => x.includes("not a stamped engineering design")));

console.log("\nHard cases");
{
  const dt = designWall(WALLS.tallWeak);
  const mt = buildReport(dt, META);
  check("8 ft weak-soil wall: verdict needs reinforcement", mt.verdict.tone === "amber" && mt.verdict.title === "Needs geogrid reinforcement");
  const g = section(mt, "Geogrid reinforcement");
  check("geogrid section present with the engine's layers and length", g?.kind === "rows" && g.rows[0].value === String(dt.reinforcement.layers) && g.rows[1].value === `${fix(dt.reinforcement.length)} ft`);
  check("failed checks are marked FAIL in the data", mt.sections.some((s) => s.kind === "steps" && s.steps.some((t) => t.status === "fail")));
  check("widest-tried base is labelled as such", stepResult(mt, "Base width B (widest tried)") !== undefined);
  const c = dt.base.check;
  check("an unbounded bearing pressure reads 'Not stable', never 'Infinity' or 'NaN'", (Number.isFinite(c.bearingMax) || stepResult(mt, "Maximum bearing pressure") === "Not stable") && !/Infinity|NaN|undefined/.test(JSON.stringify(mt)));
  const notes = mt.sections.findIndex((s) => s.title.endsWith("Notes and next steps"));
  const cost = mt.sections.findIndex((s) => s.title.endsWith("Materials and cost"));
  const hasBelow = JSON.stringify(mt.sections[notes]).includes("estimate below");
  check("the engine's 'estimate below' warning is followed by the cost section", !hasBelow || notes < cost, `${notes} vs ${cost}`);

  const dl = designWall(WALLS.loaded);
  const ml = buildReport(dl, META);
  check("at-rest case is labelled", JSON.stringify(ml).includes("at-rest") && JSON.stringify(ml).includes("At-rest (wall restrained at the top)"));
  check("slope step shows the engine's increase", JSON.stringify(ml).includes("Sloped-backfill increase") && JSON.stringify(ml).includes(`x ${fix(dl.pressure.efp / dl.backfill.efpAtRest, 3)}`));
  check("surcharge step uses Ka x q x H with this wall's numbers", JSON.stringify(ml).includes(`Ka x q x H = ${fix(dl.pressure.kaEff, 3)} x 250 x 6`));
  check("hydrostatic step uses 62.4 pcf", JSON.stringify(ml).includes("0.5 x 62.4 x 6^2"));
  check("drainage failure is stated in the inputs", JSON.stringify(ml).includes("No working drainage"));

  const dm = designWall(WALLS.minnesota);
  check("Minnesota footing 60 in and frost depth 60 in", JSON.stringify(buildReport(dm, META)).includes("60 in below grade") && JSON.stringify(buildReport(dm, META)).includes("Frost depth, Minnesota"));
}

console.log("\nCopy rules hold across every wall type, soil, slope, surcharge, drainage and state");
{
  let combos = 0, badChar = 0, dash = 0, bad = 0;
  const firstBad: string[] = [];
  const states = [STATES[0], STATES[4], STATES[22], STATES[50]];
  for (const wallTypeId of WALL_TYPES.map((w) => w.id))
    for (const backfillSoilId of SOILS.map((s) => s.id))
      for (const foundationSoilId of FOUNDATION_SOILS.map((s) => s.id))
        for (const slopeDeg of [0, 26])
          for (const surcharge of [0, 600])
            for (const saturated of [false, true]) {
              const st = states[combos % states.length];
              const input: DesignInputs = { ...DEFAULT_INPUTS, wallTypeId, backfillSoilId, foundationSoilId, slopeDeg, surcharge, saturated, restrained: combos % 3 === 0, heightFt: [2, 4, 6, 12][combos % 4], stateSlug: st.slug };
              combos++;
              const model = buildReport(designWall(input), META);
              for (const s of strings(model)) {
                if (toWinAnsi(s).includes("?")) { badChar++; if (firstBad.length < 3) firstBad.push(s.slice(0, 80)); }
                if (s.includes("\u2014")) dash++;
                if (/Infinity|NaN|undefined|\[object/.test(s)) { bad++; if (firstBad.length < 3) firstBad.push(s.slice(0, 80)); }
              }
            }
  check(`${combos} combinations built`, combos === WALL_TYPES.length * SOILS.length * FOUNDATION_SOILS.length * 8, String(combos));
  check("every character is encodable by the PDF's standard fonts (none fell back to '?')", badChar === 0, firstBad.join(" | "));
  check("no em dash in any report text", dash === 0);
  check("no Infinity, NaN, undefined or [object] leaks into the text", bad === 0, firstBad.join(" | "));
}

console.log("\nText encoding");
check("symbols map to plain equivalents", toWinAnsi("4′ H ≥ 2″ \u2014 φ ≤") === "4' H >= 2\" - phi <=", toWinAnsi("4′ H ≥ 2″ \u2014 φ ≤"));
check("characters the font has are kept", toWinAnsi("§ ½ × ² · “q”") === "§ ½ × ² · “q”");
check("an unknown character becomes '?', not an exception", toWinAnsi("a中b") === "a?b");
check("formatters turn Infinity and NaN into n/a", fix(Infinity) === "n/a" && fix(NaN) === "n/a" && int(Infinity) === "n/a" && fix(2) === "2.00" && int(1234.6) === "1,235");

console.log("\nCross-section geometry (shared by the page and the PDF)");
{
  let worstBottom = 0, worstRight = 0, count = 0;
  for (const H of [1, 2, 4, 6, 8, 12, 20, 30]) for (const wallTypeId of WALL_TYPES.map((w) => w.id)) for (const slopeDeg of [0, 26]) {
    const r = designWall({ ...DEFAULT_INPUTS, heightFt: H, wallTypeId, slopeDeg });
    const sec = wallSection(r);
    count++;
    for (const s of sec.shapes) {
      if (s.kind === "text") { worstBottom = Math.max(worstBottom, s.y + 3 - sec.height); worstRight = Math.max(worstRight, s.x - sec.width); }
    }
  }
  check(`${count} drawings: every label sits inside the frame (the base label used to be clipped)`, worstBottom <= 0 && worstRight <= 0, `overflow ${worstBottom.toFixed(1)}`);
  const sec = wallSection(d);
  check("label describes the wall", sec.label === "Cross-section: 4 ft wall on a 2 ft base");
  check("dimension labels carry the calculated height and base width", sec.shapes.some((s) => s.kind === "text" && s.text === "4′ H") && sec.shapes.some((s) => s.kind === "text" && s.text === "2′ base"));
  check("background covers the whole frame", sec.shapes[0].kind === "rect" && sec.shapes[0].height === sec.height && sec.shapes[0].width === sec.width);
  check("polygon path format", polygonPath([[1, 2], [3, 4], [5, 6]]) === "M 1 2 L 3 4 L 5 6 Z");
}

console.log("\nThe PDF itself");
{
  const bytes = await reportPdf({ state: "ready", sessionId: SESSION_ID, email: BUYER_EMAIL, reference: META.reference, design: d, model: m });
  const head = Buffer.from(bytes.slice(0, 5)).toString();
  const tail = Buffer.from(bytes.slice(-8)).toString();
  check("is a PDF (header and end marker)", head === "%PDF-" && tail.includes("%%EOF"));
  const doc = await PDFDocument.load(bytes);
  check("opens again with a PDF parser, on US Letter", doc.getPageCount() >= 3 && doc.getPage(0).getWidth() === 612 && doc.getPage(0).getHeight() === 792, `${doc.getPageCount()} pages`);
  check("document title and subject name the wall and the reference", doc.getTitle()!.includes("Segmental block (SRW), 4 ft high") && doc.getSubject() === `Reference ${META.reference}`);
  check("creation date is the purchase date", doc.getCreationDate()!.toISOString().startsWith("2025-10-09"));
  check("a modest file size", bytes.length > 5_000 && bytes.length < 200_000, String(bytes.length));

  const text = await pdfText(bytes);
  const flat = compact(text);
  check("prints the title, reference and issue date", flat.includes(compact("Retaining wall design report")) && flat.includes(META.reference) && flat.includes("2025-10-09"));
  check("prints the verdict", flat.includes(compact(m.verdict.title)) && flat.includes(compact(m.verdict.sub)));
  let missing: string[] = [];
  for (const s of m.sections) {
    check(`prints section heading "${s.title}"`, flat.includes(compact(toWinAnsi(s.title))));
    const needles: string[] = [];
    if (s.kind === "rows") for (const r of s.rows) needles.push(r.value);
    if (s.kind === "steps") for (const r of s.steps) needles.push(r.result);
    if (s.kind === "table") for (const r of [...s.rows, ...s.foot]) needles.push(...r.filter(Boolean));
    if (s.kind === "bullets") needles.push(...s.items);
    missing = missing.concat(needles.filter((n) => !flat.includes(compact(toWinAnsi(n)))));
  }
  check("every value, result, table cell and bullet in the model is drawn in the PDF", missing.length === 0, missing.slice(0, 3).join(" | "));
  check("prints the hand-computed figures", ["960lb/ft", "240lb/ft", "320ft-lb/ft", "3.00(pass)", "2.20(pass)"].every((n) => flat.includes(n)));
  check("draws the cross-section's dimension labels", text.includes("4' H") && text.includes("2' base"));
  const pages = doc.getPageCount();
  check("every page has a footer 'Page i of n'", Array.from({ length: pages }, (_, i) => flat.includes(`Page${i + 1}of${pages}`)).every(Boolean));
  check("states it is not a stamped design in the footer and the body", flat.includes(compact("Not a stamped engineering design")) && flat.includes(compact("It is not a stamped engineering design")));
  check("does not print the buyer's email or the session id", !text.includes(BUYER_EMAIL) && !text.includes(SESSION_ID) && !text.includes("cs_test_"));
}
{
  const dt = designWall(WALLS.tallWeak);
  const bytes = await renderReportPdf({ model: buildReport(dt, META), section: wallSection(dt) });
  const text = await pdfText(bytes);
  check("hard case renders: FAIL is spelled out and the geogrid section is drawn", text.includes("(FAIL)") && text.includes("Geogrid reinforcement") && text.includes(`${dt.reinforcement.layers}`));
  check("hard case: base label not clipped (drawn inside the frame)", text.includes(`${dt.base.check.baseWidth}' base`));
}
{
  let rendered = 0, pagesMax = 0;
  const sample = Object.values(WALLS).concat(
    WALL_TYPES.map((w) => ({ ...DEFAULT_INPUTS, wallTypeId: w.id, heightFt: 10, slopeDeg: 14, surcharge: 100 })),
    [1, 30].map((h) => ({ ...DEFAULT_INPUTS, heightFt: h, lengthFt: 2000 })),
  );
  for (const input of sample) {
    const r = designWall(input);
    const bytes = await renderReportPdf({ model: buildReport(r, META), section: wallSection(r) });
    const reloaded = await PDFDocument.load(bytes);
    rendered++; pagesMax = Math.max(pagesMax, reloaded.getPageCount());
  }
  check(`${rendered} varied reports render and re-open`, rendered === sample.length);
  check("none runs past a sensible length", pagesMax <= 8, String(pagesMax));
}

console.log("\nGET /api/report/pdf");
const { GET: download } = pick(await import("../app/api/report/pdf/route.ts"), "GET");
const get = (id: string | null) => (download as (r: Request) => Promise<Response>)(new Request(`http://localhost/api/report/pdf${id === null ? "" : `?session_id=${id}`}`));
const quiet = async <T,>(run: () => Promise<T>): Promise<T> => { const w = console.warn, e = console.error; console.warn = () => {}; console.error = () => {}; try { return await run(); } finally { console.warn = w; console.error = e; } };
{
  const s = stripeReturns(fakeSession());
  const res = await withEnv(ENV_OK, () => get(SESSION_ID));
  const body = new Uint8Array(await res.arrayBuffer());
  check("paid session: 200 with a PDF body", res.status === 200 && Buffer.from(body.slice(0, 5)).toString() === "%PDF-");
  check("served as an attachment named with the report reference", res.headers.get("content-type") === "application/pdf" && res.headers.get("content-disposition") === `attachment; filename="slopeify-retaining-wall-report-${META.reference}.pdf"`, res.headers.get("content-disposition") ?? "");
  check("never cached or indexed", res.headers.get("cache-control") === "private, no-store" && /noindex/.test(res.headers.get("x-robots-tag") ?? ""));
  check("content length matches the body", res.headers.get("content-length") === String(body.byteLength));
  check("the report was rebuilt from Stripe's session, with the secret key", s.calls.length === 1 && s.calls[0].headers.authorization === `Bearer ${SECRET_KEY}` && s.calls[0].url.includes("expand%5B%5D=line_items"));
  check("the PDF is for the wall stored on the session", (await pdfText(body)).includes("4 ft high"));
  s.restore();
}
{
  const s = stripeReturns(fakeSession({}, WALLS.tallWeak));
  const res = await withEnv(ENV_OK, () => get(SESSION_ID));
  check("a different stored wall gives a different report", (await pdfText(new Uint8Array(await res.arrayBuffer()))).includes("8 ft high"));
  s.restore();
}
const refuse = async (session: unknown, stripeStatus: number, env: Record<string, string | undefined> = ENV_OK, id: string | null = SESSION_ID) => {
  const s = stripeReturns(session, stripeStatus);
  try {
    const res = await quiet(() => withEnv(env, () => get(id)));
    const text = await res.text();
    return { status: res.status, text, calls: s.calls.length, type: res.headers.get("content-type") ?? "" };
  } finally { s.restore(); }
};
{
  const unknown = await refuse({ error: {} }, 404);
  const foreign = await refuse(fakeSession({ line_items: { data: [{ price: { id: "price_1Other" } }] } }), 200);
  const wrongMode = await refuse(fakeSession({ mode: "subscription" }), 200);
  check("unknown session: 404", unknown.status === 404);
  check("someone else's session: 404, byte-for-byte the same answer as unknown", foreign.status === 404 && foreign.text === unknown.text && wrongMode.status === 404 && wrongMode.text === unknown.text);
  check("unpaid session: 402, no PDF", (await refuse(fakeSession({ payment_status: "unpaid" }), 200)).status === 402);
  check("expired session: 402", (await refuse(fakeSession({ payment_status: "unpaid", status: "expired" }), 200)).status === 402);
  check("paid but no wall: 409", (await refuse(fakeSession({ metadata: {} }), 200)).status === 409);
  check("Stripe down: 502", (await refuse({ error: {} }, 503)).status === 502);
  check("keys not set: 503", (await refuse(fakeSession(), 200, { STRIPE_SECRET_KEY: undefined, STRIPE_PRICE_ID: undefined })).status === 503);
  const noId = await refuse(fakeSession(), 200, ENV_OK, null);
  const badId = await refuse(fakeSession(), 200, ENV_OK, "cs_test_x/../../v1/charges");
  check("no session_id or a malformed one: 404 and Stripe is never asked", noId.status === 404 && badId.status === 404 && noId.calls === 0 && badId.calls === 0);
  check("refusals are JSON and never echo the session id or any key", [unknown, foreign, noId].every((r) => r.type.includes("json") && !r.text.includes(SESSION_ID) && !r.text.includes(SECRET_KEY)));
}
{
  const r = await quiet(async () => {
    const s = stripeReturns(fakeSession());
    try { return await withEnv(ENV_OK, () => loadReport(SESSION_ID)); } finally { s.restore(); }
  });
  check("loadReport and the route agree on a paid session", r.state === "ready");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
