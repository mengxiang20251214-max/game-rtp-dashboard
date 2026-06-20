import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { serializeGame } from "@/lib/game-utils";

type Params = { params: { id: string } };

// PATCH /api/games/:id/rank  → 调整排名（权重排序，需登录）
// body: { rank: number }  或  { direction: "up" | "down" }
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

    // 方式一：上移/下移（与相邻游戏交换 rank）
    if (body.direction === "up" || body.direction === "down") {
      const isUp = body.direction === "up";
      const neighbor = await prisma.game.findFirst({
        where: isUp ? { rank: { lt: current.rank } } : { rank: { gt: current.rank } },
        orderBy: { rank: isUp ? "desc" : "asc" },
      });

      if (!neighbor) {
        // 已经在边界，无需移动
        return NextResponse.json({ ok: true, data: serializeGame(current) });
      }

      const [updated] = await prisma.$transaction([
        prisma.game.update({ where: { id: current.id }, data: { rank: neighbor.rank } }),
        prisma.game.update({ where: { id: neighbor.id }, data: { rank: current.rank } }),
      ]);

      return NextResponse.json({ ok: true, data: serializeGame(updated) });
    }

    // 方式二：直接设置 rank 值
    if (body.rank != null) {
      const game = await prisma.game.update({
        where: { id: params.id },
        data: { rank: Number(body.rank) },
      });
      return NextResponse.json({ ok: true, data: serializeGame(game) });
    }

    return NextResponse.json(
      { ok: false, error: "缺少 rank 或 direction 参数" },
      { status: 400 }
    );
  } catch (err) {
    console.error("PATCH /api/games/:id/rank error:", err);
    return NextResponse.json({ ok: false, error: "调整排名失败" }, { status: 500 });
  }
}
