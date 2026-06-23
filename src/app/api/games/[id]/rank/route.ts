import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { serializeGame } from "@/lib/game-utils";

type Params = { params: { id: string } };

// PATCH /api/games/:id/rank  → 调整置顶区顺序（仅对 pinned 游戏，需登录）
// body: { direction: "up" | "down" }
// 在置顶区内与相邻的 pinned 游戏交换 pinOrder（同步 rankWeight）。
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const current = await prisma.game.findUnique({ where: { id: params.id } });
    if (!current) {
      return NextResponse.json({ ok: false, error: "游戏不存在" }, { status: 404 });
    }

    const cur = current as Record<string, unknown>;
    if (!(cur.pinned as boolean)) {
      return NextResponse.json(
        { ok: false, error: "仅置顶游戏可调整顺序" },
        { status: 400 }
      );
    }

    if (body.direction !== "up" && body.direction !== "down") {
      return NextResponse.json({ ok: false, error: "缺少 direction 参数" }, { status: 400 });
    }

    const isUp = body.direction === "up";
    const curOrder = (cur.pinOrder as number) ?? 0;

    // 在置顶区内找相邻游戏（up=pinOrder 更小的最近一个，down=更大的最近一个）
    const neighbor = await prisma.game.findFirst({
      where: {
        pinned: true,
        pinOrder: isUp ? { lt: curOrder } : { gt: curOrder },
      },
      orderBy: { pinOrder: isUp ? "desc" : "asc" },
    });

    if (!neighbor) {
      return NextResponse.json({ ok: true, data: serializeGame(current) });
    }

    const nb = neighbor as Record<string, unknown>;
    const nbOrder = (nb.pinOrder as number) ?? 0;

    const [updated] = await prisma.$transaction([
      prisma.game.update({
        where: { id: current.id },
        data: { pinOrder: nbOrder, rankWeight: nbOrder } as Record<string, unknown>,
      }),
      prisma.game.update({
        where: { id: neighbor.id },
        data: { pinOrder: curOrder, rankWeight: curOrder } as Record<string, unknown>,
      }),
    ]);

    return NextResponse.json({ ok: true, data: serializeGame(updated) });
  } catch (err) {
    console.error("PATCH /api/games/:id/rank error:", err);
    return NextResponse.json({ ok: false, error: "调整排名失败" }, { status: 500 });
  }
}
