import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

// PUT /api/admin/categories/:id → 更新分类（需登录）
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name != null) data.name = String(body.name).trim().toUpperCase();
    if (body.label != null) data.label = String(body.label).trim();
    if (body.icon !== undefined) data.icon = body.icon || null;
    if (body.sortOrder != null) data.sortOrder = Number(body.sortOrder);
    if (body.isActive != null) data.isActive = Boolean(body.isActive);

    const cat = await prisma.category.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, data: cat });
  } catch (err: unknown) {
    console.error("PUT /api/admin/categories/:id error:", err);
    if (typeof err === "object" && err && "code" in err) {
      if (err.code === "P2002")
        return NextResponse.json({ ok: false, error: "分类代码已存在" }, { status: 409 });
      if (err.code === "P2025")
        return NextResponse.json({ ok: false, error: "分类不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "更新分类失败" }, { status: 500 });
  }
}

// DELETE /api/admin/categories/:id → 删除分类（有游戏关联时拒绝，需登录）
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });

    const cat = await prisma.category.findUnique({ where: { id: params.id } });
    if (!cat) return NextResponse.json({ ok: false, error: "分类不存在" }, { status: 404 });

    // 关联检查：categoryId 外键 或 旧的 category 字符串
    const count = await prisma.game.count({
      where: { OR: [{ categoryId: params.id }, { category: cat.name }] },
    });
    if (count > 0) {
      return NextResponse.json(
        { ok: false, error: `该分类下有 ${count} 个游戏，无法删除` },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, data: { id: params.id } });
  } catch (err) {
    console.error("DELETE /api/admin/categories/:id error:", err);
    return NextResponse.json({ ok: false, error: "删除分类失败" }, { status: 500 });
  }
}
