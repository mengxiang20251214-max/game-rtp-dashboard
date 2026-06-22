import { getTranslations } from "next-intl/server";
import GameForm from "@/components/admin/GameForm";
import { getActiveCategories } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const t = await getTranslations("admin.form");
  const categories = await getActiveCategories();
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-content-primary">
          {t("newTitle")}
        </h1>
        <p className="mt-1 text-sm text-content-secondary">{t("newSubtitle")}</p>
      </div>
      <GameForm categories={categories} />
    </div>
  );
}
