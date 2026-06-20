import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0e17",
          secondary: "#111827",
          card: "#1a2332",
        },
        neon: {
          blue: "#00f0ff",
          purple: "#8b5cf6",
          pink: "#ec4899",
        },
        rtp: {
          success: "#22c55e",
          warning: "#f59e0b",
          danger: "#ef4444",
        },
        content: {
          primary: "#e2e8f0",
          secondary: "#94a3b8",
        },
        "border-glow": "#00f0ff",
      },
      fontFamily: {
        display: ["var(--font-orbitron)", "Orbitron", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "neon-blue": "0 0 5px #00f0ff, 0 0 20px rgba(0, 240, 255, 0.35)",
        "neon-purple": "0 0 5px #8b5cf6, 0 0 20px rgba(139, 92, 246, 0.35)",
        "neon-pink": "0 0 5px #ec4899, 0 0 20px rgba(236, 72, 153, 0.35)",
        card: "0 8px 30px rgba(0, 0, 0, 0.5)",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 50% 0%, rgba(0,240,255,0.08), transparent 60%)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
