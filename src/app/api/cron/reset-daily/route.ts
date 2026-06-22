import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 每日 00:00 将所有游戏重置为初始值
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const games = await prisma.game.findMany({
      select: {
        id: true,
        targetRtp: true,
        initialRank: true,
        initialPlayerCount: true,
        initialTotalBets: true,
        initialTotalWins: true,
      },
    });

    const updates = await Promise.all(
      games.map((g) =>
        prisma.game.update({
          where: { id: g.id },
          data: {
            rank: g.initialRank,
            playerCount: g.initialPlayerCount,
            totalBets: g.initialTotalBets,
            totalWins: g.initialTotalWins,
            rtp: g.targetRtp,
            status: "NORMAL",
            trend: JSON.stringify([g.targetRtp]),
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      reset: updates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron reset-daily failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
