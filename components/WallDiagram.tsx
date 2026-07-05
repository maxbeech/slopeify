// Scale cross-section of the designed wall: stem, buried base course, leveling
// pad, sloped backfill, drain rock + pipe. Pure SVG, driven by the engine result
// so the picture always matches the numbers.
import type { DesignResult } from "@/lib/design";

export default function WallDiagram({ r }: { r: DesignResult }) {
  const H = r.inputs.heightFt;
  const B = r.base.check.baseWidth;
  const embed = Math.max(0.5, H * 0.1); // buried base course

  // Drawing area in feet, mapped to a 360×260 viewBox.
  const padW = B + 1;
  const wFt = padW + 4; // wall + backfill width
  const hFt = H + embed + 1.5;
  const VW = 360;
  const VH = 260;
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

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full" role="img"
      aria-label={`Cross-section: ${H} ft wall on a ${B} ft base`}>
      <rect x="0" y="0" width={VW} height={VH} fill="#f7f5f0" />
      {/* Retained soil (behind wall) */}
      <path
        d={`M ${wallX} ${Y(H)} L ${X(wFt)} ${Y(H + (r.inputs.slopeDeg > 0 ? (wFt - 1.5) * Math.tan((r.inputs.slopeDeg * Math.PI) / 180) : 0))} L ${X(wFt)} ${baseY} L ${wallX} ${baseY} Z`}
        fill="#d6cdbf"
      />
      {/* Foundation soil */}
      <rect x="0" y={groundY} width={VW} height={oy - groundY + 2} fill="#cbb89c" opacity="0.6" />
      {/* Drain rock column behind wall */}
      <rect x={wallX} y={Y(H)} width={Math.max(5, 0.8 * s)} height={Y(0) - Y(H)} fill="#9a9284" opacity="0.7" />
      {/* Leveling pad */}
      <rect x={X(1)} y={baseY} width={(B + 0.5) * s} height={Math.max(4, 0.4 * s)} fill="#6b6456" />
      {/* Wall mass (battered trapezoid) */}
      <path
        d={`M ${wallX} ${baseY} L ${wallX + B * s} ${baseY} L ${wallX + wallTopW * 1.2} ${Y(H)} L ${wallX} ${Y(H)} Z`}
        fill="#57534a"
      />
      {/* Perforated drain pipe */}
      <circle cx={wallX + Math.max(5, 0.8 * s) + 5} cy={Y(0.4)} r="4" fill="#0f172a" />
      {/* Ground line */}
      <line x1="0" y1={groundY} x2={X(1.5)} y2={groundY} stroke="#78716c" strokeWidth="1.5" />

      {/* Height dimension */}
      <line x1={X(0.6)} y1={Y(0)} x2={X(0.6)} y2={Y(H)} stroke="#234835" strokeWidth="1" />
      <text x={X(0.6) - 4} y={Y(H / 2)} fill="#234835" fontSize="11" textAnchor="end">{H}′ H</text>
      {/* Base dimension */}
      <line x1={wallX} y1={Y(-0.2) + 14} x2={wallX + B * s} y2={Y(-0.2) + 14} stroke="#234835" strokeWidth="1" />
      <text x={wallX + (B * s) / 2} y={Y(-0.2) + 26} fill="#234835" fontSize="11" textAnchor="middle">{B}′ base</text>
    </svg>
  );
}
