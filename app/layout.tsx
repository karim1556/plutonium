import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedAssist Pro",
  description: "AI-powered medication adherence system with caregiver workflows and ESP32 dispenser integration.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MedAssist Pro",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#0f172a"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
