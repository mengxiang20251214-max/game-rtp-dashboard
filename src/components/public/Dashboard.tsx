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
      <Header
        onRefresh={handleRefresh}
        refreshing={refreshing}
        lastUpdated={lastUpdated}
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        logo={logo}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* 标题区 */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold text-content-primary sm:text-3xl">
            {t("titleBefore")}
            <span className="text-neon-blue text-glow">{t("titleHighlight")}</span>
            {t("titleAfter")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-content-secondary">{t("subtitle")}</p>
        </div>

        {/* 分类筛选（动态读取自数据库） */}
        <div className="mb-8">
          <CategoryFilter
            active={active}
            categories={categories}
            counts={counts}
            onChange={setActive}
          />
        </div>

        {/* 游戏网格 */}
        <GameGrid games={filtered} />
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-content-secondary">
        {copyright} · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
