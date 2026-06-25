import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { deriveStatus } from "@/lib/game-utils";
import {
  generateSmartConfig,
  summarize,
  type SmartConfigGame,
} from "@/lib/game-smart-config";

export const dynamic = "force-dynamic";

// 备份快照里保存的展示字段（回滚时据此恢复，绝不含 name/slug/image/provider）
interface SnapshotItem {
  id: string;
  rtp: number;
  targetRtp: number;
  status: string;
  playerCount: number;
  totalBets: number;
  totalWins: number;
  featured: boolean;
}

function toConfigGame(g: {
  id: string; name: string; category: string; rtp: number; targetRtp: number;
  playerCount: number; totalBets: number; totalWins: number;
  featured: boolean | null; pinned: boolean | null; createdAt: Date;
}): SmartConfigGame {
  return {
    id: g.id, name: g.name, category: g.category,
    rtp: g.rtp, targetRtp: g.targetRtp,
    playerCount: g.playerCount, totalBets: g.totalBets, totalWins: g.totalWins,
    featured: g.featured ?? false, pinned: g.pinned ?? false, createdAt: g.createdAt,
  };
}

// POST /api/admin/games/smart-config/apply
//   1) 鉴权  2) 读当前游戏  3) 先自动备份当前展示字段  4) 生成并批量写入  5) 返回摘要
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });
    }

    const records = await prisma.game.findMany();
    if (records.length === 0) {
      return NextResponse.json({ ok: false, error: "暂无游戏数据" }, { status: 400 });
    }

    // ── 写库前自动备份当前展示字段 ──
    const snapshot: SnapshotItem[] = records.map((g) => ({
      id: g.id,
      rtp: g.rtp,
      targetRtp: g.targetRtp,
      status: g.status,
      playerCount: g.playerCount,
      totalBets: g.totalBets,
      totalWins: g.totalWins,
      featured: (g as { featured?: boolean }).featured ?? false,
    }));
    const operator =
      (session.user?.name as string | undefined) ||
      (session.user?.email as string | undefined) ||
      "admin";

    const games = records.map((g) => toConfigGame(g as never));
    const results = generateSmartConfig(games);
    const resById = new Map(results.map((r) => [r.id, r]));

    // ── 备份 + 批量更新放进同一原子事务（写库前必有备份） ──
    // 用「数组式事务」而非交互式回调：单次批处理往返，避免在 Neon 连接池上
    // 54 次串行 update 触发交互事务的空闲超时（Transaction not found）。
    // 备份 create 放数组首位，保证「先备份再更新」的原子性。
    const ops = [
      prisma.configBackup.create({
        data: {
          kind: "smart-config",
          gameCount: records.length,
          operator,
          snapshot: JSON.stringify(snapshot),
        },
      }),
      ...records
        .map((g) => {
          const r = resById.get(g.id);
          if (!r) return null;
          return prisma.game.update({
            where: { id: g.id },
            data: {
              rtp: r.rtp,
              targetRtp: r.targetRtp,
              status: deriveStatus(r.rtp, r.targetRtp),
              playerCount: r.playerCount,
              totalBets: r.totalBets,
              totalWins: r.totalWins,
              featured: r.featured,
            },
          });
        })
        .filter((op): op is NonNullable<typeof op> => op !== null),
    ];

    const txResult = await prisma.$transaction(ops);
    const backup = txResult[0] as { id: string; createdAt: Date };
    // ops[0] 是备份 create，其余为游戏 update —— 实际更新数量 = ops 总数 − 1
    const updatedCount = ops.length - 1;

    const summary = summarize(games, results);

    return NextResponse.json({
      ok: true,
      data: {
        applied: true,
        backupId: backup.id,
        backupAt: backup.createdAt.toISOString(),
        operator,
        // 全量处理：读全部 → 备份全部 → 更新全部（totalGames 来自 summary，与此一致）
        backupCount: records.length,
        updatedCount,
        note: "已写入「真实感模拟运营配置」（非真实第三方平台数据）。应用前已自动备份。",
        ...summary,
      },
    });
  } catch (err) {
    console.error("POST smart-config/apply error:", err);
    return NextResponse.json({ ok: false, error: "应用配置失败" }, { status: 500 });
  }
}
