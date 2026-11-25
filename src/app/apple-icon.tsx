import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "22%",
          background: "#0b1120",
          fontSize: 88,
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        <span style={{ color: "#ffffff" }}>P</span>
        <span style={{ color: "#10b981" }}>A</span>
      </div>
    ),
    size
  );
}
