import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 统一中间件：
// 1) 把当前路径写入请求头 x-pathname，供 i18n/request.ts 区分前台/后台
//    （手动实现而非 withAuth，因 withAuth 会对 signIn 页特殊处理、跳过该逻辑）
// 2) 保护 /admin（登录页除外）：无有效 JWT 则重定向到登录页
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({ request: { headers } });
}

// 匹配除 api / 静态资源外的所有页面（前台页面也需拿到 x-pathname）
export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
