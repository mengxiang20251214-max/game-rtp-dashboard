import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { serializeGame } from "@/lib/game-utils";
import { computeRankings, toRankInput } from "@/lib/ranking";
import { getActiveCategories, getSiteSettings } from "@/lib/site";
import Dashboard from "@/components/public/Dashboard";
import LoadingSkeleton from "@/components/public/LoadingSkeleton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const fallbackTitle = "游戏 RTP 实时面板";
  const fallbackDesc =
    "实时监控所有游戏的回报率（RTP），含老虎机、桌游与真人游戏分类筛选与动态进度展示。";

  let title = fallbackTitle;
  let description = fallbackDesc;
  let keywords: string[] | undefined;

  try {
    const seo = await prisma.seoConfig.findUnique({ where: { key: "home" } });
    if (seo?.title) title = seo.title;
    if (seo?.description) description = seo.description;
    if (seo?.keywords) {
      keywords = seo.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
    }
  } catch {
    // fallback to defaults
  }

  return {
    title,
    description,
    keywords,
    alternates: { canonical: "/" },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

async function GamesDashboard() {
  const [records, categories, settings] = await Promise.all([
    prisma.game.findMany({
      where: { isActive: true },
      include: { categoryRef: true },
    }),
    getActiveCategories(),
    getSiteSettings(),
  ]);

  // Two-stage ranking (server-side, authoritative)
  const rankResults = computeRankings(
    records.map((g) => toRankInput(g as Record<string, unknown>))
  );
  const rankMap = new Map(rankResults.map((r) => [r.id, r]));

  // Sort by computed rank — do NOT re-sort on frontend
  records.sort(
    (a, b) => (rankMap.get(a.id)?.rank ?? 999) - (rankMap.get(b.id)?.rank ?? 999)
  );

  const labelByName = new Map(categories.map((c) => [c.name, c.label]));
  const games = records.map((r) => {
    const ranked = rankMap.get(r.id);
    return {
      ...serializeGame(r),
      categoryLabel: r.categoryRef?.label ?? labelByName.get(r.category) ?? r.category,
      rtp: ranked?.currentRtp ?? r.rtp,
      rank: ranked?.rank ?? r.rank,
      delta: ranked?.delta ?? 0,
      heatTier: ranked?.heatTier ?? "normal",
      isNew: ranked?.isNew ?? false,
    };
  });

  return (
    <Dashboard
      initialGames={games}
      categories={categories}
      copyright={settings.copyright}
      siteTitle={settings.siteTitle}
      siteDescription={settings.siteDescription}
      logo={settings.logo}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <GamesDashboard />
    </Suspense>
  );
}
