import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share card. Satori requires display:flex on every multi-child div.
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f8fafc", padding: "70px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "#047857", color: "#fff", fontSize: 40, fontWeight: 700, borderRadius: 14 }}>
            R
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#0f172a" }}>
            RetainCalc<span style={{ color: "#047857" }}>HQ</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 56, fontSize: 64, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
          Free Retaining Wall Calculator
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 30, color: "#475569", maxWidth: 1000 }}>
          Base width, factors of safety, geogrid, materials, cost &amp; permit — built on IBC Tables 1610.1 &amp; 1806.2.
        </div>
        <div style={{ display: "flex", marginTop: "auto", gap: 16 }}>
          <div style={{ display: "flex", background: "#d1fae5", color: "#065f46", padding: "12px 22px", borderRadius: 999, fontSize: 26, fontWeight: 600 }}>Base width</div>
          <div style={{ display: "flex", background: "#dbeafe", color: "#1e40af", padding: "12px 22px", borderRadius: 999, fontSize: 26, fontWeight: 600 }}>Factors of safety</div>
          <div style={{ display: "flex", background: "#fef3c7", color: "#92400e", padding: "12px 22px", borderRadius: 999, fontSize: 26, fontWeight: 600 }}>Cost &amp; permit</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
