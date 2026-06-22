import { getTranslations } from "next-intl/server";
import { getSiteSettings } from "@/lib/site";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const t = await getTranslations("admin.settings");
  const settings = await getSiteSettings();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-content-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-content-secondary">{t("subtitle")}</p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
