import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveStatus, parseTrend } from "@/lib/game-utils";

// 不缓存，每次调用都实时执行
export const dynamic = "force-dynamic";

// 波动范围 ±2%
const FLUCTUATION_RANGE = 2;
// trend 保留的数据点数量
const TREND_POINTS = 12;

// 获取随机 RTP（在 targetRtp ± FLUCTUATION_RANGE 范围内）
function getRandomRtp(targetRtp: number): number {
  const min = Math.max(80, targetRtp - FLUCTUATION_RANGE);
  const max = Math.min(99.9, targetRtp + FLUCTUATION_RANGE);
  return Number((Math.random() * (max - min) + min).toFixed(1));
}

export async function GET(request: Request) {
  try {
    // 验证 Cron 请求（防止外部调用）。
    // Vercel 在设置了 CRON_SECRET 后会自动带上 Authorization: Bearer <CRON_SECRET>。
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const games = await prisma.game.findMany({
      select: { id: true, targetRtp: true, trend: true },
    });

    // 逐个更新 rtp + status（随 RTP 自动推导）+ trend（滚动追加新点，驱动迷你图）
    const updates = await Promise.all(
      games.map((game) => {
        const newRtp = getRandomRtp(game.targetRtp);
        const newStatus = deriveStatus(newRtp, game.targetRtp);
        const nextTrend = [...parseTrend(game.trend), newRtp].slice(-TREND_POINTS);
        return prisma.game.update({
          where: { id: game.id },
          data: {
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
