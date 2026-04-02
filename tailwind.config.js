/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Georgia", "Cambria", "serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#0D0D11",
          secondary: "#111115",
          tertiary: "#17171D",
          raised: "#1C1C24",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          strong: "rgba(255,255,255,0.12)",
        },
        agent: {
          analyst: "#4A9EFF",
          skeptic: "#FF6B6B",
          optimist: "#52D68A",
          researcher: "#FFB347",
        },
        consensus: {
          high: "#52D68A",
          mid: "#FFB347",
          low: "#FF6B6B",
        },
      },
      animation: {
        "slide-in": "slideIn 0.4s cubic-bezier(0.4,0,0.2,1)",
        "pulse-slow": "pulse 1.5s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease",
      },
      keyframes: {
        slideIn: {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
