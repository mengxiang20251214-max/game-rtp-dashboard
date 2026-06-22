import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { serializeGame } from "@/lib/game-utils";
import { getActiveCategories, getSiteSettings } from "@/lib/site";
import Dashboard from "@/components/public/Dashboard";
import LoadingSkeleton from "@/components/public/LoadingSkeleton";

// 每次请求都从数据库读取最新数据
export const dynamic = "force-dynamic";

// 优先使用后台 SeoConfig("home") 的配置，否则回退默认文案
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
    // 数据库不可用时使用默认值
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

// 数据加载组件：在数据就绪前由 Suspense 显示骨架屏
async function GamesDashboard() {
  const [records, categories, settings] = await Promise.all([
    prisma.game.findMany({
      where: { isActive: true },
      orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
      include: { categoryRef: true },
    }),
    getActiveCategories(),
    getSiteSettings(),
  ]);

  const labelByName = new Map(categories.map((c) => [c.name, c.label]));
  const games = records.map((r) => ({
    ...serializeGame(r),
    categoryLabel: r.categoryRef?.label ?? labelByName.get(r.category) ?? r.category,
  }));

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
