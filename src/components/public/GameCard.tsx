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
  BLUR_DATA_URL,
  getUserStatus,
  getHotBadge,
  getHighRtpBadge,
} from "@/lib/game-utils";
import RTPProgress from "./RTPProgress";
import StatBadge from "./StatBadge";

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function GameCard({ game }: { game: Game }) {
  const [imgError, setImgError] = useState(false);
  const tStats = useTranslations("stats");
  const tCommon = useTranslations("common");
  const color = rtpColor(game.status);
  const userStatus = getUserStatus(game.rtp, game.targetRtp);
  const hotBadge = getHotBadge(game.playerCount);
  const highRtpBadge = getHighRtpBadge(game.rtp);
  const hasLink = Boolean(game.detailUrl);

  return (
    <motion.article
      variants={cardVariants}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="card-glow group flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-sky-100 bg-white shadow-card"
    >
      {/* ── 图片区：游戏图片作为主视觉 ── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {game.image && !imgError ? (
          <Image
            src={game.image}
            alt={game.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 50vw, 640px"
            quality={90}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            loading="lazy"
            unoptimized={game.image.startsWith("data:") || game.image.includes("picsum.photos")}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center"
            style={{ background: "linear-gradient(135deg, #bde0f7 0%, #93c5fd 100%)" }}>
            <span className="font-display text-3xl sm:text-5xl text-white/40">X168</span>
          </div>
        )}

        {/* 底部渐变遮罩（让叠字可读） */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* ── 顶部徽章 ── */}
        <div className="absolute left-1.5 top-1.5 flex flex-col gap-1 sm:left-2.5 sm:top-2.5">
          {hotBadge && (
            <span className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase sm:px-2 sm:text-[10px]"
              style={{ background: "linear-gradient(135deg,#f97316,#dc2626)", color: "#fff" }}>
              {hotBadge.icon} <span className="hidden sm:inline">{hotBadge.label}</span>
            </span>
          )}
          {highRtpBadge && (
            <span className="flex items-center gap-0.5 rounded-full bg-neon-gold px-1.5 py-0.5 text-[9px] font-bold uppercase text-black sm:px-2 sm:text-[10px]">
              {highRtpBadge.icon} <span className="hidden sm:inline">{highRtpBadge.label}</span>
            </span>
          )}
        </div>

        {/* 状态徽章 — 右上 */}
        <span className={`absolute right-1.5 top-1.5 sm:right-2.5 sm:top-2.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:px-2 sm:text-[10px] ${userStatus.bg} ${userStatus.color}`}>
          <span>{userStatus.icon}</span>
          <span className="hidden sm:inline">{userStatus.label}</span>
        </span>

        {/* 分类标签 — 右下小角 */}
        <span className="absolute bottom-10 right-2 rounded-full bg-black/50 px-1.5 py-0.5 font-display text-[8px] uppercase tracking-wide text-white/70 ring-1 ring-white/20 sm:bottom-12 sm:px-2 sm:text-[9px]">
          {game.categoryLabel || game.category}
        </span>

        {/* ── 底部叠字：游戏名 + RTP ── */}
        <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 sm:px-3 sm:pb-3">
          <div className="flex items-end justify-between gap-2">
            <h3 className="game-title-shadow line-clamp-2 font-display text-sm font-bold leading-tight text-white sm:text-lg">
              {game.name}
            </h3>
            <div className="shrink-0 text-right">
              <div className="game-title-shadow font-display text-base font-black sm:text-xl"
                style={{ color, textShadow: `0 0 12px ${color}99` }}>
                {formatRtp(game.rtp)}
              </div>
              <div className="text-[8px] text-white/50 sm:text-[9px]">RTP</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 数据区 ── */}
      <div className="flex flex-col gap-2 px-2.5 pb-2.5 pt-2 sm:gap-3 sm:px-4 sm:pb-4 sm:pt-3">

        {/* RTP 进度条 */}
        <RTPProgress rtp={game.rtp} targetRtp={game.targetRtp} status={game.status} />

        {/* 统计 — 手机2格，桌面4格 */}
        <div className="grid grid-cols-2 gap-1.5 sm:hidden">
          <StatBadge label={tStats("players")} value={formatPlayers(game.playerCount)} accent="pink" compact />
          <StatBadge label={tStats("totalBets")} value={formatNumber(game.totalBets)} compact />
        </div>
        <div className="hidden grid-cols-2 gap-2 sm:grid">
          <StatBadge label={tStats("currentRtp")} value={formatRtp(game.rtp)} accent="blue" />
          <StatBadge label={tStats("targetRtp")} value={formatRtp(game.targetRtp)} accent="purple" />
          <StatBadge label={tStats("players")} value={formatPlayers(game.playerCount)} accent="pink" />
          <StatBadge label={tStats("totalBets")} value={formatNumber(game.totalBets)} />
        </div>

        {/* 按钮 */}
        {hasLink ? (
          <a
            href={game.detailUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg py-1.5 text-center font-display text-[10px] font-bold uppercase tracking-wide text-white transition-all sm:py-2.5 sm:text-sm sm:tracking-wider"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              boxShadow: "0 2px 12px rgba(245,158,11,0.4)",
            }}
          >
            {tCommon("viewDetails")}
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 py-1.5 font-display text-[10px] font-bold uppercase tracking-wide text-gray-400 sm:py-2.5 sm:text-sm"
          >
            {tCommon("viewDetails")}
          </button>
        )}
      </div>
    </motion.article>
  );
}
