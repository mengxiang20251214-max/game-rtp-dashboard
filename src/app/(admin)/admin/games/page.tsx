import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeGame } from "@/lib/game-utils";
import GameTable from "@/components/admin/GameTable";

export const dynamic = "force-dynamic";

export default async function AdminGamesPage() {
  const records = await prisma.game.findMany({
    orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
  });
  const games = records.map(serializeGame);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-content-primary">游戏管理</h1>
          <p className="mt-1 text-sm text-content-secondary">
            共 {games.length} 个游戏 · 可调整排名 / 编辑 / 删除
          </p>
        </div>
        <Link
          href="/admin/games/new"
          className="rounded-lg border border-neon-blue/40 bg-neon-blue/10 px-4 py-2 font-display text-sm font-semibold text-neon-blue transition-all hover:shadow-neon-blue"
        >
          + 添加游戏
        </Link>
      </div>

      <GameTable initialGames={games} />
    </div>
  );
}
