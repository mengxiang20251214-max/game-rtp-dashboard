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

export default function Header({ onRefresh, refreshing, lastUpdated }: HeaderProps) {
  const t = useTranslations("header");

  return (
    <header className="border-b border-sky-200/60">
      <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6">

        {/* 刷新按钮 — 绝对定位右侧 */}
        {(onRefresh || lastUpdated) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:right-6">
            {lastUpdated && (
              <span className="hidden text-[10px] tracking-wide text-slate-400 sm:inline">
                {t("lastUpdated", { time: lastUpdated })}
              </span>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs text-teal-600 transition-all hover:bg-teal-500/20 hover:shadow-neon-teal disabled:opacity-60"
              >
                <svg
                  width="13" height="13" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
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

          {/* X168 — 金色渐变衬线（浅蓝背景上的金色非常醒目） */}
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="font-serif text-3xl font-bold leading-none sm:text-4xl"
            style={{
              background: "linear-gradient(135deg, #fde68a 0%, #f59e0b 50%, #d97706 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 2px 8px rgba(245,158,11,0.45))",
              letterSpacing: "0.04em",
            }}
          >
            X168
          </motion.h1>

          {/* 描述行 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="font-mono text-[10px] uppercase text-teal-600/70"
            style={{ letterSpacing: "0.20em" }}
          >
            AI · ANALISIS · PERMAINAN · SLOT
          </motion.p>

          {/* 版本号 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="font-mono text-[9px] uppercase text-slate-400"
            style={{ letterSpacing: "0.18em" }}
          >
            VER 1.0.0
          </motion.p>
        </div>
      </div>
    </header>
  );
}
