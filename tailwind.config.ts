import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // NGen brand palette (Brand Guidelines 2024) — same tokens as ngen-trade-intel
        "ngen-copper": "#E94E10",
        "ngen-indigo": "#003040",
        "ngen-ocean": "#41E8DE",
        "ngen-sun": "#FDBB10",
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
          faint: "var(--ink-faint)",
        },
        border: "var(--border)",
        positive: { DEFAULT: "var(--positive)", muted: "var(--positive-muted)" },
        negative: { DEFAULT: "var(--negative)", muted: "var(--negative-muted)" },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
