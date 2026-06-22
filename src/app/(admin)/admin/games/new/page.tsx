import { getTranslations } from "next-intl/server";
import GameForm from "@/components/admin/GameForm";

export default async function NewGamePage() {
  const t = await getTranslations("admin.form");
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-content-primary">
          {t("newTitle")}
        </h1>
        <p className="mt-1 text-sm text-content-secondary">{t("newSubtitle")}</p>
      </div>
      <GameForm />
    </div>
  );
}
