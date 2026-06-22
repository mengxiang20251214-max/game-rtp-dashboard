import { prisma } from "@/lib/prisma";
import type { CategoryItem, SiteSettings } from "@/types";

// 默认站点设置（数据库无值时回退）
const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: "RTP 数据中枢 · Game RTP Dashboard",
  siteDescription: "Real-time game return-to-player monitor · v1.0.0",
  copyright: "RTP 数据中枢 · 仅供演示",
  logo: "",
};

/** 读取站点设置（key→value），带默认值回退 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await prisma.siteSetting.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      siteTitle: map.get("siteTitle") || DEFAULT_SETTINGS.siteTitle,
      siteDescription: map.get("siteDescription") || DEFAULT_SETTINGS.siteDescription,
      copyright: map.get("copyright") || DEFAULT_SETTINGS.copyright,
      logo: map.get("logo") || DEFAULT_SETTINGS.logo,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** 读取启用的分类（按 sortOrder） */
export async function getActiveCategories(): Promise<CategoryItem[]> {
  try {
    const rows = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      label: c.label,
      icon: c.icon,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    }));
  } catch {
    return [];
  }
}
