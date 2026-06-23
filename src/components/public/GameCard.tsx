"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { Game } from "@/types";
import {
  formatNumber,
  formatPlayers,
  formatRtp,
  BLUR_DATA_URL,
} from "@/lib/game-utils";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const RTP_MIN = 85;
const RTP_MAX = 102;
function rtpPct(v: number) {
  return Math.max(0, Math.min(100, ((v - RTP_MIN) / (RTP_MAX - RTP_MIN)) * 100));
}

// ── 数字计入动效 + 持续微跳 ─────────────────────────────────────
function useLiveMultiplier(): number {
  const [mult, setMult] = useState(0); // 0→1 count-up, then jitter around 1
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const rafRef   = useRef<number>();

  // Phase 1: ease-out count-up 0→1 over 1.2s
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
  }, []);

  // Phase 2: micro-jitter (±0.3%) every 2–4s, starts after count-up
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

// ── DataRow ──────────────────────────────────────────────────────
interface DataRowProps {
  label: string;
  value: string;
  pct: number;
  isGold?: boolean;
  isWeak?: boolean;
}

function DataRow({ label, value, pct, isGold, isWeak }: DataRowProps) {
  const fillStyle = isWeak
    ? { background: "linear-gradient(90deg, #1a4040, #2d6b65)", boxShadow: "none" }
    : isGold
    ? {
        background: "linear-gradient(90deg, #c8982f, #f2c14e, #f8e3a3)",
        boxShadow: "0 0 10px rgba(242,193,78,0.40)",
      }
    : {
        background: "linear-gradient(90deg, #1f7fe0, #37b6ff, #7fd6ff)",
        boxShadow: "0 0 10px rgba(55,182,255,0.40)",
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
          style={{ color: isGold ? "#f2c14e" : "#37b6ff" }}
        >
          {value}
        </span>
      </div>
      <div className="h-[5px] w-full overflow-hidden rounded-full" style={{ background: "#152036" }}>
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

// ── 涨跌箭头 ─────────────────────────────────────────────────────
function DeltaBadge({ delta, rank }: { delta: number; rank: number }) {
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
  if (rank === 1) {
    return (
      <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "#f2c14e" }}>
        HOT
      </span>
    );
  }
  return null;
}

// ── Main GameCard ─────────────────────────────────────────────────
interface GameCardProps {
  game: Game;
  isFeature?: boolean;
}

export default function GameCard({ game, isFeature = false }: GameCardProps) {
  const [imgError, setImgError] = useState(false);
  const tStats  = useTranslations("stats");
  const tCommon = useTranslations("common");

  // rank=1 is always HOT gold card
  const isGold   = isFeature;
  const hasLink  = Boolean(game.detailUrl);
  const mult     = useLiveMultiplier();

  // Live-animated display values
  const shownPlayers = Math.max(0, Math.round(game.playerCount * mult));
  const shownBets    = Math.max(0, Math.round(game.totalBets * mult));
  const shownRtp     = Math.max(0, Math.round(game.rtp * Math.min(mult, 1) * 100) / 100);

  const delta = game.delta ?? 0;
  const rank  = game.rank  ?? 0;

  return (
    <article
      className={`glass-card ${isGold ? "glass-card--gold" : ""} group relative flex flex-col overflow-hidden`}
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
            : "linear-gradient(90deg, transparent, rgba(55,182,255,0.75), transparent)",
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
          <DeltaBadge delta={delta} rank={rank} />
        </div>

        {/* ── 图标 + 标题 ── */}
        <div className="flex gap-3">
          {/* 游戏图标方块 */}
          <div
            className="relative shrink-0 overflow-hidden"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "12px",
              boxShadow: isGold
                ? "0 0 18px rgba(242,193,78,0.28)"
                : "0 0 18px rgba(55,182,255,0.24)",
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
                  style={{ color: "rgba(55,182,255,0.35)" }}
                >
                  X168
                </span>
              </div>
            )}
          </div>

          {/* 标题区 */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <span
              className="font-mono text-[9px] sm:text-[10px] uppercase"
              style={{ letterSpacing: "0.20em", color: "#37b6ff" }}
            >
              {game.categoryLabel || game.category}
            </span>
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

        {/* ── 4 条数据行 ── */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <DataRow
            label={tStats("currentRtp")}
            value={formatRtp(shownRtp)}
            pct={rtpPct(shownRtp)}
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
            value={formatPlayers(shownPlayers)}
            pct={Math.min(100, (shownPlayers / 20000) * 100)}
            isGold={isGold}
            isWeak={game.playerCount < 50}
          />
          <DataRow
            label={tStats("totalBets")}
            value={formatNumber(shownBets)}
            pct={Math.min(100, (shownBets / 500000) * 100)}
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
                : "linear-gradient(90deg, #1f7fe0, #37b6ff, #7fd6ff)",
              color: "#04060c",
              letterSpacing: "0.14em",
              boxShadow: isGold
                ? "0 0 18px rgba(242,193,78,0.28)"
                : "0 0 18px rgba(55,182,255,0.28)",
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
