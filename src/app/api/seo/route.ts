import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/seo            → 所有页面 SEO 配置
// GET /api/seo?key=home   → 指定 key 的配置
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (key) {
      const config = await prisma.seoConfig.findUnique({ where: { key } });
      return NextResponse.json({ ok: true, data: config });
    }

    const configs = await prisma.seoConfig.findMany({ orderBy: { key: "asc" } });
    return NextResponse.json({ ok: true, data: configs });
  } catch (err) {
    console.error("GET /api/seo error:", err);
    return NextResponse.json({ ok: false, error: "获取 SEO 配置失败" }, { status: 500 });
  }
}

// POST /api/seo  → 按 key 创建或更新页面 SEO（需登录，upsert）
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const key = (body.key ?? "").trim();
    if (!key) {
      return NextResponse.json({ ok: false, error: "key 不能为空" }, { status: 400 });
    }

    const fields = {
      title: body.title || null,
      description: body.description || null,
      keywords: body.keywords || null,
      ogImage: body.ogImage || null,
    };

    const config = await prisma.seoConfig.upsert({
      where: { key },
      create: { key, ...fields },
      update: fields,
    });

    return NextResponse.json({ ok: true, data: config });
  } catch (err) {
    console.error("POST /api/seo error:", err);
    return NextResponse.json({ ok: false, error: "保存 SEO 配置失败" }, { status: 500 });
  }
}

// DELETE /api/seo?key=home  → 删除指定页面 SEO 配置（需登录）
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) {
      return NextResponse.json({ ok: false, error: "缺少 key 参数" }, { status: 400 });
    }

    await prisma.seoConfig.delete({ where: { key } });
    return NextResponse.json({ ok: true, data: { key } });
  } catch (err: unknown) {
    console.error("DELETE /api/seo error:", err);
    if (typeof err === "object" && err && "code" in err && err.code === "P2025") {
      return NextResponse.json({ ok: false, error: "配置不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "删除 SEO 配置失败" }, { status: 500 });
  }
}
