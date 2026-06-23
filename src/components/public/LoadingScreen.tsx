"use client";

import { useLoading } from "@/hooks/useLoading";

const STARS = [
  { top: "7%",  left: "14%", size: 1.5, delay: 0 },
  { top: "11%", left: "71%", size: 2,   delay: 320 },
  { top: "21%", left: "34%", size: 1,   delay: 160 },
  { top: "17%", left: "87%", size: 1.5, delay: 480 },
  { top: "34%", left: "5%",  size: 1,   delay: 100 },
  { top: "44%", left: "93%", size: 2,   delay: 560 },
  { top: "58%", left: "9%",  size: 1.5, delay: 240 },
  { top: "70%", left: "82%", size: 1,   delay: 400 },
  { top: "83%", left: "24%", size: 1,   delay: 640 },
  { top: "89%", left: "64%", size: 1.5, delay: 200 },
  { top: "5%",  left: "48%", size: 1,   delay: 720 },
  { top: "28%", left: "58%", size: 2,   delay: 80  },
];

export default function LoadingScreen() {
  const { progress } = useLoading();

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(175deg, #040b16 0%, #071220 35%, #0b1b35 70%, #0d1f3a 100%)",
      }}
    >
      {/* 星空 & 光晕 */}
      <div className="pointer-events-none absolute inset-0">
        {/* 主蓝色水晶光晕 */}
        <div
          className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(56,189,248,0.22) 0%, rgba(14,165,233,0.10) 40%, transparent 70%)",
            filter: "blur(36px)",
          }}
        />
        {/* 紫色辅助晕 */}
        <div
          className="absolute right-1/4 top-1/4 h-52 w-52 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(129,140,248,0.18) 0%, transparent 70%)",
            filter: "blur(28px)",
          }}
        />
        {/* 底部青绿辉 */}
        <div
          className="absolute bottom-1/4 left-1/4 h-36 w-36 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(52,211,153,0.14) 0%, transparent 70%)",
            filter: "blur(22px)",
          }}
        />
        {/* 星点 */}
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute animate-pulse rounded-full"
            style={{
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              background: `rgba(186,230,253,${0.4 + (i % 4) * 0.1})`,
              animationDelay: `${s.delay}ms`,
              animationDuration: `${2 + (i % 3) * 0.7}s`,
            }}
          />
        ))}
      </div>

      {/* X168 Logo */}
      <div className="relative mb-10 flex flex-col items-center gap-2">
        <h1
          className="font-serif text-6xl font-bold leading-none"
          style={{
            background: "linear-gradient(135deg, #fde68a 0%, #f59e0b 50%, #d97706 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 18px rgba(245,158,11,0.65))",
            letterSpacing: "0.04em",
          }}
        >
          X168
        </h1>
        <p
          className="font-mono text-[11px] uppercase"
          style={{ letterSpacing: "0.24em", color: "rgba(125,211,252,0.80)" }}
        >
          RTP LIVE
        </p>
      </div>

      {/* 进度条 */}
      <div className="w-64 space-y-3">
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-150 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #0284c7, #38bdf8, #7dd3fc)",
              boxShadow:
                "0 0 10px rgba(56,189,248,0.80), 0 0 24px rgba(14,165,233,0.50)",
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: "rgba(186,230,253,0.65)" }}>
            Memuat sumber daya.
          </span>
          <span
            className="font-mono tabular-nums"
            style={{ color: "#38bdf8" }}
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
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{
              background: "rgba(56,189,248,0.70)",
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
