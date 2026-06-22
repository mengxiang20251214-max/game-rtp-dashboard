import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { serializeGame } from "@/lib/game-utils";
import { getActiveCategories } from "@/lib/site";
import GameForm from "@/components/admin/GameForm";

export const dynamic = "force-dynamic";

// 通过查询参数 ?id=... 编辑游戏。
// 游戏 ID 含空格/中文/撇号，作为 URL 路径段会导致 Next 动态路由匹配失败（404），
// 改用查询参数：searchParams 会被可靠解码，且路由是静态段不会匹配失败。
export default async function EditGamePage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const t = await getTranslations("admin.form");
  const id = searchParams.id;
  if (!id) notFound();

  const record = await prisma.game.findUnique({ where: { id } });
  if (!record) notFound();

  const game = serializeGame(record);
  const categories = await getActiveCategories();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-content-primary">
          {t("editTitle")}
        </h1>
        <p className="mt-1 text-sm text-content-secondary">{game.name}</p>
      </div>
      <GameForm game={game} categories={categories} />
    </div>
  );
}
