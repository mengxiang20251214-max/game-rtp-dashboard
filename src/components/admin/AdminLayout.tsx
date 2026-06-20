"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/admin", label: "概览", exact: true },
  { href: "/admin/games", label: "游戏管理", exact: false },
  { href: "/admin/games/new", label: "添加游戏", exact: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 登录页不套用后台布局
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-bg-secondary/60 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-neon-purple/50 bg-neon-purple/10">
            <span className="font-display text-sm font-bold text-neon-purple">R</span>
          </div>
          <span className="font-display text-sm font-bold text-content-primary">
            后台管理
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm transition-all ${
                isActive(item.href, item.exact)
                  ? "bg-neon-blue/10 text-neon-blue ring-1 ring-neon-blue/30"
                  : "text-content-secondary hover:bg-white/5 hover:text-content-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            className="mb-2 block rounded-lg px-3 py-2 text-sm text-content-secondary transition-all hover:bg-white/5 hover:text-content-primary"
          >
            ← 返回前台
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-full rounded-lg border border-rtp-danger/30 px-3 py-2 text-sm text-rtp-danger transition-all hover:bg-rtp-danger/10"
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
