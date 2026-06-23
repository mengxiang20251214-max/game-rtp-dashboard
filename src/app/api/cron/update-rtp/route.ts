import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveStatus, parseTrend } from "@/lib/game-utils";
import { computeRankings } from "@/lib/ranking";

export const dynamic = "force-dynamic";

const TREND_POINTS = 12;

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
        rank: true,          // current rank = prevRank for next cycle
        targetRtp: true,
        trend: true,
        playerCount: true,
        totalBets: true,
        totalWins: true,
        initialPlayerCount: true,
        initialTotalBets: true,
        initialTotalWins: true,
      },
    });
    if (games.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    // Step 1: Update metrics (playerCount, totalBets, totalWins)
    // RTP is derived from totalWins/totalBets — no separate random RTP
    const updated = await Promise.all(
      games.map((g) => {
        const playerCountFactor = 0.9  + Math.random() * 0.2;   // ±10%
        const betsFactor        = 0.95 + Math.random() * 0.1;   // ±5%
        const winFactor         = 0.88 + Math.random() * 0.11;  // 88–99% of bets

        const basePlayers = g.initialPlayerCount || g.playerCount || 0;
        const baseBets    = g.initialTotalBets   || g.totalBets   || 0;

        const playerCount = Math.max(0, Math.round(basePlayers * playerCountFactor));
        const totalBets   = Math.round(baseBets * betsFactor);
        const totalWins   = Math.round(totalBets * winFactor);

        // RTP derived from actual win/bet ratio
        const newRtp      = totalBets > 0 ? (totalWins / totalBets) * 100 : g.targetRtp;
        const newStatus   = deriveStatus(newRtp, g.targetRtp);
        const nextTrend   = [...parseTrend(g.trend), Math.round(newRtp * 10) / 10].slice(-TREND_POINTS);

        return prisma.game.update({
          where: { id: g.id },
          data: {
            playerCount,
            totalBets,
            totalWins,
            rtp: Math.round(newRtp * 100) / 100,
            status: newStatus,
            trend: JSON.stringify(nextTrend),
          },
        });
      })
    );

    // Step 2: Re-fetch updated metrics + rankWeight for scoring
    const fresh = await prisma.game.findMany({
      select: {
        id: true,
        rank: true,
        playerCount: true,
        totalBets: true,
        totalWins: true,
        targetRtp: true,
      },
    });

    const rankResults = computeRankings(
      fresh.map((g) => ({
        id: g.id,
        rankWeight: (g as Record<string, unknown>).rankWeight as number ?? 0,
        playerCount: g.playerCount,
        totalBets: g.totalBets,
        totalWins: g.totalWins,
        targetRtp: g.targetRtp,
        prevRank: g.rank,  // current stored rank becomes prevRank
      }))
    );

    // Step 3: Write new rank + prevRank back to DB
    await Promise.all(
      rankResults.map((r) => {
        const prev = fresh.find((g) => g.id === r.id)?.rank ?? 0;
        return prisma.game.update({
          where: { id: r.id },
          data: { rank: r.rank, prevRank: prev } as Record<string, unknown>,
        });
      })
    );

    return NextResponse.json({
      success: true,
      updated: updated.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron update-rtp failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
