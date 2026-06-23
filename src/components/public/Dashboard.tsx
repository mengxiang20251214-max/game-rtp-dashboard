"use client";

import { useMemo, useState, useCallback } from "react";
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

      {/* ── 固定置顶区：Logo → 分类 ── */}
      <div className="sticky top-0 z-50 bg-bg-primary/90 backdrop-blur-[16px]">
        <Header
          onRefresh={handleRefresh}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          siteTitle={siteTitle}
          siteDescription={siteDescription}
          logo={logo}
        />
        {/* 分类筛选 */}
        <div className="border-b border-sky-200/50 px-3 py-2 sm:px-6 sm:py-3">
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
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8">
        {/* 游戏网格 */}
        <GameGrid games={filtered} />
      </main>

      <footer className="border-t border-sky-200/50 py-6 text-center text-xs text-content-secondary">
        {copyright} · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
