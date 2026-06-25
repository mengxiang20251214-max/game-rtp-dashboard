"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { Game, HeatTier } from "@/types";
import {
  formatIDR,
  formatNum,
  formatPct,
  BLUR_DATA_URL,
  getDisplayStatus,
  displayStatusColor,
  DISPLAY_STATUS_LABELS,
} from "@/lib/game-utils";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const RTP_MIN = 85;
const RTP_MAX = 102;
function rtpPct(v: number) {
  return Math.max(0, Math.min(100, ((v - RTP_MIN) / (RTP_MAX - RTP_MIN)) * 100));
}

type Tone = "gold" | "cyan";

// ── 数字计入动效 + 持续微跳 ─────────────────────────────────────
// resetKey 变化时（如切换排序模式）重新触发 count-up
function useLiveMultiplier(resetKey?: unknown): number {
  const [mult, setMult] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const rafRef   = useRef<number>();

  useEffect(() => {
    let start: number | null = null;
    const duration = 1200;
    const step = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setMult(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [resetKey]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const tick = () => {
      setMult(1 + (Math.random() - 0.5) * 0.006);
      timerRef.current = setTimeout(tick, 2000 + Math.random() * 2000);
    };
    timerRef.current = setTimeout(tick, 1600);
    return () => clearTimeout(timerRef.current);
  }, []);

  return mult;
}

// ── 涨跌箭头 / 新游标记 ──────────────────────────────────────────
function DeltaBadge({ delta, isNew }: { delta: number; isNew: boolean }) {
  if (isNew) {
    return (
      <span className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: "#4DABE9" }}>
        NEW
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="font-mono text-[10px] tabular-nums" style={{ color: "#22c55e" }}>
        ▲{delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="font-mono text-[10px] tabular-nums" style={{ color: "#ef4444" }}>
        ▼{Math.abs(delta)}
      </span>
    );
  }
  return <span className="font-mono text-[10px]" style={{ color: "rgba(174,184,208,0.35)" }}>—</span>;
}

// ── Main GameCard ─────────────────────────────────────────────────
interface GameCardProps {
  game: Game;
  isFeature?: boolean;
  resetKey?: unknown;   // 变化时重新触发 count-up（如排序切换）
}

export default function GameCard({ game, isFeature = false, resetKey }: GameCardProps) {
  const [imgError, setImgError] = useState(false);
  const tStats  = useTranslations("stats");
  const tCommon = useTranslations("common");

  // 热度由后端打的 heatTier 决定（仅用于「更醒目」的加成，绝不弱化主信息）；
  // rank=1 兜底为 blazing。
  const heat: HeatTier =
    game.heatTier ?? (isFeature ? "blazing" : "normal");
  // 金色焦点全页仅一处：排名第 1 的卡。即使后端把多款标为 blazing，
  // 也只让榜首吃金皮肤，其余 blazing 退回品牌蓝（纯展示层规则，不动数据）。
  const isGold = (game.rank ?? 0) === 1;
  // 高热度（hot/blazing 但非榜首）：额外发光更醒目；不是「降级」。
  const isHot  = !isGold && (heat === "hot" || heat === "blazing");
  // 面向用户的正向运营标签（HOT / PUPULER / RTP TINGGI / TRENDING / NEW / NORMAL）。
  const displayStatus = getDisplayStatus({
    rank: game.rank ?? 0,
    playerCount: game.playerCount,
    totalBets: game.totalBets,
    rtp: game.rtp,
    isNew: game.isNew,
    heatTier: heat,
  });
  const tone: Tone = isGold ? "gold" : "cyan";

  // 吸引力分层（视觉强度）：rank1(金) > 高投注+高玩家(PUPULER) > 高RTP(RTP TINGGI) > 普通。
  // isStrong：高玩家+高投注的「热门」卡，品牌蓝光效更强（额外 pulse + 更亮边框/光晕）。
  const isStrong  = !isGold && displayStatus === "PUPULER";
  const isHiRtp   = !isGold && displayStatus === "RTP_TINGGI";

  // 主数据强调色 + 进度条填充：金=榜首焦点；其余一律品牌蓝（不存在灰色主信息）。
  const accentColor = isGold ? "#f2c14e" : "#4DABE9";
  // 高 RTP 卡的 RTP 数字更亮（更强发光）；高热门卡也略增强。
  const accentGlow  = isGold
    ? "0 0 12px rgba(242,193,78,0.5)"
    : isHiRtp
    ? "0 0 16px rgba(77,171,233,0.85)"
    : isStrong
    ? "0 0 14px rgba(77,171,233,0.7)"
    : "0 0 12px rgba(77,171,233,0.5)";
  const mainFill =
    tone === "gold"
      ? { background: "linear-gradient(90deg, #c8982f, #f2c14e, #f8e3a3)", boxShadow: "0 0 12px rgba(242,193,78,0.45)" }
      : { background: "linear-gradient(90deg, #176b96, #4DABE9, #8fd4ff)", boxShadow: "0 0 12px rgba(77,171,233,0.45)" };

  const hasLink  = Boolean(game.detailUrl);
  const mult     = useLiveMultiplier(resetKey);

  // 值已由 Dashboard 的随机游走（walkMetrics）按刷新累积；卡片只做 count-up + 微跳显示
  const shownPlayers = Math.max(0, Math.round(game.playerCount * mult));
  const shownBets    = Math.max(0, Math.round(game.totalBets * mult));
  const shownRtp     = Math.max(0, Math.round(game.rtp * Math.min(mult, 1) * 100) / 100);

  const delta = game.delta ?? 0;
  const rank  = game.rank  ?? 0;

  // 强热门卡（PUPULER 或 hot 档）用更强的品牌蓝玻璃皮肤。
  const cardCls = isGold
    ? "glass-card--gold"
    : isStrong || isHot
    ? "glass-card--strong"
    : "";

  return (
    <article
      className={`glass-card ${cardCls} group relative flex flex-col overflow-hidden`}
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
      {/* 顶部高光线（金=金色，其余=品牌蓝） */}
      <div
        className="h-[2px] w-full shrink-0"
        style={{
          background: isGold
            ? "linear-gradient(90deg, transparent, rgba(242,193,78,0.75), transparent)"
            : "linear-gradient(90deg, transparent, rgba(77,171,233,0.75), transparent)",
        }}
      />

      <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-[22px]">

        {/* ── 排名行 ── */}
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[10px] tabular-nums"
            style={{ color: isGold ? "rgba(242,193,78,0.65)" : "rgba(174,184,208,0.45)" }}
          >
            #{rank}
          </span>
          <DeltaBadge delta={delta} isNew={game.isNew ?? false} />
        </div>

        {/* ── 图标 + 标题 ── */}
        <div className="flex gap-3">
          <div
            className="relative shrink-0 overflow-hidden"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "12px",
              boxShadow: isGold
                ? "0 0 18px rgba(242,193,78,0.28)"
                : "0 0 18px rgba(77,171,233,0.24)",
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
                  game.image.startsWith("data:") || game.image.includes("picsum.photos")
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
                  style={{ color: "rgba(77,171,233,0.35)" }}
                >
                  X168
                </span>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <div className="flex items-center gap-1.5">
              <span
                className="font-mono text-[9px] sm:text-[10px] uppercase"
                style={{ letterSpacing: "0.20em", color: "#4DABE9" }}
              >
                {game.categoryLabel || game.category}
              </span>
              {/* 正向运营标签（非榜首；榜首在下方显示 ★ HOT）。
                  NORMAL 不显示徽章，避免噪音；其余一律品牌蓝（HOT 留给榜首）。 */}
              {!isGold && displayStatus !== "NORMAL" && (
                <span
                  className="rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase"
                  style={{
                    background: displayStatusColor(displayStatus).bg,
                    color: displayStatusColor(displayStatus).color,
                    letterSpacing: "0.10em",
                    // 高 RTP / 高热门徽章更亮（品牌蓝发光）
                    boxShadow:
                      isHiRtp || isStrong
                        ? "0 0 10px rgba(77,171,233,0.55)"
                        : "none",
                  }}
                >
                  {DISPLAY_STATUS_LABELS[displayStatus]}
                </span>
              )}
            </div>
            <h3
              className="line-clamp-2 font-serif text-[13px] sm:text-[15px] font-bold leading-tight"
              style={
                isGold
                  ? {
                      background: "linear-gradient(135deg, #f8e3a3, #f2c14e, #c8982f)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }
                  : { color: "#eef1f8" }
              }
            >
              {game.name}
            </h3>
            {isGold && (
              <span
                className="inline-flex items-center self-start gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
                style={{
                  background: "linear-gradient(135deg, #f8e3a3, #f2c14e, #c8982f)",
                  color: "#1a0c00",
                  letterSpacing: "0.12em",
                }}
              >
                ★ HOT
              </span>
            )}
          </div>
        </div>

        {/* ── RTP Saat Ini（主数据，做大） ── */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="font-display text-[11px] sm:text-[12px] leading-none" style={{ color: "#8b96b4" }}>
              {tStats("currentRtp")}
            </span>
            <span
              className="shrink-0 font-mono font-bold leading-none tabular-nums"
              style={{ fontSize: "20px", color: accentColor, textShadow: accentGlow }}
            >
              {formatPct(shownRtp)}
            </span>
          </div>
          <div className="h-[7px] w-full overflow-hidden rounded-full" style={{ background: "#152036" }}>
            <motion.div
              className="h-full rounded-full"
              style={mainFill}
              initial={{ width: 0 }}
              animate={{ width: `${rtpPct(shownRtp)}%` }}
              transition={{ duration: 0.9, ease: EASE }}
            />
          </div>
        </div>

        {/* ── RTP Target（弱参照，细暗） ── */}
        <div className="-mt-1">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="font-display text-[10px] leading-none" style={{ color: "#5d6b91" }}>
              {tStats("targetRtp")}
            </span>
            <span className="shrink-0 font-mono text-[12px] leading-none tabular-nums" style={{ color: "#8b96b4" }}>
              {formatPct(game.targetRtp)}
            </span>
          </div>
          <div className="h-[4px] w-full overflow-hidden rounded-full" style={{ background: "#152036" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "rgba(77,171,233,0.28)" }}
              initial={{ width: 0 }}
              animate={{ width: `${rtpPct(game.targetRtp)}%` }}
              transition={{ duration: 0.9, ease: EASE }}
            />
          </div>
        </div>

        {/* ── 分隔细线 ── */}
        <div className="h-px w-full" style={{ background: "rgba(174,184,208,0.14)" }} />

        {/* ── 底部 stat 两格：Pemain · Total Taruhan ── */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(13,19,32,0.40)" }}>
            <div className="mb-1 flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8b96b4" strokeWidth="2">
                <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" />
              </svg>
              <span className="font-display text-[10px] uppercase" style={{ color: "#8b96b4", letterSpacing: "0.08em" }}>
                {tStats("players")}
              </span>
            </div>
            <div className="font-mono text-[14px] font-bold tabular-nums" style={{ color: "#eef1f8" }}>
              {formatNum(shownPlayers)}
            </div>
          </div>
          <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(13,19,32,0.40)" }}>
            <div className="mb-1 flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8b96b4" strokeWidth="2">
                <circle cx="9" cy="9" r="5" /><path d="M14.5 6.5a5 5 0 1 1 0 11" />
              </svg>
              <span className="font-display text-[10px] uppercase" style={{ color: "#8b96b4", letterSpacing: "0.08em" }}>
                {tStats("totalBets")}
              </span>
            </div>
            <div className="font-mono text-[12px] sm:text-[13px] font-bold tabular-nums" style={{ color: "#eef1f8" }}>
              {formatIDR(shownBets)}
            </div>
          </div>
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
                : "linear-gradient(90deg, #176b96, #4DABE9, #8fd4ff)",
              color: "#04060c",
              letterSpacing: "0.14em",
              boxShadow: isGold
                ? "0 0 18px rgba(242,193,78,0.28)"
                : "0 0 18px rgba(77,171,233,0.28)",
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
