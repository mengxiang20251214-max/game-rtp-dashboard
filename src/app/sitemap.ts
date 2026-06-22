import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://game-rtp-dashboard.vercel.app";

// 在请求时生成（依赖数据库）
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 用最新游戏的更新时间作为首页 lastModified
  let lastModified = new Date();
  try {
    const latest = await prisma.game.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    if (latest?.updatedAt) lastModified = latest.updatedAt;
  } catch {
    // 数据库不可用时退回当前时间
  }

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "hourly",
      priority: 1,
    },
  ];
}
