// Scale cross-section of the designed wall: stem, buried base course, leveling
// pad, sloped backfill, drain rock + pipe. Pure SVG, driven by the engine result
// so the picture always matches the numbers. The geometry lives in
// lib/wall-section.ts so the paid PDF draws exactly the same picture.
import type { DesignResult } from "@/lib/design";
import { polygonPath, wallSection } from "@/lib/wall-section";

export default function WallDiagram({ r }: { r: DesignResult }) {
  const section = wallSection(r);

  return (
    <svg viewBox={`0 0 ${section.width} ${section.height}`} className="h-auto w-full" role="img" aria-label={section.label}>
      {section.shapes.map((shape, i) => {
        switch (shape.kind) {
          case "rect":
            return <rect key={i} x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={shape.fill} opacity={shape.opacity} />;
          case "polygon":
            return <path key={i} d={polygonPath(shape.points)} fill={shape.fill} />;
          case "circle":
            return <circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.fill} />;
          case "line":
            return <line key={i} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke={shape.stroke} strokeWidth={shape.strokeWidth} />;
          case "text":
            return <text key={i} x={shape.x} y={shape.y} fill={shape.fill} fontSize={shape.fontSize} textAnchor={shape.anchor}>{shape.text}</text>;
        }
      })}
    </svg>
  );
}
