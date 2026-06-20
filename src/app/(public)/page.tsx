import { prisma } from "@/lib/prisma";
import { serializeGame } from "@/lib/game-utils";
import Dashboard from "@/components/public/Dashboard";

// 每次请求都从数据库读取最新数据
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const records = await prisma.game.findMany({
    where: { isActive: true },
    orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
  });
  const games = records.map(serializeGame);

  return <Dashboard initialGames={games} />;
}
