import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

// GET /api/admin/games/smart-config/rollback
//   返回最近一次备份的元信息（供 UI 显示「将恢复到哪次」）。
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });
    }
    const last = await prisma.configBackup.findFirst({
      where: { kind: "smart-config" },
      orderBy: { createdAt: "desc" },
    });
    if (!last) {
      return NextResponse.json({ ok: true, data: { hasBackup: false } });
    }
    return NextResponse.json({
      ok: true,
      data: {
        hasBackup: true,
        backupId: last.id,
        createdAt: last.createdAt.toISOString(),
        gameCount: last.gameCount,
        operator: last.operator,
      },
    });
  } catch (err) {
    console.error("GET smart-config/rollback error:", err);
    return NextResponse.json({ ok: false, error: "读取备份失败" }, { status: 500 });
  }
}

// POST /api/admin/games/smart-config/rollback
//   恢复最近一次备份的展示字段（不恢复 name/slug/image/provider 等基础信息）。
//   body: { confirm: true }  —— 二次确认，避免误触。
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== true) {
      return NextResponse.json(
        { ok: false, error: "需要 confirm:true 确认后才能回滚" },
        { status: 400 }
      );
    }

    const last = await prisma.configBackup.findFirst({
      where: { kind: "smart-config" },
      orderBy: { createdAt: "desc" },
    });
    if (!last) {
      return NextResponse.json({ ok: false, error: "没有可恢复的备份" }, { status: 404 });
    }

    let items: SnapshotItem[] = [];
    try {
      items = JSON.parse(last.snapshot) as SnapshotItem[];
    } catch {
      return NextResponse.json({ ok: false, error: "备份数据损坏，无法解析" }, { status: 500 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: "备份内容为空" }, { status: 400 });
    }

    // 仅恢复仍存在的游戏的展示字段（基础信息 name/slug/image/provider/category 不动）。
    // 先一次性查出现存 ID，再用数组式事务批量更新（避免交互事务在连接池上超时）。
    const existingRows = await prisma.game.findMany({
      where: { id: { in: items.map((it) => it?.id).filter(Boolean) as string[] } },
      select: { id: true },
    });
    const existingIds = new Set(existingRows.map((r) => r.id));

    const ops = items
      .filter((it) => it?.id && existingIds.has(it.id))
      .map((it) =>
        prisma.game.update({
          where: { id: it.id },
          data: {
            rtp: it.rtp,
            targetRtp: it.targetRtp,
            status: it.status,
            playerCount: it.playerCount,
            totalBets: it.totalBets,
            totalWins: it.totalWins,
            featured: it.featured,
          },
        })
      );

    await prisma.$transaction(ops);
    const restored = ops.length;

    return NextResponse.json({
      ok: true,
      data: {
        rolledBack: true,
        backupId: last.id,
        backupAt: last.createdAt.toISOString(),
        restoredCount: restored,
        note: "已恢复上次备份的展示字段（基础信息未改动）。",
      },
    });
  } catch (err) {
    console.error("POST smart-config/rollback error:", err);
    return NextResponse.json({ ok: false, error: "回滚失败" }, { status: 500 });
  }
}
