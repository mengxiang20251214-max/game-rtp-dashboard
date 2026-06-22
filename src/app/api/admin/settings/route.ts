import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/settings → 所有站点设置（key→{value,type}）
export async function GET() {
  try {
    const rows = await prisma.siteSetting.findMany();
    return NextResponse.json({ ok: true, data: rows });
  } catch (err) {
    console.error("GET /api/admin/settings error:", err);
    return NextResponse.json({ ok: false, error: "获取设置失败" }, { status: 500 });
  }
}

// PUT /api/admin/settings → 批量 upsert（需登录）
// body: { settings: [{ key, value, type? }] }
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });

    const body = await req.json();
    const items = Array.isArray(body.settings) ? body.settings : [];
    if (items.length === 0) {
      return NextResponse.json({ ok: false, error: "无可更新的设置" }, { status: 400 });
    }

    for (const item of items) {
      const key = String(item.key ?? "").trim();
      if (!key) continue;
      const value = String(item.value ?? "");
      const type = item.type === "image" ? "image" : "text";
      await prisma.siteSetting.upsert({
        where: { key },
        create: { key, value, type },
        update: { value, type },
      });
    }

    const rows = await prisma.siteSetting.findMany();
    return NextResponse.json({ ok: true, data: rows });
  } catch (err) {
    console.error("PUT /api/admin/settings error:", err);
    return NextResponse.json({ ok: false, error: "保存设置失败" }, { status: 500 });
  }
}
