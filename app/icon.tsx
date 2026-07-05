import { ImageResponse } from "next/og";

// Favicon: a stacked-block mark on the brand pine, matching the header logo.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          background: "#234835",
          borderRadius: 7,
        }}
      >
        <div style={{ display: "flex", width: 20, height: 4, background: "#7fac8e", borderRadius: 1 }} />
        <div style={{ display: "flex", width: 17, height: 4, background: "#aecdb7", borderRadius: 1 }} />
        <div style={{ display: "flex", width: 14, height: 4, background: "#d6e6da", borderRadius: 1 }} />
      </div>
    ),
    { ...size },
  );
}
