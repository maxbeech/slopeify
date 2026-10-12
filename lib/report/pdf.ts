// Renders a ReportModel to a PDF with pdf-lib (pure JS, no native or file-system
// dependencies, so it bundles under Next without extra config). Standard
// Helvetica fonts only; text goes through toWinAnsi() first so a stray symbol can
// never throw at render time.
//
// Layout is a simple top-to-bottom flow on US Letter. Rows and table lines are
// measured before they are drawn and never split across a page; headings stay
// with the row that follows them.
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  clip,
  endPath,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  type Color,
} from "pdf-lib";
import { polygonPath, type WallSection } from "../wall-section";
import { toWinAnsi } from "./format";
import type { CalcStep, ReportModel, ReportSection, Row, Status } from "./model";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 54;
const TOP = 70; // space reserved for the running header on pages after the first
const BOTTOM = 54; // space reserved for the footer
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const C = {
  ink: rgb(0.059, 0.09, 0.165),
  muted: rgb(0.392, 0.455, 0.545),
  rule: rgb(0.886, 0.91, 0.941),
  brand: rgb(0.016, 0.471, 0.341),
  pass: rgb(0.016, 0.471, 0.341),
  fail: rgb(0.745, 0.071, 0.235),
  white: rgb(1, 1, 1),
  tone: {
    emerald: { fill: rgb(0.925, 0.992, 0.961), edge: rgb(0.431, 0.906, 0.718) },
    amber: { fill: rgb(1, 0.984, 0.922), edge: rgb(0.988, 0.827, 0.302) },
    rose: { fill: rgb(1, 0.945, 0.949), edge: rgb(0.992, 0.643, 0.686) },
  },
};

function hexColor(hex: string): Color {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

class Writer {
  page!: PDFPage;
  y = 0;

  constructor(
    readonly doc: PDFDocument,
    readonly f: Fonts,
  ) {
    this.newPage();
  }

  newPage(): void {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - TOP;
  }

  /** Start a new page unless `height` still fits above the footer. */
  ensure(height: number): void {
    if (this.y - height < BOTTOM) this.newPage();
  }

  width(text: string, font: PDFFont, size: number): number {
    return font.widthOfTextAtSize(text, size);
  }

  /** Word-wrap `text` to `maxWidth`, breaking a single over-long token (a URL) by character. */
  wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const lines: string[] = [];
    for (const para of toWinAnsi(text).split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word;
        if (this.width(candidate, font, size) <= maxWidth) {
          line = candidate;
          continue;
        }
        if (line) lines.push(line);
        line = "";
        let rest = word;
        while (this.width(rest, font, size) > maxWidth) {
          let cut = rest.length - 1;
          while (cut > 1 && this.width(rest.slice(0, cut), font, size) > maxWidth) cut--;
          lines.push(rest.slice(0, cut));
          rest = rest.slice(cut);
        }
        line = rest;
      }
      lines.push(line);
    }
    return lines;
  }

  draw(text: string, x: number, y: number, size: number, font: PDFFont, color: Color, align: "left" | "right" = "left"): void {
    const t = toWinAnsi(text);
    if (!t) return;
    const px = align === "right" ? x - this.width(t, font, size) : x;
    this.page.drawText(t, { x: px, y, size, font, color });
  }

  /** A block of wrapped text; returns the height it used. Moves the cursor. */
  paragraph(text: string, opts: { size?: number; font?: PDFFont; color?: Color; x?: number; width?: number; lead?: number } = {}): void {
    const size = opts.size ?? 10;
    const font = opts.font ?? this.f.regular;
    const x = opts.x ?? MARGIN_X;
    const lead = opts.lead ?? size * 1.4;
    const lines = this.wrap(text, font, size, opts.width ?? CONTENT_W - (x - MARGIN_X));
    for (const line of lines) {
      this.ensure(lead);
      this.y -= lead;
      this.draw(line, x, this.y + lead * 0.25, size, font, opts.color ?? C.ink);
    }
  }

  rule(color: Color = C.rule, thickness = 0.6): void {
    this.page.drawLine({ start: { x: MARGIN_X, y: this.y }, end: { x: PAGE_W - MARGIN_X, y: this.y }, thickness, color });
  }

  heading(title: string, keepWith = 56): void {
    this.y -= 14;
    this.ensure(keepWith);
    this.y -= 14;
    this.draw(title, MARGIN_X, this.y, 12.5, this.f.bold, C.brand);
    this.y -= 6;
    this.rule(C.brand, 0.8);
    this.y -= 2;
  }
}

const statusColor = (s?: Status) => (s === "pass" ? C.pass : s === "fail" ? C.fail : C.ink);
// A printed copy loses colour, so pass/fail is also spelled out. Skipped when the value already says it.
const statusTag = (s?: Status, value = "") =>
  /^(pass|fail)$/i.test(value) ? "" : s === "pass" ? "  (pass)" : s === "fail" ? "  (FAIL)" : "";

function drawRows(w: Writer, rows: Row[]): void {
  const labelW = 214;
  const gap = 12;
  const valueW = CONTENT_W - labelW - gap;
  for (const row of rows) {
    const labelLines = w.wrap(row.label, w.f.regular, 9.5, labelW);
    const valueLines = w.wrap(row.value + statusTag(row.status, row.value), w.f.bold, 10, valueW);
    const noteLines = row.note ? w.wrap(row.note, w.f.regular, 8.5, valueW) : [];
    const lines = Math.max(labelLines.length, valueLines.length + noteLines.length);
    const height = lines * 13 + 7;
    w.ensure(height);
    const top = w.y;
    labelLines.forEach((l, i) => w.draw(l, MARGIN_X, top - 13 * (i + 1) + 3, 9.5, w.f.regular, C.muted));
    valueLines.forEach((l, i) => w.draw(l, MARGIN_X + labelW + gap, top - 13 * (i + 1) + 3, 10, w.f.bold, statusColor(row.status)));
    noteLines.forEach((l, i) => w.draw(l, MARGIN_X + labelW + gap, top - 13 * (valueLines.length + i + 1) + 3, 8.5, w.f.regular, C.muted));
    w.y = top - height;
    w.rule();
  }
}

function drawSteps(w: Writer, steps: CalcStep[]): void {
  const labelW = 172;
  const resultW = 104;
  const gap = 10;
  const exprW = CONTENT_W - labelW - resultW - gap * 2;
  for (const step of steps) {
    const labelLines = w.wrap(step.label, w.f.bold, 9.5, labelW);
    const exprLines = w.wrap(step.expression, w.f.regular, 9, exprW);
    const resultLines = w.wrap(step.result + statusTag(step.status, step.result), w.f.bold, 10, resultW);
    const lines = Math.max(labelLines.length, exprLines.length, resultLines.length);
    const height = lines * 12.5 + 8;
    w.ensure(height);
    const top = w.y;
    labelLines.forEach((l, i) => w.draw(l, MARGIN_X, top - 12.5 * (i + 1) + 3, 9.5, w.f.bold, C.ink));
    exprLines.forEach((l, i) => w.draw(l, MARGIN_X + labelW + gap, top - 12.5 * (i + 1) + 3, 9, w.f.regular, C.muted));
    resultLines.forEach((l, i) =>
      w.draw(l, PAGE_W - MARGIN_X, top - 12.5 * (i + 1) + 3, 10, w.f.bold, statusColor(step.status), "right"),
    );
    w.y = top - height;
    w.rule();
  }
}

const TABLE_COLS = (): number[] => [CONTENT_W - 110 - 104, 110, 104];

/** Height a table will take, so a table that fits on one page can be kept whole. */
function tableHeight(w: Writer, s: Extract<ReportSection, { kind: "table" }>): number {
  const widths = TABLE_COLS();
  let h = 26;
  for (const row of s.rows) h += w.wrap(row[0], w.f.regular, 9.5, widths[0] - 8).length * 12.5 + 6;
  for (const row of s.foot) h += w.wrap(row[0], w.f.bold, 9.5, widths[0] + widths[1] - 8).length * 12.5 + 6;
  if (s.note) h += 4 + w.wrap(s.note, w.f.regular, 8.5, CONTENT_W).length * 11.9;
  return h;
}

function drawTable(w: Writer, s: Extract<ReportSection, { kind: "table" }>): void {
  const widths = TABLE_COLS();
  const xs = [MARGIN_X, MARGIN_X + widths[0], MARGIN_X + widths[0] + widths[1]];
  const cell = (text: string, col: number, y: number, font: PDFFont, size: number) => {
    const right = s.columns[col].align === "right";
    w.draw(text, right ? xs[col] + widths[col] : xs[col], y, size, font, C.ink, right ? "right" : "left");
  };
  w.ensure(26);
  w.y -= 14;
  s.columns.forEach((c, i) => cell(c.label, i, w.y, w.f.bold, 9));
  w.y -= 6;
  w.rule(C.ink, 0.8);
  for (const row of s.rows) {
    const lines = w.wrap(row[0], w.f.regular, 9.5, widths[0] - 8);
    const height = lines.length * 12.5 + 6;
    w.ensure(height);
    const top = w.y;
    lines.forEach((l, i) => w.draw(l, MARGIN_X, top - 12.5 * (i + 1) + 2, 9.5, w.f.regular, C.ink));
    cell(row[1], 1, top - 12.5 + 2, w.f.regular, 9.5);
    cell(row[2], 2, top - 12.5 + 2, w.f.regular, 9.5);
    w.y = top - height;
    w.rule();
  }
  for (const row of s.foot) {
    const lines = w.wrap(row[0], w.f.bold, 9.5, widths[0] + widths[1] - 8);
    const height = lines.length * 12.5 + 6;
    w.ensure(height);
    const top = w.y;
    lines.forEach((l, i) => w.draw(l, MARGIN_X, top - 12.5 * (i + 1) + 2, 9.5, w.f.bold, C.ink));
    cell(row[2], 2, top - 12.5 + 2, w.f.bold, 9.5);
    w.y = top - height;
    w.rule();
  }
  if (s.note) {
    w.y -= 4;
    w.paragraph(s.note, { size: 8.5, color: C.muted });
  }
}

function drawBullets(w: Writer, items: string[]): void {
  const indent = 14;
  for (const item of items) {
    const lines = w.wrap(item, w.f.regular, 9.5, CONTENT_W - indent);
    w.ensure(lines.length * 13.5 + 3);
    lines.forEach((l, i) => {
      w.y -= 13.5;
      if (i === 0) w.draw("•", MARGIN_X + 2, w.y + 3, 9.5, w.f.regular, C.brand);
      w.draw(l, MARGIN_X + indent, w.y + 3, 9.5, w.f.regular, C.ink);
    });
    w.y -= 3;
  }
}

/** Draw the shared cross-section shapes, clipped to their frame, scaled to `drawWidth` points. */
function drawSection(w: Writer, section: WallSection, drawWidth: number): void {
  const k = drawWidth / section.width;
  const drawHeight = section.height * k;
  w.ensure(drawHeight + 8);
  const left = MARGIN_X + (CONTENT_W - drawWidth) / 2;
  const top = w.y - 4;
  const bottom = top - drawHeight;
  const px = (x: number) => left + x * k;
  const py = (y: number) => top - y * k;
  const page = w.page;

  page.pushOperators(pushGraphicsState(), rectangle(left, bottom, drawWidth, drawHeight), clip(), endPath());
  for (const s of section.shapes) {
    switch (s.kind) {
      case "rect":
        page.drawRectangle({ x: px(s.x), y: py(s.y + s.height), width: s.width * k, height: s.height * k, color: hexColor(s.fill), opacity: s.opacity });
        break;
      case "polygon":
        page.drawSvgPath(polygonPath(s.points), { x: left, y: top, scale: k, color: hexColor(s.fill), borderWidth: 0 });
        break;
      case "circle":
        page.drawCircle({ x: px(s.cx), y: py(s.cy), size: s.r * k, color: hexColor(s.fill) });
        break;
      case "line":
        page.drawLine({ start: { x: px(s.x1), y: py(s.y1) }, end: { x: px(s.x2), y: py(s.y2) }, thickness: s.strokeWidth * k, color: hexColor(s.stroke) });
        break;
      case "text": {
        const size = s.fontSize * k;
        const t = toWinAnsi(s.text);
        const tw = w.width(t, w.f.regular, size);
        const x = px(s.x) - (s.anchor === "end" ? tw : s.anchor === "middle" ? tw / 2 : 0);
        page.drawText(t, { x, y: py(s.y), size, font: w.f.regular, color: hexColor(s.fill) });
        break;
      }
    }
  }
  page.pushOperators(popGraphicsState());
  page.drawRectangle({ x: left, y: bottom, width: drawWidth, height: drawHeight, borderColor: C.rule, borderWidth: 0.8 });
  w.y = bottom - 4;
}

function cover(w: Writer, model: ReportModel): void {
  const page = w.page;
  page.drawRectangle({ x: 0, y: PAGE_H - 54, width: PAGE_W, height: 54, color: C.brand });
  w.draw("Slopeify", MARGIN_X, PAGE_H - 35, 20, w.f.bold, C.white);
  w.draw("slopeify.com", PAGE_W - MARGIN_X, PAGE_H - 33, 10, w.f.regular, C.white, "right");

  w.y = PAGE_H - 54 - 34;
  w.draw(model.title, MARGIN_X, w.y, 22, w.f.bold, C.ink);
  w.y -= 10;
  w.paragraph(model.subtitle, { size: 11.5, color: C.muted });
  w.y -= 2;
  w.draw(`Reference ${model.reference}     Issued ${model.issuedOn}`, MARGIN_X, w.y - 12, 9.5, w.f.regular, C.muted);
  w.y -= 26;

  // Verdict callout.
  const tone = C.tone[model.verdict.tone];
  const subLines = w.wrap(model.verdict.sub, w.f.regular, 10, CONTENT_W - 28);
  const boxH = 30 + subLines.length * 14 + 10;
  page.drawRectangle({ x: MARGIN_X, y: w.y - boxH, width: CONTENT_W, height: boxH, color: tone.fill, borderColor: tone.edge, borderWidth: 1 });
  w.draw(model.verdict.title, MARGIN_X + 14, w.y - 24, 14, w.f.bold, C.ink);
  subLines.forEach((l, i) => w.draw(l, MARGIN_X + 14, w.y - 42 - i * 14, 10, w.f.regular, C.ink));
  w.y -= boxH + 4;
}

/** Running header (pages after the first) and footer (every page). */
function decoratePages(doc: PDFDocument, f: Fonts, model: ReportModel): void {
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    const text = (t: string, x: number, y: number, size: number, font: PDFFont, color: Color, right = false) => {
      const s = toWinAnsi(t);
      page.drawText(s, { x: right ? x - font.widthOfTextAtSize(s, size) : x, y, size, font, color });
    };
    if (i > 0) {
      text("Slopeify  |  Retaining wall design report", MARGIN_X, PAGE_H - 40, 9, f.bold, C.brand);
      text(model.reference, PAGE_W - MARGIN_X, PAGE_H - 40, 9, f.regular, C.muted, true);
      page.drawLine({ start: { x: MARGIN_X, y: PAGE_H - 48 }, end: { x: PAGE_W - MARGIN_X, y: PAGE_H - 48 }, thickness: 0.6, color: C.rule });
    }
    page.drawLine({ start: { x: MARGIN_X, y: 42 }, end: { x: PAGE_W - MARGIN_X, y: 42 }, thickness: 0.6, color: C.rule });
    text("Planning report from slopeify.com. Not a stamped engineering design.", MARGIN_X, 28, 8, f.regular, C.muted);
    text(`Page ${i + 1} of ${pages.length}`, PAGE_W - MARGIN_X, 28, 8, f.regular, C.muted, true);
  });
}

export interface RenderInput {
  model: ReportModel;
  section: WallSection;
}

/** Render the report. Document dates come from the purchase date; pdf-lib still adds a random suffix to font names, so bytes differ between runs. */
export async function renderReportPdf({ model, section }: RenderInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  const stamp = new Date(`${model.issuedOn}T00:00:00Z`);
  doc.setTitle(toWinAnsi(`${model.title}: ${model.subtitle}`));
  doc.setAuthor("Slopeify");
  doc.setSubject(`Reference ${model.reference}`);
  doc.setCreator("slopeify.com");
  doc.setProducer("Slopeify (pdf-lib)");
  doc.setCreationDate(stamp);
  doc.setModificationDate(stamp);

  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const w = new Writer(doc, fonts);
  cover(w, model);

  const usable = PAGE_H - TOP - BOTTOM - 40;
  for (const s of model.sections) {
    const keep = s.kind === "table" ? Math.min(tableHeight(w, s) + 24, usable) : s.kind === "diagram" ? 400 * (section.height / section.width) + 40 : 56;
    w.heading(s.title, keep);
    if (s.kind === "rows" || s.kind === "steps") {
      if (s.intro) {
        w.y -= 2;
        w.paragraph(s.intro, { size: 9, color: C.muted });
        w.y -= 2;
      }
    }
    switch (s.kind) {
      case "rows":
        drawRows(w, s.rows);
        break;
      case "steps":
        drawSteps(w, s.steps);
        break;
      case "table":
        drawTable(w, s);
        break;
      case "bullets":
        w.y -= 4;
        drawBullets(w, s.items);
        break;
      case "diagram":
        w.y -= 6;
        drawSection(w, section, 400);
        w.y -= 2;
        w.paragraph(s.caption, { size: 8.5, color: C.muted });
        break;
    }
  }

  w.heading("Important");
  w.y -= 4;
  drawBullets(w, model.disclaimer);

  decoratePages(doc, fonts, model);
  return doc.save();
}
