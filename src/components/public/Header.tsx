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
    <header className="border-b border-border-subtle/14">
      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6">

        {/* 刷新按钮 — 右侧绝对定位 */}
        {(onRefresh || lastUpdated) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:right-6">
            {lastUpdated && (
              <span
                className="hidden font-mono text-[10px] sm:inline"
                style={{ color: "#5d6b91", letterSpacing: "0.10em" }}
              >
                {t("lastUpdated", { time: lastUpdated })}
              </span>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-display text-xs font-semibold uppercase transition-all disabled:opacity-50"
                style={{
                  borderColor: "rgba(77,171,233,0.40)",
                  background: "rgba(77,171,233,0.08)",
                  color: "#4dabe9",
                  letterSpacing: "0.10em",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(77,171,233,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(77,171,233,0.08)";
                }}
              >
                <svg
                  width="11" height="11" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
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

        {/* ── 居中 Logo 区 ── */}
        <div className="flex flex-col items-center gap-2">

          {/* Logo 组（方块 + 品牌名），整组 6s 浮动 */}
          <motion.div
            className="animate-float flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* 青色渐变方块 */}
            <div
              className="flex shrink-0 items-center justify-center rounded-[12px]"
              style={{
                width: "42px",
                height: "42px",
                background: "linear-gradient(150deg, #4dabe9 0%, #0f2c6e 100%)",
                boxShadow:
                  "0 0 22px rgba(77,171,233,0.45), inset 0 1px 0 rgba(255,255,255,0.20)",
              }}
            >
              <span
                className="font-serif text-xl font-bold leading-none"
                style={{ color: "#eef1f8" }}
              >
                X
              </span>
            </div>

            {/* 品牌名：X168 */}
            <h1
              className="font-serif font-bold leading-none"
              style={{ fontSize: "32px", letterSpacing: "-0.01em", color: "#eef1f8" }}
            >
              X<span style={{ color: "#4dabe9" }}>168</span>
            </h1>
          </motion.div>

          {/* 副标题行 */}
          <motion.div
            className="flex items-center gap-2 font-mono text-[10px] uppercase"
            style={{ letterSpacing: "0.18em" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.18 }}
          >
            <span style={{ color: "#4dabe9" }}>AI</span>
            <span style={{ color: "#5d6b91" }}>·</span>
            <span style={{ color: "#8b96b4" }}>ANALISIS PERMAINAN SLOT</span>
            <span style={{ color: "#5d6b91" }}>·</span>
            {/* 版本号 — 金色描边胶囊 */}
            <span
              className="rounded-full border px-1.5 py-0.5 text-[9px]"
              style={{
                borderColor: "rgba(242,193,78,0.45)",
                color: "#f2c14e",
              }}
            >
              VER 1.0.0
            </span>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
