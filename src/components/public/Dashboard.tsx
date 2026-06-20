"use client";

import { useMemo, useState, useCallback } from "react";
import type { Category, Game } from "@/types";
import Header from "./Header";
import CategoryFilter from "./CategoryFilter";
import GameGrid from "./GameGrid";

export default function Dashboard({ initialGames }: { initialGames: Game[] }) {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [active, setActive] = useState<Category | "ALL">("ALL");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() =>
    new Date().toLocaleTimeString("zh-CN", { hour12: false })
  );

  const counts = useMemo(() => {
    const c: Record<Category | "ALL", number> = {
      ALL: games.length,
      SLOT: 0,
      TABLE: 0,
      LIVE: 0,
    };
    for (const g of games) c[g.category]++;
    return c;
  }, [games]);

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
        setLastUpdated(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
      }
    } catch (err) {
      console.error("刷新失败:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <Header onRefresh={handleRefresh} refreshing={refreshing} lastUpdated={lastUpdated} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* 标题区 */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold text-content-primary sm:text-3xl">
            游戏 <span className="text-neon-blue text-glow">RTP</span> 实时面板
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-content-secondary">
            监控所有游戏的实时回报率（Return To Player），数据每次刷新自数据库读取，
            颜色随 RTP 与目标值的偏差动态变化。
          </p>
        </div>

        {/* 分类筛选 */}
        <div className="mb-8">
          <CategoryFilter active={active} counts={counts} onChange={setActive} />
        </div>

        {/* 游戏网格 */}
        <GameGrid games={filtered} />
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-content-secondary">
        RTP 数据中枢 · 仅供演示 · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
