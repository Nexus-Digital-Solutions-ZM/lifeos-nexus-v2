import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Playfair Display", "serif"],
        mono: ["Space Mono", "monospace"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        base: {
          DEFAULT: "#0D1017",
          50: "#13161D",
          100: "#111318",
          200: "#1A1D24",
          300: "#2A2D35",
          400: "#374151",
          500: "#6B7280",
          600: "#9CA3AF",
          700: "#D1D5DB",
          800: "#F5F0E8",
        },
        gold: {
          DEFAULT: "#C49E52",
          light: "#D1A832",
          dark: "#A07832",
        },
        accent: {
          red: "#FF2D55",
          orange: "#FF6B00",
          amber: "#FFB800",
          green: "#00D084",
          blue: "#1A6BFF",
          teal: "#4ECDC4",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        pulseDot: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
      },
    },
  },
  plugins: [],
};

export default config;
