import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/categories → 所有分类（含游戏数量）
export async function GET() {
  try {
    const cats = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { games: true } } },
    });
    const data = cats.map((c) => ({
      id: c.id,
      name: c.name,
      label: c.label,
      icon: c.icon,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      gameCount: c._count.games,
    }));
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("GET /api/admin/categories error:", err);
    return NextResponse.json({ ok: false, error: "获取分类失败" }, { status: 500 });
  }
}

// POST /api/admin/categories → 新增分类（需登录）
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });

    const body = await req.json();
    const name = (body.name ?? "").trim().toUpperCase();
    const label = (body.label ?? "").trim();
    if (!name || !label) {
      return NextResponse.json({ ok: false, error: "代码与显示名不能为空" }, { status: 400 });
    }

    const maxOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });
    const cat = await prisma.category.create({
      data: {
        name,
        label,
        icon: body.icon || null,
        sortOrder: body.sortOrder != null ? Number(body.sortOrder) : (maxOrder._max.sortOrder ?? 0) + 1,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json({ ok: true, data: cat }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/admin/categories error:", err);
    if (typeof err === "object" && err && "code" in err && err.code === "P2002") {
      return NextResponse.json({ ok: false, error: "分类代码已存在" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "创建分类失败" }, { status: 500 });
  }
}
