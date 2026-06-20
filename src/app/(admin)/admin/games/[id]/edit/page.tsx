import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeGame } from "@/lib/game-utils";
import GameForm from "@/components/admin/GameForm";

export const dynamic = "force-dynamic";

export default async function EditGamePage({
  params,
}: {
  params: { id: string };
}) {
  const record = await prisma.game.findUnique({ where: { id: params.id } });
  if (!record) notFound();

  const game = serializeGame(record);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-content-primary">编辑游戏</h1>
        <p className="mt-1 text-sm text-content-secondary">{game.name}</p>
      </div>
      <GameForm game={game} />
    </div>
  );
}
