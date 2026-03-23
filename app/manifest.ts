import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MedAssist Pro",
    short_name: "MedAssist",
    description: "Medication adherence platform for patients, caregivers, and ESP32-connected dispensers.",
    start_url: "/login",
    display: "standalone",
    background_color: "#f7fbff",
    theme_color: "#0f172a",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
