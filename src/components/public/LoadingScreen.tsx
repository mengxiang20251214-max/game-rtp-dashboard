"use client";

import { useLoading } from "@/hooks/useLoading";

const STARS = [
  { top: "6%",  left: "12%", r: 1.5, d: 0   },
  { top: "10%", left: "68%", r: 2,   d: 400  },
  { top: "19%", left: "31%", r: 1,   d: 200  },
  { top: "15%", left: "84%", r: 1.5, d: 600  },
  { top: "32%", left: "4%",  r: 1,   d: 100  },
  { top: "42%", left: "91%", r: 2,   d: 700  },
  { top: "55%", left: "7%",  r: 1.5, d: 300  },
  { top: "67%", left: "79%", r: 1,   d: 500  },
  { top: "78%", left: "22%", r: 1,   d: 800  },
  { top: "88%", left: "61%", r: 1.5, d: 250  },
  { top: "4%",  left: "46%", r: 1,   d: 900  },
  { top: "26%", left: "55%", r: 2,   d: 150  },
];

export default function LoadingScreen() {
  const { progress } = useLoading();

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(150% 120% at 50% -10%, #0c1726 0%, #070b14 46%, #04060c 100%)",
      }}
    >
      {/* 星空 & 发光晕 */}
      <div className="pointer-events-none absolute inset-0">
        {/* 主青色核心光晕 */}
        <div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "420px",
            height: "420px",
            background:
              "radial-gradient(circle, rgba(77,171,233,0.16) 0%, rgba(39,154,145,0.06) 45%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        {/* 星点 */}
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute animate-pulse-glow rounded-full"
            style={{
              top: s.top,
              left: s.left,
              width:  `${s.r}px`,
              height: `${s.r}px`,
              background: `rgba(77,171,233,${0.35 + (i % 4) * 0.12})`,
              animationDelay: `${s.d}ms`,
              animationDuration: `${2.2 + (i % 3) * 0.6}s`,
            }}
          />
        ))}
      </div>

      {/* ── Logo 区 ── */}
      <div className="animate-float relative mb-12 flex items-center gap-4">
        {/* 青色方块 */}
        <div
          className="flex shrink-0 items-center justify-center rounded-[14px]"
          style={{
            width: "64px",
            height: "64px",
            background: "linear-gradient(150deg, #4dabe9 0%, #0f2c6e 100%)",
            boxShadow: "0 0 28px rgba(77,171,233,0.50), inset 0 1px 0 rgba(255,255,255,0.22)",
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
            X<span style={{ color: "#4dabe9" }}>168</span>
          </h1>
          <p
            className="font-mono uppercase"
            style={{ fontSize: "10px", letterSpacing: "0.22em", color: "#8b96b4" }}
          >
            RTP LIVE
          </p>
        </div>
      </div>

      {/* ── 进度条 ── */}
      <div className="w-72 space-y-3">
        <div
          className="h-[5px] w-full overflow-hidden rounded-full"
          style={{ background: "#152036" }}
        >
          <div
            className="h-full rounded-full transition-all duration-150 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #2563eb, #4dabe9, #7fc9f5)",
              boxShadow: "0 0 12px rgba(77,171,233,0.60)",
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[11px]"
            style={{ color: "#8b96b4", letterSpacing: "0.06em" }}
          >
            Memuat sumber daya.
          </span>
          <span
            className="font-mono tabular-nums text-[11px]"
            style={{ color: "#4dabe9" }}
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
              background: "rgba(77,171,233,0.55)",
              animationDelay: `${i * 220}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
