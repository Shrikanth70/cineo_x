import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0A0A0C",
        surface: {
          DEFAULT: "#121216",
          elevated: "#181820",
          card: "#141419",
          highlight: "#1F1F28",
        },
        amber: {
          accent: "#F5C26B",
          hover: "#E8B255",
          dim: "rgba(245, 194, 107, 0.15)",
          border: "rgba(245, 194, 107, 0.3)",
        },
        cinematic: {
          blue: "#162033",
          teal: "#0D252E",
          glow: "rgba(245, 194, 107, 0.08)",
        },
        border: {
          hairline: "rgba(255, 255, 255, 0.08)",
          subtle: "rgba(255, 255, 255, 0.12)",
          active: "rgba(245, 194, 107, 0.4)",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 8px 32px -8px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)",
        glow: "0 0 40px -10px rgba(245, 194, 107, 0.25)",
        ambient: "0 -20px 60px rgba(13, 37, 46, 0.35)",
      },
      animation: {
        "float-emoji": "floatUp 2.4s ease-out forwards",
        "pulse-subtle": "pulseSubtle 2.5s infinite ease-in-out",
        "spin-slow": "spin 28s linear infinite",
      },
      keyframes: {
        floatUp: {
          "0%": { opacity: "1", transform: "translateY(0) scale(0.8)" },
          "50%": { opacity: "0.9", transform: "translateY(-60px) scale(1.15) rotate(6deg)" },
          "100%": { opacity: "0", transform: "translateY(-130px) scale(1) rotate(-6deg)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

