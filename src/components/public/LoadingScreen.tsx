"use client";

import { useLoading } from "@/hooks/useLoading";

export default function LoadingScreen() {
  const { progress } = useLoading();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary">
      {/* Logo / 品牌 */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <h1
          className="font-serif text-5xl font-bold leading-none"
          style={{
            background: "linear-gradient(135deg, #00f0ff 0%, #38bdf8 50%, #00f0ff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 10px rgba(0,240,255,0.6))",
            letterSpacing: "0.04em",
          }}
        >
          X168
        </h1>
        <p
          className="font-mono text-[11px] uppercase text-content-secondary"
          style={{ letterSpacing: "0.22em" }}
        >
          RTP LIVE
        </p>
      </div>

      {/* 进度条容器 */}
      <div className="w-64 space-y-3">
        {/* 轨道 */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-neon-blue transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 百分比 */}
        <div className="flex items-center justify-between text-xs text-content-secondary">
          <span>Memuat data…</span>
          <span className="tabular-nums text-neon-blue">{progress}%</span>
        </div>
      </div>

      {/* 底部脉冲点 */}
      <div className="mt-12 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-blue/60"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
