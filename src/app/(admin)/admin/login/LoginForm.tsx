"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("密码错误，请重试");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-bg-card/80 p-8 shadow-card backdrop-blur-xl"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-neon-blue/50 bg-neon-blue/10 shadow-neon-blue">
            <span className="font-display text-xl font-bold text-neon-blue">R</span>
          </div>
          <h1 className="font-display text-xl font-bold text-content-primary">
            后台登录
          </h1>
          <p className="mt-1 text-xs text-content-secondary">
            请输入管理员密码以继续
          </p>
        </div>

        <label className="mb-1.5 block text-xs text-content-secondary">密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          placeholder="••••••••"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-content-primary outline-none transition-all focus:border-neon-blue focus:shadow-neon-blue"
        />

        {error && <p className="mt-2 text-xs text-rtp-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-5 w-full rounded-lg border border-neon-blue/40 bg-neon-blue/10 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-neon-blue transition-all hover:bg-neon-blue/20 hover:shadow-neon-blue disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "登录中…" : "登录"}
        </button>

        <p className="mt-4 text-center text-[11px] text-content-secondary">
          默认密码：<span className="text-content-primary">admin123</span>
        </p>
      </form>
    </div>
  );
}
