"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Game } from "@/types";
import {
  rtpColor,
  formatNumber,
  formatPlayers,
  formatRtp,
  sparklinePoints,
  BLUR_DATA_URL,
  getUserStatus,
  getHotBadge,
  getHighRtpBadge,
} from "@/lib/game-utils";
import RTPProgress from "./RTPProgress";
import StatBadge from "./StatBadge";

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function GameCard({ game }: { game: Game }) {
  const [imgError, setImgError] = useState(false);
  const tStats = useTranslations("stats");
  const tCommon = useTranslations("common");
  const color = rtpColor(game.status);
  const points = sparklinePoints(game.trend, 120, 36);
  const userStatus = getUserStatus(game.rtp, game.targetRtp);
  const hotBadge = getHotBadge(game.playerCount);
  const highRtpBadge = getHighRtpBadge(game.rtp);
  const hasLink = Boolean(game.detailUrl);

  return (
    <motion.article
      variants={cardVariants}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="card-glow group flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-bg-card/80 backdrop-blur-sm"
    >
      {/* ── 图片区 ── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-secondary">
        {game.image && !imgError ? (
          <Image
            src={game.image}
            alt={game.name}
            fill
            sizes="(max-width: 640px) 50vw, 50vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            loading="lazy"
            unoptimized={
              game.image.startsWith("data:") || game.image.includes("picsum.photos")
            }
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bg-secondary to-bg-card">
            <span className="font-display text-2xl sm:text-4xl text-neon-blue/30">RTP</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />

        {/* 分类标签 */}
        <span className="absolute left-1.5 top-1.5 sm:left-3 sm:top-3 rounded-full bg-black/60 px-1.5 py-0.5 sm:px-3 sm:py-1 font-display text-[8px] sm:text-[11px] uppercase tracking-wide text-neon-blue ring-1 ring-neon-blue/40 backdrop-blur">
          {game.categoryLabel || game.category}
        </span>

        {/* 状态徽章 — 手机只显示图标，桌面显示完整 */}
        <span
          className={`absolute right-1.5 top-1.5 sm:right-3 sm:top-3 flex items-center gap-0.5 sm:gap-1 rounded-full px-1.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[11px] font-medium backdrop-blur ${userStatus.bg} ${userStatus.color}`}
        >
          <span>{userStatus.icon}</span>
          <span className="hidden sm:inline">{userStatus.label}</span>
        </span>

        {/* 排名 */}
        <span className="absolute bottom-1.5 left-1.5 sm:bottom-3 sm:left-3 font-display text-[10px] sm:text-sm font-bold text-content-secondary">
          #{game.rank}
        </span>
      </div>

      {/* ── 内容区 ── */}
      <div className="flex flex-1 flex-col gap-2 p-2.5 sm:gap-4 sm:p-5">

        {/* 标题 + sparkline（sparkline 手机隐藏） */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-display text-[11px] font-bold leading-snug text-content-primary sm:text-xl">
            {game.name}
          </h3>
          {points && (
            <svg
              width="60"
              height="28"
              viewBox="0 0 120 36"
              className="hidden shrink-0 opacity-80 sm:block"
            >
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 3px ${color})` }}
              />
            </svg>
          )}
        </div>

        {/* 热门 / 高返还 — 手机隐藏 */}
        {(hotBadge || highRtpBadge) && (
          <div className="hidden flex-wrap gap-2 sm:flex">
            {hotBadge && (
              <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-xs text-red-400">
                {hotBadge.icon} {hotBadge.label}
              </span>
            )}
            {highRtpBadge && (
              <span className="rounded-full bg-yellow-500/20 px-2.5 py-1 text-xs text-yellow-400">
                {highRtpBadge.icon} {highRtpBadge.label}
              </span>
            )}
          </div>
        )}

        {/* RTP 进度条 */}
        <RTPProgress rtp={game.rtp} targetRtp={game.targetRtp} status={game.status} />

        {/* 统计指标 — 手机只显示 2 个关键数据（紧凑），桌面显示全部 4 个 */}
        <div className="grid grid-cols-2 gap-1.5 sm:hidden">
          <StatBadge label={tStats("currentRtp")} value={formatRtp(game.rtp)} accent="blue" compact />
          <StatBadge label={tStats("players")} value={formatPlayers(game.playerCount)} accent="pink" compact />
        </div>
        <div className="hidden grid-cols-2 gap-3 sm:grid">
          <StatBadge label={tStats("currentRtp")} value={formatRtp(game.rtp)} accent="blue" />
          <StatBadge label={tStats("targetRtp")} value={formatRtp(game.targetRtp)} accent="purple" />
          <StatBadge label={tStats("players")} value={formatPlayers(game.playerCount)} accent="pink" />
          <StatBadge label={tStats("totalBets")} value={formatNumber(game.totalBets)} />
        </div>

        {/* 查看详情按钮 */}
        {hasLink ? (
          <a
            href={game.detailUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto block w-full rounded-lg border border-neon-blue/40 bg-neon-blue/10 py-1.5 text-center font-display text-[10px] font-semibold uppercase tracking-wide text-neon-blue transition-all hover:bg-neon-blue/25 hover:shadow-neon-blue sm:py-2.5 sm:text-sm sm:tracking-wider"
          >
            {tCommon("viewDetails")}
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="mt-auto w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 py-1.5 font-display text-[10px] font-semibold uppercase tracking-wide text-content-secondary/40 sm:py-2.5 sm:text-sm sm:tracking-wider"
          >
            {tCommon("viewDetails")}
          </button>
        )}
      </div>
    </motion.article>
  );
}
