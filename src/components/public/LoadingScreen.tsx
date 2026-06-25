"use client";

import { useLoading } from "@/hooks/useLoading";

// 白色光点（天空光粒子）
const SPARKLES = [
  { top: "6%",  left: "12%", r: 1.5, d: 0,   o: 0.55 },
  { top: "10%", left: "70%", r: 2,   d: 400,  o: 0.45 },
  { top: "18%", left: "32%", r: 1,   d: 200,  o: 0.60 },
  { top: "14%", left: "85%", r: 1.5, d: 600,  o: 0.40 },
  { top: "30%", left: "5%",  r: 1,   d: 100,  o: 0.50 },
  { top: "40%", left: "92%", r: 2,   d: 700,  o: 0.55 },
  { top: "52%", left: "8%",  r: 1.5, d: 300,  o: 0.45 },
  { top: "65%", left: "80%", r: 1,   d: 500,  o: 0.50 },
  { top: "76%", left: "23%", r: 1,   d: 800,  o: 0.35 },
  { top: "86%", left: "63%", r: 1.5, d: 250,  o: 0.40 },
  { top: "4%",  left: "47%", r: 1,   d: 900,  o: 0.50 },
  { top: "24%", left: "56%", r: 2,   d: 150,  o: 0.45 },
];

export default function LoadingScreen() {
  const { progress } = useLoading();

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: [
          "radial-gradient(circle at 50% -8%, rgba(77,171,233,0.14), transparent 55%)",
          "radial-gradient(150% 120% at 50% -10%, #0c1726 0%, #070b14 46%, #04060c 100%)",
        ].join(", "),
      }}
    >
      {/* 光粒子层 */}
      <div className="pointer-events-none absolute inset-0">
        {/* 顶部电光晕 */}
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full"
          style={{
            width: "500px",
            height: "260px",
            background: "radial-gradient(ellipse, rgba(77,171,233,0.22) 0%, transparent 70%)",
            filter: "blur(24px)",
          }}
        />
        {/* 白色光粒（模拟天空微光） */}
        {SPARKLES.map((s, i) => (
          <div
            key={i}
            className="absolute animate-pulse-glow rounded-full"
            style={{
              top: s.top,
              left: s.left,
              width:  `${s.r}px`,
              height: `${s.r}px`,
              background: `rgba(255,255,255,${s.o})`,
              animationDelay: `${s.d}ms`,
              animationDuration: `${2.2 + (i % 3) * 0.7}s`,
            }}
          />
        ))}
      </div>

      {/* ── Logo 区 ── */}
      <div className="animate-float relative mb-12 flex items-center gap-4">
        {/* 电光蓝渐变方块 */}
        <div
          className="flex shrink-0 items-center justify-center rounded-[14px]"
          style={{
            width: "64px",
            height: "64px",
            background: "linear-gradient(150deg, #4DABE9 0%, #176b96 100%)",
            boxShadow: "0 0 30px rgba(77,171,233,0.55), inset 0 1px 0 rgba(255,255,255,0.24)",
          }}
        >
          <span
            className="font-serif text-3xl font-bold leading-none"
            style={{ color: "#eef1f8", letterSpacing: "-0.01em" }}
          >
            X
          </span>
        </div>
        {/* 品牌文字 */}
        <div className="flex flex-col gap-0.5">
          <h1
            className="font-serif font-bold leading-none"
            style={{ fontSize: "42px", letterSpacing: "-0.01em", color: "#eef1f8" }}
          >
            X<span style={{ color: "#4DABE9" }}>168</span>
          </h1>
          <p
            className="font-mono uppercase"
            style={{ fontSize: "10px", letterSpacing: "0.22em", color: "rgba(238,241,248,0.65)" }}
          >
            RTP LIVE
          </p>
        </div>
      </div>

      {/* ── 进度条 ── */}
      <div className="w-72 space-y-3">
        {/* 白色半透明底轨（天空背景上比深色底轨更自然） */}
        <div
          className="h-[5px] w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-150 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #176b96, #4DABE9, #8fd4ff)",
              boxShadow: "0 0 12px rgba(77,171,233,0.70)",
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[11px]"
            style={{ color: "rgba(238,241,248,0.65)", letterSpacing: "0.06em" }}
          >
            Memuat sumber daya.
          </span>
          <span
            className="font-mono tabular-nums text-[11px]"
            style={{ color: "#4DABE9" }}
          >
            {progress}%
          </span>
        </div>
      </div>

      {/* 脉冲点 */}
      <div className="mt-10 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-pulse-glow rounded-full"
            style={{
              width: "6px",
              height: "6px",
              background: "rgba(77,171,233,0.70)",
              animationDelay: `${i * 220}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
