import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestedSize = request.nextUrl.searchParams.get("size");
  const size = requestedSize === null ? 512 : Number(requestedSize);

  if (size !== 192 && size !== 512) {
    return new Response("Icon size must be 192 or 512.", { status: 400 });
  }

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
          border: "12px solid #10b981",
          borderRadius: "24%",
          background: "linear-gradient(145deg, #0b1120 0%, #06281e 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: size * 0.35,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#ffffff" }}>P</span>
          <span style={{ color: "#10b981" }}>A</span>
        </div>
        <div
          style={{
            marginTop: size * 0.045,
            color: "#34d399",
            fontSize: size * 0.09,
            fontWeight: 700,
            letterSpacing: size * 0.018,
          }}
        >
          KENYA
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
