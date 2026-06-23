"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Game } from "@/types";
import {
  formatNumber,
  formatPlayers,
  formatRtp,
  BLUR_DATA_URL,
  getHotBadge,
} from "@/lib/game-utils";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// RTP 值 85–102 范围映射 0–100%
const RTP_MIN = 85;
const RTP_MAX = 102;
function rtpPct(v: number) {
  return Math.max(0, Math.min(100, ((v - RTP_MIN) / (RTP_MAX - RTP_MIN)) * 100));
}

interface DataRowProps {
  label: string;
  value: string;
  pct: number;
  isGold?: boolean;
  isWeak?: boolean;
}

function DataRow({ label, value, pct, isGold, isWeak }: DataRowProps) {
  const fillStyle = isWeak
    ? {
        background: "linear-gradient(90deg, #1a4040, #2d6b65)",
        boxShadow: "none",
      }
    : isGold
    ? {
        background: "linear-gradient(90deg, #c8982f, #f2c14e, #f8e3a3)",
        boxShadow: "0 0 10px rgba(242,193,78,0.40)",
      }
    : {
        background: "linear-gradient(90deg, #2563eb, #3d8cff, #6ba6ff)",
        boxShadow: "0 0 10px rgba(61,140,255,0.40)",
      };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span
          className="font-display text-[11px] sm:text-[12px] leading-none"
          style={{ color: "#8b96b4" }}
        >
          {label}
        </span>
        <span
          className="shrink-0 font-mono text-[12px] sm:text-[13px] leading-none tabular-nums"
          style={{ color: isGold ? "#f2c14e" : "#3d8cff" }}
        >
          {value}
        </span>
      </div>
      <div
        className="h-[5px] w-full overflow-hidden rounded-full"
        style={{ background: "#152036" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={fillStyle}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: EASE }}
        />
      </div>
    </div>
  );
}

interface GameCardProps {
  game: Game;
  isFeature?: boolean;
}

export default function GameCard({ game, isFeature = false }: GameCardProps) {
  const [imgError, setImgError] = useState(false);
  const tStats = useTranslations("stats");
  const tCommon = useTranslations("common");
  const hotBadge = getHotBadge(game.playerCount);
  const isGold = isFeature && Boolean(hotBadge);
  const hasLink = Boolean(game.detailUrl);

  return (
    <article
      className={`glass-card ${isGold ? "glass-card--gold" : ""} group flex flex-col overflow-hidden`}
      style={
        isGold
          ? {
              background:
                "linear-gradient(180deg, rgba(242,193,78,0.07) 0%, rgba(13,19,32,0.66) 100%)",
              borderColor: "rgba(242,193,78,0.34)",
            }
          : undefined
      }
    >
      {/* 顶部高光线 */}
      <div
        className="h-[2px] w-full shrink-0"
        style={{
          background: isGold
            ? "linear-gradient(90deg, transparent, rgba(242,193,78,0.75), transparent)"
            : "linear-gradient(90deg, transparent, rgba(61,140,255,0.75), transparent)",
        }}
      />

      <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-[22px]">

        {/* ── 图标 + 标题 ── */}
        <div className="flex gap-3">
          {/* 游戏图标方块 */}
          <div
            className="relative shrink-0 overflow-hidden"
            style={{
              width:  "60px",
              height: "60px",
              borderRadius: "12px",
              boxShadow: isGold
                ? "0 0 18px rgba(242,193,78,0.28)"
                : "0 0 18px rgba(61,140,255,0.24)",
            }}
          >
            {game.image && !imgError ? (
              <Image
                src={game.image}
                alt={game.name}
                fill
                sizes="60px"
                quality={85}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                loading="lazy"
                unoptimized={
                  game.image.startsWith("data:") ||
                  game.image.includes("picsum.photos")
                }
                className="object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: "linear-gradient(135deg, #091428, #0d1f5a)" }}
              >
                <span
                  className="font-mono text-[10px] font-bold"
                  style={{ color: "rgba(61,140,255,0.35)" }}
                >
                  X168
                </span>
              </div>
            )}
          </div>

          {/* 标题区 */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            {/* 分类眉标 */}
            <span
              className="font-mono text-[9px] sm:text-[10px] uppercase"
              style={{ letterSpacing: "0.20em", color: "#3d8cff" }}
            >
              {game.categoryLabel || game.category}
            </span>
            {/* 游戏名 */}
            <h3
              className="line-clamp-2 font-serif text-[13px] sm:text-[15px] font-bold leading-tight"
              style={
                isGold
                  ? {
                      background:
                        "linear-gradient(135deg, #f8e3a3, #f2c14e, #c8982f)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }
                  : { color: "#eef1f8" }
              }
            >
              {game.name}
            </h3>
            {/* HOT 徽章（仅黄金卡） */}
            {isGold && (
              <span
                className="inline-flex items-center self-start gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
                style={{
                  background:
                    "linear-gradient(135deg, #f8e3a3, #f2c14e, #c8982f)",
                  color: "#1a0c00",
                  letterSpacing: "0.12em",
                }}
              >
                ★ HOT
              </span>
            )}
          </div>
        </div>

        {/* ── 4 条数据行 ── */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <DataRow
            label={tStats("currentRtp")}
            value={formatRtp(game.rtp)}
            pct={rtpPct(game.rtp)}
            isGold={isGold}
          />
          <DataRow
            label={tStats("targetRtp")}
            value={formatRtp(game.targetRtp)}
            pct={rtpPct(game.targetRtp)}
            isGold={isGold}
          />
          <DataRow
            label={tStats("players")}
            value={formatPlayers(game.playerCount)}
            pct={Math.min(100, (game.playerCount / 20000) * 100)}
            isGold={isGold}
            isWeak={game.playerCount < 50}
          />
          <DataRow
            label={tStats("totalBets")}
            value={formatNumber(game.totalBets)}
            pct={Math.min(100, (game.totalBets / 500000) * 100)}
            isGold={isGold}
            isWeak={game.totalBets < 5000}
          />
        </div>

        {/* ── CTA 按钮 ── */}
        {hasLink ? (
          <a
            href={game.detailUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full py-2 font-display text-[11px] sm:text-[12px] font-bold uppercase transition-all active:scale-[0.97]"
            style={{
              background: isGold
                ? "linear-gradient(90deg, #c8982f, #f2c14e, #f8e3a3)"
                : "linear-gradient(90deg, #2563eb, #3d8cff, #6ba6ff)",
              color: "#04060c",
              letterSpacing: "0.14em",
              boxShadow: isGold
                ? "0 0 18px rgba(242,193,78,0.28)"
                : "0 0 18px rgba(61,140,255,0.28)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.filter = "brightness(1.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.filter = "brightness(1)";
            }}
          >
            <span>▶</span>
            {tCommon("viewDetails")}
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="w-full rounded-full border py-2 font-display text-[11px] sm:text-[12px] font-bold uppercase"
            style={{
              borderColor: "rgba(174,184,208,0.14)",
              color: "#5d6b91",
              letterSpacing: "0.14em",
            }}
          >
            {tCommon("viewDetails")}
          </button>
        )}
      </div>
    </article>
  );
}
