import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    // getUserStatus/getHotBadge 在此返回 Tailwind 类名，需纳入扫描
    "./src/lib/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0d0b1e",
          secondary: "#160f30",
          card: "#1c1640",
        },
        neon: {
          blue: "#00f0ff",
          purple: "#8b5cf6",
          pink: "#ec4899",
          gold: "#f59e0b",
          orange: "#f97316",
          green: "#22c55e",
        },
        rtp: {
          success: "#22c55e",
          warning: "#f59e0b",
          danger: "#ef4444",
        },
        content: {
          primary: "#f0eeff",
          secondary: "#a89fc0",
        },
        "border-glow": "#f59e0b",
      },
      fontFamily: {
        display: ["var(--font-orbitron)", "Orbitron", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        mono: ["var(--font-space-mono)", "Space Mono", "monospace"],
      },
      boxShadow: {
        "neon-blue": "0 0 5px #00f0ff, 0 0 20px rgba(0, 240, 255, 0.35)",
        "neon-purple": "0 0 5px #8b5cf6, 0 0 20px rgba(139, 92, 246, 0.35)",
        "neon-pink": "0 0 5px #ec4899, 0 0 20px rgba(236, 72, 153, 0.35)",
        "neon-gold": "0 0 8px #f59e0b, 0 0 24px rgba(245, 158, 11, 0.4)",
        "neon-green": "0 0 8px #22c55e, 0 0 20px rgba(34, 197, 94, 0.35)",
        card: "0 8px 30px rgba(0, 0, 0, 0.6)",
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
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        fadeIn: "fadeIn 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
