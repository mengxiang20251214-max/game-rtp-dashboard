"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { CategoryItem, Game } from "@/types";
import { SORT_MODES, normalizeSort, type SortMode } from "@/lib/ranking";
import { formatIDR, formatNum } from "@/lib/game-utils";
import { walkMetrics, walkOnline, type MetricTier } from "@/lib/stable-metrics";
import { useLoading } from "@/hooks/useLoading";
import LoadingScreen from "./LoadingScreen";
import Header from "./Header";
import CategoryFilter from "./CategoryFilter";
import GameGrid from "./GameGrid";

const SORT_STORAGE_KEY = "x168-sort-mode";

// 让数据"活起来但不穿帮"：每次加载/刷新对每款游戏走一小步（walkMetrics），
// currentRtp 随之重算；并以 ~18% 概率让「自动区」相邻两款（综合分接近）换一次位，
// 换位用 delta ▲/▼ 体现。置顶区顺序永不变。
// 把游戏热度映射到指标走步分层：
//   blazing(榜首/featured) → hot；hot → popular；
//   高玩家+高投注（即使 heatTier=normal）→ popular；cold → cold；其余 normal。
function metricTierOf(g: Game): MetricTier {
  if (g.heatTier === "blazing") return "hot";
  if (g.heatTier === "hot") return "popular";
  if (g.playerCount >= 1500 && g.totalBets >= 1_000_000_000) return "popular";
  if (g.heatTier === "cold") return "cold";
  return "normal";
}

function livenGames(games: Game[]): Game[] {
  // 1) 各项指标走一步（基于上次显示值累积，按热度分层）
  const walked = games.map((g) => {
    const m = walkMetrics(
      g.id,
      {
        players: g.playerCount,
        totalBets: g.totalBets,
        totalWins: g.totalWins,
        targetRtp: g.targetRtp,
      },
      metricTierOf(g)
    );
    const rtp =
      m.totalBets > 0 ? Math.round((m.totalWins / m.totalBets) * 1000) / 10 : g.rtp;
    return { ...g, playerCount: m.players, totalBets: m.totalBets, totalWins: m.totalWins, rtp };
  });

  // 2) 偶尔一次相邻换位（仅自动区、非置顶、非 blazing、不动榜首）
  let upId = "";
  let downId = "";
  if (typeof window !== "undefined" && Math.random() < 0.18) {
    const cand: number[] = [];
    for (let i = 1; i < walked.length - 1; i++) {
      const a = walked[i];
      const b = walked[i + 1];
      if (!a.pinned && !b.pinned && a.heatTier !== "blazing" && b.heatTier !== "blazing") {
        cand.push(i);
      }
    }
    if (cand.length > 0) {
      const i = cand[Math.floor(Math.random() * cand.length)];
      [walked[i], walked[i + 1]] = [walked[i + 1], walked[i]];
      upId = walked[i].id;     // 上移
      downId = walked[i + 1].id; // 下移
    }
  }

  // 3) 重新编号 rank；delta 默认 0（大多稳定），换位的两款显示 ▲/▼
  return walked.map((g, idx) => ({
    ...g,
    rank: idx + 1,
    delta: g.id === upId ? 1 : g.id === downId ? -1 : 0,
  }));
}

function sumPlayers(games: Game[]): number {
  return games.reduce((s, g) => s + g.playerCount, 0);
}

// ── 排序切换胶囊组 ────────────────────────────────────────────────
function SortSwitcher({
  active,
  onChange,
}: {
  active: SortMode;
  onChange: (m: SortMode) => void;
}) {
  const t = useTranslations("sort");
  return (
    <div className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:px-0">
      {SORT_MODES.map((mode) => {
        const isActive = mode === active;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className="shrink-0 rounded-full px-4 py-2 font-display text-[12px] font-semibold transition-all"
            style={
              isActive
                ? {
                    border: "1px solid rgba(77,171,233,0.55)",
                    background: "rgba(77,171,233,0.12)",
                    color: "#4DABE9",
                    boxShadow: "0 0 16px rgba(77,171,233,0.18)",
                  }
                : {
                    border: "1px solid rgba(174,184,208,0.14)",
                    background: "transparent",
                    color: "#8b96b4",
                  }
            }
          >
            {t(mode)}
          </button>
        );
      })}
    </div>
  );
}

// ── 卡片骨架屏（切换排序 / 刷新时占位，替代白屏） ──────────────────
function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-[28px]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="glass-card animate-pulse-glow overflow-hidden p-3 sm:p-[22px]"
          style={{ minHeight: "260px" }}
        >
          <div className="flex gap-3">
            <div className="h-[60px] w-[60px] shrink-0 rounded-[12px]" style={{ background: "rgba(174,184,208,0.10)" }} />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-2.5 w-1/2 rounded-full" style={{ background: "rgba(174,184,208,0.10)" }} />
              <div className="h-3.5 w-3/4 rounded-full" style={{ background: "rgba(174,184,208,0.10)" }} />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-[5px] w-full rounded-full" style={{ background: "rgba(174,184,208,0.08)" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 错误态（接口失败，印尼语提示 + 重试） ──────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("state");
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-[20px] border py-20 text-center"
      style={{ borderColor: "rgba(174,184,208,0.14)", borderStyle: "dashed" }}
    >
      <span className="font-mono text-4xl" style={{ color: "rgba(239,68,68,0.5)" }}>!</span>
      <p className="font-display text-sm" style={{ color: "#8b96b4" }}>{t("loadFailed")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full px-5 py-2 font-display text-[12px] font-semibold transition-all"
        style={{
          border: "1px solid rgba(77,171,233,0.55)",
          background: "rgba(77,171,233,0.12)",
          color: "#4DABE9",
        }}
      >
        {t("retry")}
      </button>
    </div>
  );
}

interface DashboardProps {
  initialGames: Game[];
  categories: CategoryItem[];
  copyright: string;
  siteTitle: string;
  siteDescription: string;
  logo: string;
}

// ── 中奖飘条 ──────────────────────────────────────────────────────
const PLAYER_NAMES = ["V***88","A***43","M***17","R***29","S***62","B***05","D***91","T***34","K***56","W***72"];
// 金额数值统一走 formatIDR（印尼盾、千分位用点）
const WIN_AMOUNTS  = [82500, 234800, 1590000, 156000, 1285000, 673000, 317500, 8950000, 146000, 2100000];

function WinnerTicker({ games }: { games: Game[] }) {
  const gameNames = useMemo(
    () => games.length > 0 ? games.slice(0, 8).map((g) => g.name) : ["Aviator","Sweet Bonanza","Mahjong Ways"],
    [games]
  );
  const messages = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      player: PLAYER_NAMES[i % PLAYER_NAMES.length],
      amount: formatIDR(WIN_AMOUNTS[i % WIN_AMOUNTS.length]),
      game:   gameNames[i % gameNames.length],
    })), [gameNames]
  );

  return (
    <div className="overflow-hidden" style={{ borderBottom: "1px solid rgba(174,184,208,0.10)" }}>
      <div className="flex whitespace-nowrap py-1.5">
        <div className="animate-marquee flex shrink-0 items-center">
          {[...messages, ...messages].map((m, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-5">
              <span className="h-1 w-1 rounded-full" style={{ background: "#22c55e", opacity: 0.7 }} />
              <span className="font-mono text-[10px]" style={{ color: "#8b96b4" }}>
                Pemain{" "}
                <span style={{ color: "#d3dae9" }}>{m.player}</span>
                {" "}baru saja menang{" "}
                <span style={{ color: "#4DABE9", fontWeight: 700 }}>{m.amount}</span>
                {" "}di{" "}
                <span style={{ color: "#d3dae9", textDecoration: "underline", textUnderlineOffset: "2px" }}>{m.game}</span>
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── LIVE 状态条 ───────────────────────────────────────────────────
function LiveBar({ online, lastUpdated }: { online: number; lastUpdated: string }) {
  const [secsAgo, setSecsAgo] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    setSecsAgo(0);
    const id = setInterval(() => {
      setSecsAgo(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const totalOnline = online;

  return (
    <div
      className="flex items-center justify-between px-3 py-1 sm:px-6"
      style={{ borderBottom: "1px solid rgba(174,184,208,0.10)" }}
    >
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full animate-pulse-glow" style={{ background: "#22c55e" }} />
        <span className="font-mono text-[10px]" style={{ color: "#8b96b4" }}>
          LIVE
          <span style={{ color: "rgba(174,184,208,0.45)" }}>
            {" · "}diperbarui {secsAgo}d lalu
          </span>
        </span>
      </div>
      <span className="font-mono text-[10px]" style={{ color: "#8b96b4" }}>
        <span style={{ color: "#d3dae9" }}>{formatNum(totalOnline)}</span>
        {" "}orang online
      </span>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────
export default function Dashboard({
  initialGames,
  categories,
  copyright,
  siteTitle,
  siteDescription,
  logo,
}: DashboardProps) {
  const t = useTranslations("home");
  const { ready } = useLoading();
  const [games, setGames] = useState<Game[]>(initialGames);
  const [active, setActive] = useState<string>("ALL");
  const [sort, setSort] = useState<SortMode>("composite");
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [liveOnline, setLiveOnline] = useState<number>(() => sumPlayers(initialGames));
  const [lastUpdated, setLastUpdated] = useState<string>(() =>
    new Date().toLocaleTimeString("id-ID", { hour12: false })
  );

  // 拉取指定排序模式的列表（前端零二次排序；每次刷新走一小步让数据"活起来"）
  const fetchSorted = useCallback(async (mode: SortMode) => {
    setRefreshing(true);
    setLoadError(false);
    try {
      const res = await fetch(`/api/games?sort=${mode}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        const walked = livenGames(json.data as Game[]);
        setGames(walked);
        setLiveOnline(walkOnline(sumPlayers(walked)));
        setLastUpdated(new Date().toLocaleTimeString("id-ID", { hour12: false }));
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error("排序拉取失败:", err);
      setLoadError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 初次挂载：恢复排序模式；并对首屏数据走一小步（与刷新一致）
  useEffect(() => {
    const saved = normalizeSort(
      typeof window !== "undefined" ? localStorage.getItem(SORT_STORAGE_KEY) : null
    );
    if (saved !== "composite") {
      setSort(saved);
      void fetchSorted(saved);
    } else {
      const walked = livenGames(initialGames);
      setGames(walked);
      setLiveOnline(walkOnline(sumPlayers(walked)));
    }
    // 仅挂载执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSort = useCallback(
    (mode: SortMode) => {
      if (mode === sort) return;
      setSort(mode);
      if (typeof window !== "undefined") localStorage.setItem(SORT_STORAGE_KEY, mode);
      void fetchSorted(mode);
    },
    [sort, fetchSorted]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: games.length };
    for (const cat of categories) c[cat.name] = 0;
    for (const g of games) c[g.category] = (c[g.category] ?? 0) + 1;
    return c;
  }, [games, categories]);

  const filtered = useMemo(
    () => (active === "ALL" ? games : games.filter((g) => g.category === active)),
    [games, active]
  );

  const handleRefresh = useCallback(() => fetchSorted(sort), [fetchSorted, sort]);

  if (!ready) return <LoadingScreen />;

  return (
    <div className="min-h-screen animate-[fadeIn_0.4s_ease-out]">

      {/* ── 固定置顶区 ── */}
      <div
        className="sticky top-0 z-50 backdrop-blur-[18px]"
        style={{ background: "rgba(5,8,16,0.88)" }}
      >
        <Header
          onRefresh={handleRefresh}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          siteTitle={siteTitle}
          siteDescription={siteDescription}
          logo={logo}
        />

        {/* LIVE 状态条 */}
        <LiveBar online={liveOnline} lastUpdated={lastUpdated} />

        {/* 中奖飘条 */}
        <WinnerTicker games={games} />

        {/* 分类筛选 */}
        <div
          className="border-b px-3 py-2.5 sm:px-6 sm:py-3"
          style={{ borderColor: "rgba(174,184,208,0.14)" }}
        >
          <div className="mx-auto max-w-7xl">
            <CategoryFilter
              active={active}
              categories={categories}
              counts={counts}
              onChange={setActive}
            />
          </div>
        </div>
      </div>

      {/* ── 可滚动内容区 ── */}
      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-10">
        {/* 排序切换 */}
        <div className="mb-5 sm:mb-7">
          <SortSwitcher active={sort} onChange={handleSort} />
        </div>
        {loadError ? (
          <ErrorState onRetry={() => fetchSorted(sort)} />
        ) : refreshing ? (
          <GridSkeleton />
        ) : (
          <GameGrid
            games={filtered}
            sectionTitle={active === "ALL" ? t("allGames") : undefined}
            resetKey={sort}
          />
        )}
      </main>

      <footer
        className="border-t py-6 text-center text-xs text-content-weak"
        style={{ borderColor: "rgba(174,184,208,0.14)" }}
      >
        {copyright} · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
