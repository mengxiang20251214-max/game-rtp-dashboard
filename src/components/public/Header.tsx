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
  siteTitle,
  siteDescription,
  logo,
}: HeaderProps) {
  const t = useTranslations("header");

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-bg-primary/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        {/* Logo + 标题 + 描述（后台「站点设置」可编辑） */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neon-blue/50 bg-neon-blue/10 shadow-neon-blue"
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={siteTitle} className="h-full w-full object-contain" />
            ) : (
              <span className="font-display text-lg font-bold text-neon-blue">R</span>
            )}
          </motion.div>
          <div className="leading-tight">
            <h1 className="font-display text-lg font-bold text-content-primary text-glow sm:text-xl">
              {siteTitle}
            </h1>
            <p className="text-[11px] text-content-secondary">{siteDescription}</p>
          </div>
        </div>

        {/* 右侧操作 */}
        <div className="flex items-center gap-2 sm:gap-3">
          {lastUpdated && (
            <span className="hidden text-[11px] text-content-secondary sm:inline">
              {t("lastUpdated", { time: lastUpdated })}
            </span>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-content-secondary transition-all hover:border-neon-blue/40 hover:text-neon-blue disabled:opacity-60"
            >
              <svg
                width="14"
                height="14"
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
          {/* 前后台分离：前台不再显示任何后台/管理入口 */}
        </div>
      </div>
    </header>
  );
}
