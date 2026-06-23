import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { deriveStatus, serializeGame, CATEGORY_VALUES } from "@/lib/game-utils";
import type { Category } from "@/types";

const VALID_CATEGORIES: Category[] = CATEGORY_VALUES;

type Params = { params: { id: string } };

// GET /api/games/:id  → 获取单个游戏
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const game = await prisma.game.findUnique({ where: { id: params.id } });
    if (!game) {
      return NextResponse.json({ ok: false, error: "游戏不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: serializeGame(game) });
  } catch (err) {
    console.error("GET /api/games/:id error:", err);
    return NextResponse.json({ ok: false, error: "获取游戏失败" }, { status: 500 });
  }
}

// PUT /api/games/:id  → 更新游戏（需登录）
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const existing = await prisma.game.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "游戏不存在" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.name != null) data.name = String(body.name).trim();
    if (body.category != null) {
      const requested = String(body.category).trim().toUpperCase();
      const catRow = await prisma.category.findUnique({ where: { name: requested } });
      if (catRow || VALID_CATEGORIES.includes(requested as Category)) {
        data.category = catRow ? catRow.name : requested;
        data.categoryId = catRow?.id ?? null;
      }
    }
    if (body.image !== undefined) data.image = body.image || null;
    if (body.rtp != null) data.rtp = Number(body.rtp);
    if (body.targetRtp != null) data.targetRtp = Number(body.targetRtp);
    if (body.playerCount != null) data.playerCount = Number(body.playerCount);
    if (body.totalBets != null) data.totalBets = Number(body.totalBets);
    if (body.totalWins != null) data.totalWins = Number(body.totalWins);
    if (Array.isArray(body.trend)) data.trend = JSON.stringify(body.trend);
    if (body.rank != null) data.rank = Number(body.rank);
    if (body.isActive != null) data.isActive = Boolean(body.isActive);
    if (body.description !== undefined) data.description = body.description || null;
    if (body.detailUrl !== undefined) data.detailUrl = body.detailUrl || null;
    if (body.seoTitle !== undefined) data.seoTitle = body.seoTitle || null;
    if (body.seoDescription !== undefined)
      data.seoDescription = body.seoDescription || null;
    if (body.seoKeywords !== undefined) data.seoKeywords = body.seoKeywords || null;

    // 若 rtp 或 targetRtp 变化，重新推导状态
    const nextRtp = (data.rtp as number) ?? existing.rtp;
    const nextTarget = (data.targetRtp as number) ?? existing.targetRtp;
    data.status = deriveStatus(nextRtp, nextTarget);

    const game = await prisma.game.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, data: serializeGame(game) });
  } catch (err: unknown) {
    console.error("PUT /api/games/:id error:", err);
    if (typeof err === "object" && err && "code" in err && err.code === "P2002") {
      return NextResponse.json({ ok: false, error: "游戏名称已存在" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "更新游戏失败" }, { status: 500 });
  }
}

// DELETE /api/games/:id  → 删除游戏（需登录）
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });
    }

    await prisma.game.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, data: { id: params.id } });
  } catch (err: unknown) {
    console.error("DELETE /api/games/:id error:", err);
    if (typeof err === "object" && err && "code" in err && err.code === "P2025") {
      return NextResponse.json({ ok: false, error: "游戏不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "删除游戏失败" }, { status: 500 });
  }
}
