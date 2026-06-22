import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import CategoryManager, { type AdminCategory } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const t = await getTranslations("admin.categories");
  const rows = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { games: true } } },
  });
  const initial: AdminCategory[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    label: c.label,
    icon: c.icon,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    gameCount: c._count.games,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-content-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-content-secondary">{t("subtitle")}</p>
      </div>
      <CategoryManager initial={initial} />
    </div>
  );
}
