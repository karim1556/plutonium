import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(160deg, #0f172a 0%, #0b5cab 48%, #14b8a6 100%)",
          color: "white",
          fontSize: 70,
          fontWeight: 700,
          letterSpacing: "-0.08em"
        }}
      >
        <div
          style={{
            display: "flex",
            height: 124,
            width: 124,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 42,
            background: "rgba(255,255,255,0.16)"
          }}
        >
          M+
        </div>
      </div>
    ),
    size
  );
}
