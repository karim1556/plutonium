import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f1720",
        mist: "#f3f5f2",
        clinic: "#d94f3d",
        sage: "#6b8f71",
        ocean: "#0f766e",
        amberglass: "#d08b00"
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(rgba(15, 23, 32, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 32, 0.08) 1px, transparent 1px)"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(15, 23, 32, 0.08)"
      },
      fontFamily: {
        sans: ["Avenir Next", "DM Sans", "Segoe UI", "sans-serif"],
        serif: ["Iowan Old Style", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
