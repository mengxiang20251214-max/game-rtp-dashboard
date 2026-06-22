import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveStatus, parseTrend } from "@/lib/game-utils";

export const dynamic = "force-dynamic";

const FLUCTUATION_RANGE = 2; // RTP ±2%
const TREND_POINTS = 12;

function getRandomRtp(targetRtp: number): number {
  const min = Math.max(80, targetRtp - FLUCTUATION_RANGE);
  const max = Math.min(99.9, targetRtp + FLUCTUATION_RANGE);
  return Number((Math.random() * (max - min) + min).toFixed(1));
}

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
        trend: true,
        rank: true,
        playerCount: true,
        totalBets: true,
        initialPlayerCount: true,
        initialTotalBets: true,
      },
    });
    if (games.length === 0) {
      return NextResponse.json({ success: true, updated: 0, swaps: 0 });
    }

    // 1) 随机交换 2-3 对游戏的 rank
    const rankById = new Map(games.map((g) => [g.id, g.rank]));
    const ids = games.map((g) => g.id);
    const swapCount = Math.min(Math.floor(Math.random() * 2) + 2, Math.floor(ids.length / 2));
    for (let i = 0; i < swapCount; i++) {
      const a = ids[Math.floor(Math.random() * ids.length)];
      let b = ids[Math.floor(Math.random() * ids.length)];
      let guard = 0;
      while (b === a && guard++ < 10) b = ids[Math.floor(Math.random() * ids.length)];
      if (a === b) continue;
      const ra = rankById.get(a)!;
      rankById.set(a, rankById.get(b)!);
      rankById.set(b, ra);
    }

    // 2-6) 同步更新指标 + rtp + status + trend
    const updates = await Promise.all(
      games.map((g) => {
        const playerCountFactor = 0.9 + Math.random() * 0.2; // ±10%
        const betsFactor = 0.95 + Math.random() * 0.1; // ±5%
        const winFactor = 0.88 + Math.random() * 0.11; // 88%-99%

        // 以初始值为基准浮动，避免随时间单向漂移
        const basePlayers = g.initialPlayerCount || g.playerCount || 0;
        const baseBets = g.initialTotalBets || g.totalBets || 0;
        const playerCount = Math.max(0, Math.round(basePlayers * playerCountFactor));
        const totalBets = Math.round(baseBets * betsFactor);
        const totalWins = Math.round(totalBets * winFactor);

        const newRtp = getRandomRtp(g.targetRtp);
        const newStatus = deriveStatus(newRtp, g.targetRtp);
        const nextTrend = [...parseTrend(g.trend), newRtp].slice(-TREND_POINTS);

        return prisma.game.update({
          where: { id: g.id },
          data: {
            rank: rankById.get(g.id)!,
            playerCount,
            totalBets,
            totalWins,
            rtp: newRtp,
            status: newStatus,
            trend: JSON.stringify(nextTrend),
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      updated: updates.length,
      swaps: swapCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron update-rtp failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
