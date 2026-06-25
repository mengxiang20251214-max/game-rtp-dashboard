import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  generateSmartConfig,
  summarize,
  diffChanges,
  type SmartConfigGame,
} from "@/lib/game-smart-config";

export const dynamic = "force-dynamic";

// 把 Prisma 记录映射为核心模块输入（只取需要的字段，不改基础信息）
function toConfigGame(g: {
  id: string; name: string; category: string; rtp: number; targetRtp: number;
  playerCount: number; totalBets: number; totalWins: number;
  featured: boolean | null; pinned: boolean | null; createdAt: Date;
}): SmartConfigGame {
  return {
    id: g.id,
    name: g.name,
    category: g.category,
    rtp: g.rtp,
    targetRtp: g.targetRtp,
    playerCount: g.playerCount,
    totalBets: g.totalBets,
    totalWins: g.totalWins,
    featured: g.featured ?? false,
    pinned: g.pinned ?? false,
    createdAt: g.createdAt,
  };
}

// POST /api/admin/games/smart-config/preview
//   dry-run：生成「真实感模拟运营配置」预览，不写数据库。
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });
    }

    const records = await prisma.game.findMany();
    const games = records.map((g) => toConfigGame(g as never));

    if (games.length === 0) {
      return NextResponse.json({ ok: false, error: "暂无游戏数据" }, { status: 400 });
    }

    const results = generateSmartConfig(games);
    const summary = summarize(games, results);
    // 表格仅展示前 10 个变化，但实际应用会更新全部游戏
    const changes = diffChanges(games, results, 10);

    return NextResponse.json({
      ok: true,
      data: {
        dryRun: true,
        note: "真实感模拟运营配置（非真实第三方平台数据）。此为预览，未写入数据库。",
        // 摘要基于全部游戏；下表只展示前 10 个变化，实际应用会更新全部 willUpdateCount 个游戏
        willUpdateCount: results.length,
        previewChangesShown: changes.length,
        ...summary,
        changes,
      },
    });
  } catch (err) {
    console.error("POST smart-config/preview error:", err);
    return NextResponse.json({ ok: false, error: "生成预览失败" }, { status: 500 });
  }
}
