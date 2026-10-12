// Geometry of the cross-section drawing, as plain shapes in a 360 x 284 box
// (y grows downward, like SVG). It is the single source for two renderers:
// components/WallDiagram.tsx draws it as SVG on screen, and lib/report/pdf.ts
// draws the same shapes into the paid PDF. Driven by the engine result, so the
// picture always matches the numbers.
import type { DesignResult } from "./design";

export type SectionShape =
  | { kind: "rect"; x: number; y: number; width: number; height: number; fill: string; opacity?: number }
  | { kind: "polygon"; points: [number, number][]; fill: string }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; stroke: string; strokeWidth: number }
  | { kind: "text"; x: number; y: number; text: string; fontSize: number; fill: string; anchor: "start" | "middle" | "end" };

export interface WallSection {
  width: number;
  height: number;
  /** Accessible description, also used as the PDF caption. */
  label: string;
  shapes: SectionShape[];
}

/** SVG path data for a closed polygon: "M x y L x y ... Z". */
export function polygonPath(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ") + " Z";
}

export function wallSection(r: Pick<DesignResult, "inputs" | "base">): WallSection {
  const H = r.inputs.heightFt;
  const B = r.base.check.baseWidth;
  const embed = Math.max(0.5, H * 0.1); // buried base course

  // Drawing area in feet, mapped to a 360x260 area.
  const padW = B + 1;
  const wFt = padW + 4; // wall + backfill width
  const hFt = H + embed + 1.5;
  const VW = 360;
  const VH = 260; // height of the area the wall is fitted into
  // Extra room under it for the base-width dimension. Its label sits 14 to 26 units
  // below the pad, which is outside a 260 box: the label was clipped in the first
  // version of this diagram.
  const LABEL_ROOM = 24;
  const BOX_H = VH + LABEL_ROOM;
  const m = 28;
  const sx = (VW - 2 * m) / wFt;
  const sy = (VH - 2 * m) / hFt;
  const s = Math.min(sx, sy);
  const ox = m;
  const oy = VH - m;
  const X = (ft: number) => ox + ft * s;
  const Y = (ft: number) => oy - ft * s;

  const wallX = X(1.5);
  const wallTopW = Math.max(6, 0.8 * s); // visual stem thickness at top
  const baseY = Y(0);
  const groundY = Y(embed);
  const drainW = Math.max(5, 0.8 * s);
  const backfillTopRise = r.inputs.slopeDeg > 0 ? (wFt - 1.5) * Math.tan((r.inputs.slopeDeg * Math.PI) / 180) : 0;

  const shapes: SectionShape[] = [
    { kind: "rect", x: 0, y: 0, width: VW, height: BOX_H, fill: "#f7f5f0" },
    // Retained soil (behind wall)
    {
      kind: "polygon",
      points: [[wallX, Y(H)], [X(wFt), Y(H + backfillTopRise)], [X(wFt), baseY], [wallX, baseY]],
      fill: "#d6cdbf",
    },
    // Foundation soil
    { kind: "rect", x: 0, y: groundY, width: VW, height: oy - groundY + 2, fill: "#cbb89c", opacity: 0.6 },
    // Drain rock column behind wall
    { kind: "rect", x: wallX, y: Y(H), width: drainW, height: Y(0) - Y(H), fill: "#9a9284", opacity: 0.7 },
    // Leveling pad
    { kind: "rect", x: X(1), y: baseY, width: (B + 0.5) * s, height: Math.max(4, 0.4 * s), fill: "#6b6456" },
    // Wall mass (battered trapezoid)
    {
      kind: "polygon",
      points: [[wallX, baseY], [wallX + B * s, baseY], [wallX + wallTopW * 1.2, Y(H)], [wallX, Y(H)]],
      fill: "#57534a",
    },
    // Perforated drain pipe
    { kind: "circle", cx: wallX + drainW + 5, cy: Y(0.4), r: 4, fill: "#0f172a" },
    // Ground line
    { kind: "line", x1: 0, y1: groundY, x2: X(1.5), y2: groundY, stroke: "#78716c", strokeWidth: 1.5 },
    // Height dimension
    { kind: "line", x1: X(0.6), y1: Y(0), x2: X(0.6), y2: Y(H), stroke: "#234835", strokeWidth: 1 },
    { kind: "text", x: X(0.6) - 4, y: Y(H / 2), text: `${H}′ H`, fontSize: 11, fill: "#234835", anchor: "end" },
    // Base dimension
    { kind: "line", x1: wallX, y1: Y(-0.2) + 14, x2: wallX + B * s, y2: Y(-0.2) + 14, stroke: "#234835", strokeWidth: 1 },
    { kind: "text", x: wallX + (B * s) / 2, y: Y(-0.2) + 26, text: `${B}′ base`, fontSize: 11, fill: "#234835", anchor: "middle" },
  ];

  return { width: VW, height: BOX_H, label: `Cross-section: ${H} ft wall on a ${B} ft base`, shapes };
}
