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
      whileHover={{ y: -6 }}
      className="card-glow group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-card/80 backdrop-blur-sm"
    >
      {/* 图片区 — 4:3 比例自适应，宽屏/窄屏等比缩放 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-secondary">
        {game.image && !imgError ? (
          <Image
            src={game.image}
            alt={game.name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
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
            <span className="font-display text-4xl text-neon-blue/30">RTP</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />

        {/* 分类标签 */}
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 font-display text-[11px] uppercase tracking-wider text-neon-blue ring-1 ring-neon-blue/40 backdrop-blur">
          {game.categoryLabel || game.category}
        </span>

        {/* 状态徽章 */}
        <span
          className={`absolute right-3 top-3 flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium backdrop-blur ${userStatus.bg} ${userStatus.color}`}
        >
          {userStatus.icon} {userStatus.label}
        </span>

        {/* 排名 */}
        <span className="absolute bottom-3 left-3 font-display text-sm font-bold text-content-secondary">
          #{game.rank}
        </span>
      </div>

      {/* 内容区 */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-bold leading-tight text-content-primary">
            {game.name}
          </h3>
          {/* sparkline */}
          {points && (
            <svg width="80" height="36" viewBox="0 0 120 36" className="shrink-0 opacity-80">
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

        {/* 热门 / 高返还 标识 */}
        {(hotBadge || highRtpBadge) && (
          <div className="flex flex-wrap gap-2">
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

        {/* 4 个统计指标 */}
        <div className="grid grid-cols-2 gap-3">
          <StatBadge label={tStats("currentRtp")} value={formatRtp(game.rtp)} accent="blue" />
          <StatBadge label={tStats("targetRtp")} value={formatRtp(game.targetRtp)} accent="purple" />
          <StatBadge label={tStats("players")} value={formatPlayers(game.playerCount)} accent="pink" />
          <StatBadge label={tStats("totalBets")} value={formatNumber(game.totalBets)} />
        </div>

        {/* 查看详情按钮 — 有链接则跳转，无则置灰 */}
        {hasLink ? (
          <a
            href={game.detailUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto block w-full rounded-lg border border-neon-blue/40 bg-neon-blue/10 py-2.5 text-center font-display text-sm font-semibold uppercase tracking-wider text-neon-blue transition-all hover:bg-neon-blue/25 hover:shadow-neon-blue"
          >
            {tCommon("viewDetails")}
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="mt-auto w-full rounded-lg border border-white/10 bg-white/5 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-content-secondary/40 cursor-not-allowed"
          >
            {tCommon("viewDetails")}
          </button>
        )}
      </div>
    </motion.article>
  );
}
