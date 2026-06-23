"use client";

import { useLoading } from "@/hooks/useLoading";

export default function LoadingScreen() {
  const { progress } = useLoading();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary">
      {/* 背景光晕 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-gold/10 blur-2xl" />
      </div>

      {/* Logo */}
      <div className="relative mb-10 flex flex-col items-center gap-2">
        <h1
          className="font-serif text-6xl font-bold leading-none"
          style={{
            background: "linear-gradient(135deg, #fde68a 0%, #f59e0b 45%, #d97706 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 16px rgba(245,158,11,0.7))",
            letterSpacing: "0.04em",
          }}
        >
          X168
        </h1>
        <p
          className="font-mono text-[11px] uppercase text-neon-gold/70"
          style={{ letterSpacing: "0.24em" }}
        >
          RTP LIVE
        </p>
      </div>

      {/* 进度条 */}
      <div className="w-64 space-y-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-150 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #f59e0b, #fde68a, #f59e0b)",
              boxShadow: "0 0 8px rgba(245,158,11,0.6)",
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-content-secondary">Memuat data…</span>
          <span className="font-mono tabular-nums text-neon-gold">{progress}%</span>
        </div>
      </div>

      {/* 脉冲点 */}
      <div className="mt-10 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-gold/60"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
