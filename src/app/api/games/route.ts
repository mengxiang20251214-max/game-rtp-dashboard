import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { deriveStatus, serializeGame, CATEGORY_VALUES } from "@/lib/game-utils";
import { computeRankings, toRankInput } from "@/lib/ranking";
import type { Category } from "@/types";

const VALID_CATEGORIES: Category[] = CATEGORY_VALUES;

// GET /api/games?category=SLOT  → 已排好序的游戏列表（含 heatTier / delta）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const includeInactive = searchParams.get("all") === "true";

    const where: Record<string, unknown> = {};
    if (!includeInactive) where.isActive = true;

    const records = await prisma.game.findMany({ where });

    // 两段式算分排序（全量），单一权威
    const rankResults = computeRankings(
      records.map((g) => toRankInput(g as Record<string, unknown>))
    );
    const rankMap = new Map(rankResults.map((r) => [r.id, r]));

    records.sort(
      (a, b) => (rankMap.get(a.id)?.rank ?? 999) - (rankMap.get(b.id)?.rank ?? 999)
    );

    const filtered =
      category && VALID_CATEGORIES.includes(category as Category)
        ? records.filter((g) => g.category === category)
        : records;

    return NextResponse.json({
      ok: true,
      data: filtered.map((g) => {
        const r = rankMap.get(g.id);
        return {
          ...serializeGame(g),
          rtp: r?.currentRtp ?? g.rtp,
          rank: r?.rank ?? g.rank,
          delta: r?.delta ?? 0,
          heatTier: r?.heatTier ?? "normal",
          isNew: r?.isNew ?? false,
        };
      }),
    });
  } catch (err) {
    console.error("GET /api/games error:", err);
    return NextResponse.json({ ok: false, error: "获取游戏列表失败" }, { status: 500 });
  }
}

// POST /api/games  → 添加游戏（需登录）
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const name = (body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "游戏名称不能为空" }, { status: 400 });
    }

    const requested = String(body.category ?? "").trim().toUpperCase();
    const catRow =
      (requested && (await prisma.category.findUnique({ where: { name: requested } }))) || null;
    const category: string = catRow
      ? catRow.name
      : VALID_CATEGORIES.includes(requested as Category)
        ? requested
        : "SLOT";

    const rtp = Number(body.rtp ?? 0);
    const targetRtp = Number(body.targetRtp ?? 96.5);

    const maxRank = await prisma.game.aggregate({ _max: { rank: true } });
    const rank = (maxRank._max.rank ?? 0) + 1;

    const pinned = Boolean(body.pinned);
    // 新置顶游戏默认排到置顶区末尾
    let pinOrder = 0;
    if (pinned) {
      const maxPin = await prisma.game.aggregate({
        where: { pinned: true },
        _max: { pinOrder: true },
      });
      pinOrder = (maxPin._max.pinOrder ?? 0) + 1;
    }

    const game = await prisma.game.create({
      data: {
        name,
        category,
        categoryId: catRow?.id ?? null,
        image: body.image || null,
        rtp,
        targetRtp,
        status: deriveStatus(rtp, targetRtp),
        playerCount: Number(body.playerCount ?? 0),
        totalBets: Number(body.totalBets ?? 0),
        totalWins: Number(body.totalWins ?? 0),
        trend: JSON.stringify(Array.isArray(body.trend) ? body.trend : []),
        rank,
        pinned,
        pinOrder,
        featured: Boolean(body.featured),
        rankWeight: pinned ? pinOrder : 0,  // legacy 同步
        isActive: body.isActive ?? true,
        description: body.description || null,
        detailUrl: body.detailUrl || null,
        seoTitle: body.seoTitle || null,
        seoDescription: body.seoDescription || null,
        seoKeywords: body.seoKeywords || null,
      },
    });

    return NextResponse.json({ ok: true, data: serializeGame(game) }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/games error:", err);
    if (typeof err === "object" && err && "code" in err && err.code === "P2002") {
      return NextResponse.json({ ok: false, error: "游戏名称已存在" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "创建游戏失败" }, { status: 500 });
  }
}
