"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface HeaderProps {
  onRefresh?: () => void;
  refreshing?: boolean;
  lastUpdated?: string;
  siteTitle: string;
  siteDescription: string;
  logo?: string;
}

export default function Header({
  onRefresh,
  refreshing,
  lastUpdated,
}: HeaderProps) {
  const t = useTranslations("header");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-bg-primary/80 backdrop-blur-[16px]">
      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6">

        {/* 刷新按钮 — 绝对定位右侧，不影响居中 */}
        {(onRefresh || lastUpdated) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:right-6">
            {lastUpdated && (
              <span className="hidden text-[10px] tracking-wide text-content-secondary sm:inline">
                {t("lastUpdated", { time: lastUpdated })}
              </span>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-content-secondary transition-all hover:border-neon-blue/40 hover:text-neon-blue disabled:opacity-60"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={refreshing ? "animate-spin" : ""}
                >
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                  <path d="M21 3v6h-6" />
                </svg>
                <span className="hidden sm:inline">
                  {refreshing ? t("refreshing") : t("refresh")}
                </span>
              </button>
            )}
          </div>
        )}

        {/* 居中内容 */}
        <div className="flex flex-col items-center gap-1">

          {/* X168 Logo — Playfair Display 衬线，青色渐变 + 发光 */}
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="font-serif text-3xl font-bold leading-none sm:text-4xl"
            style={{
              background: "linear-gradient(135deg, #00f0ff 0%, #38bdf8 50%, #00f0ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 8px rgba(0,240,255,0.55))",
              letterSpacing: "0.04em",
            }}
          >
            X168
          </motion.h1>

          {/* 描述行 — Space Mono，全大写，高字距 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="font-mono text-[10px] uppercase text-content-secondary"
            style={{ letterSpacing: "0.20em" }}
          >
            AI · ANALISIS · PERMAINAN · SLOT
          </motion.p>

          {/* 版本号 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="font-mono text-[9px] uppercase text-content-secondary/50"
            style={{ letterSpacing: "0.18em" }}
          >
            VER 1.0.0
          </motion.p>
        </div>
      </div>
    </header>
  );
}
