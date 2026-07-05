import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share card. Satori requires display:flex on every multi-child div.
export default function TwitterImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f7f5f0", padding: "72px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", width: 62, height: 12, background: "#356a4f", borderRadius: 3 }} />
            <div style={{ display: "flex", width: 54, height: 12, background: "#2a5741", borderRadius: 3, marginLeft: 4 }} />
            <div style={{ display: "flex", width: 46, height: 12, background: "#234835", borderRadius: 3, marginLeft: 8 }} />
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#1c1913" }}>
            Slope<span style={{ color: "#234835" }}>ify</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 50, fontSize: 62, fontWeight: 800, color: "#1c1913", lineHeight: 1.08, maxWidth: 980 }}>
          Design a retaining wall that stands up.
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 29, color: "#57503f", maxWidth: 1000 }}>
          Base width, factors of safety, geogrid, materials and cost, built on IBC Tables 1610.1 and 1806.2.
        </div>
        <div style={{ display: "flex", marginTop: "auto", gap: 14 }}>
          <div style={{ display: "flex", background: "#d6e6da", color: "#1d3a2c", padding: "12px 22px", borderRadius: 999, fontSize: 25, fontWeight: 600 }}>Base width</div>
          <div style={{ display: "flex", background: "#eeeae1", color: "#423c2f", padding: "12px 22px", borderRadius: 999, fontSize: 25, fontWeight: 600 }}>Factors of safety</div>
          <div style={{ display: "flex", background: "#f4ddc9", color: "#6a3a20", padding: "12px 22px", borderRadius: 999, fontSize: 25, fontWeight: 600 }}>Cost and permit</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
