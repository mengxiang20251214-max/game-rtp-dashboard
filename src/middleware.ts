import { withAuth } from "next-auth/middleware";

// 保护后台路由（登录页 /admin/login 不在 matcher 中，可匿名访问）
export default withAuth({
  pages: {
    signIn: "/admin/login",
  },
});

export const config = {
  matcher: ["/admin", "/admin/games/:path*"],
};
