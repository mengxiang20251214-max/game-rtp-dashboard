import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // 背景层
        bg: {
          primary:   "#04060c",
          secondary: "#070b14",
          card:      "#0d1320", // 搭配 /66 使用 → 玻璃效果
        },
        // 主色 — 青色 Aurora（唯一品牌色）
        aurora: {
          DEFAULT: "#3d8cff",
          dark:    "#2563eb",
          light:   "#6ba6ff",
        },
        // 焦点色 — 金色（全页最多一处，HOT 卡专用）
        gold: {
          DEFAULT: "#f2c14e",
          light:   "#f8e3a3",
          dark:    "#c8982f",
        },
        // 文字阶梯
        content: {
          emphasis:  "#eef1f8",
          primary:   "#d3dae9",
          secondary: "#8b96b4",
          weak:      "#5d6b91",
        },
        // 进度条底轨
        track: "#152036",
        // 边框辅助（配合 /14 /55 透明度修饰符）
        border: {
          subtle: "#aeb8d0",
          aurora: "#3d8cff",
        },
        // 兼容旧 admin 引用的 neon token（保持不删，避免 admin 样式损坏）
        neon: {
          blue:   "#3d8cff",
          purple: "#8b5cf6",
          pink:   "#ec4899",
          gold:   "#f2c14e",
          orange: "#f97316",
          green:  "#22c55e",
          teal:   "#3d8cff",
        },
        rtp: {
          success: "#22c55e",
          warning: "#f59e0b",
          danger:  "#ef4444",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)",       "Sora",            "system-ui", "sans-serif"],
        sans:    ["var(--font-inter)",      "Inter",           "system-ui", "sans-serif"],
        serif:   ["var(--font-playfair)",   "Playfair Display","Georgia",   "serif"],
        mono:    ["var(--font-space-mono)", "Space Mono",      "monospace"],
      },
      boxShadow: {
        card:         "0 24px 60px rgba(0,0,0,0.50)",
        "card-hover": "0 0 50px rgba(61,140,255,0.40), 0 30px 70px rgba(0,0,0,0.60)",
        "card-gold":  "0 0 50px rgba(242,193,78,0.35), 0 30px 70px rgba(0,0,0,0.60)",
        aurora:       "0 0 12px rgba(61,140,255,0.45)",
        "aurora-sm":  "0 0 8px  rgba(61,140,255,0.35)",
        gold:         "0 0 12px rgba(242,193,78,0.42)",
        // 保持 admin 兼容
        "neon-blue":   "0 0 5px #3d8cff, 0 0 20px rgba(61,140,255,0.35)",
        "neon-gold":   "0 0 8px #f2c14e, 0 0 24px rgba(242,193,78,0.40)",
        "neon-green":  "0 0 8px #22c55e, 0 0 20px rgba(34,197,94,0.35)",
        "neon-purple": "0 0 5px #8b5cf6, 0 0 20px rgba(139,92,246,0.35)",
        "neon-teal":   "0 0 8px #3d8cff, 0 0 20px rgba(61,140,255,0.40)",
      },
      backgroundImage: {
        "aurora-line":
          "linear-gradient(90deg, transparent, rgba(61,140,255,0.70), transparent)",
        "gold-line":
          "linear-gradient(90deg, transparent, rgba(242,193,78,0.70), transparent)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-5px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.55" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        float:        "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        shimmer:      "shimmer 2s infinite",
        fadeIn:       "fadeIn 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
