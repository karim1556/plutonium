import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 170,
          fontWeight: 700,
          letterSpacing: "-0.08em"
        }}
      >
        <div
          style={{
            display: "flex",
            height: 360,
            width: 360,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 120,
            background: "rgba(255,255,255,0.16)",
            boxShadow: "0 30px 80px rgba(15, 23, 42, 0.28)"
          }}
        >
          M+
        </div>
      </div>
    ),
    size
  );
}
