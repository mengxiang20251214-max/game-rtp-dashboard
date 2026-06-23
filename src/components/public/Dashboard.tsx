"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { CategoryItem, Game } from "@/types";
import { useLoading } from "@/hooks/useLoading";
import LoadingScreen from "./LoadingScreen";
import Header from "./Header";
import CategoryFilter from "./CategoryFilter";
import GameGrid from "./GameGrid";

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
const WIN_AMOUNTS  = ["Rp 8.250","Rp 23.480","Rp 5.900","Rp 156.000","Rp 12.850","Rp 67.300","Rp 3.175","Rp 89.500","Rp 14.600","Rp 210.000"];

function WinnerTicker({ games }: { games: Game[] }) {
  const gameNames = useMemo(
    () => games.length > 0 ? games.slice(0, 8).map((g) => g.name) : ["Aviator","Sweet Bonanza","Mahjong Ways"],
    [games]
  );
  const messages = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      player: PLAYER_NAMES[i % PLAYER_NAMES.length],
      amount: WIN_AMOUNTS[i % WIN_AMOUNTS.length],
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
                <span style={{ color: "#f2c14e" }}>{m.amount}</span>
                {" "}di{" "}
                <span style={{ color: "#37b6ff" }}>{m.game}</span>
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── LIVE 状态条 ───────────────────────────────────────────────────
function LiveBar({ games, lastUpdated }: { games: Game[]; lastUpdated: string }) {
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

  const totalOnline = useMemo(
    () => games.reduce((sum, g) => sum + g.playerCount, 0),
    [games]
  );

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
        <span style={{ color: "#d3dae9" }}>{totalOnline.toLocaleString("id-ID")}</span>
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() =>
    new Date().toLocaleTimeString("id-ID", { hour12: false })
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/games", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setGames(json.data as Game[]);
        setLastUpdated(new Date().toLocaleTimeString("id-ID", { hour12: false }));
      }
    } catch (err) {
      console.error("刷新失败:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (!ready) return <LoadingScreen />;

  return (
    <div className="min-h-screen animate-[fadeIn_0.4s_ease-out]">

      {/* ── 固定置顶区 ── */}
      <div
        className="sticky top-0 z-50 backdrop-blur-[18px]"
        style={{ background: "rgba(8,22,52,0.88)" }}
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
        <LiveBar games={games} lastUpdated={lastUpdated} />

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
        <GameGrid
          games={filtered}
          sectionTitle={active === "ALL" ? t("allGames") : undefined}
        />
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
