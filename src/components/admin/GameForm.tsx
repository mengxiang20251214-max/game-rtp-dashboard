"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Game } from "@/types";
import { CATEGORY_OPTIONS } from "@/lib/game-utils";

type FormState = {
  name: string;
  category: Category;
  image: string;
  rtp: string;
  targetRtp: string;
  playerCount: string;
  totalBets: string;
  totalWins: string;
  rank: string;
  isActive: boolean;
  description: string;
};

function toFormState(game?: Game): FormState {
  return {
    name: game?.name ?? "",
    category: game?.category ?? "SLOT",
    image: game?.image ?? "",
    rtp: game ? String(game.rtp) : "0",
    targetRtp: game ? String(game.targetRtp) : "96.5",
    playerCount: game ? String(game.playerCount) : "0",
    totalBets: game ? String(game.totalBets) : "0",
    totalWins: game ? String(game.totalWins) : "0",
    rank: game ? String(game.rank) : "0",
    isActive: game?.isActive ?? true,
    description: game?.description ?? "",
  };
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-content-primary outline-none transition-all focus:border-neon-blue focus:shadow-neon-blue";
const labelCls = "mb-1.5 block text-xs text-content-secondary";

export default function GameForm({ game }: { game?: Game }) {
  const router = useRouter();
  const isEdit = Boolean(game);
  const [form, setForm] = useState<FormState>(() => toFormState(game));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("游戏名称不能为空");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      image: form.image.trim() || null,
      rtp: Number(form.rtp) || 0,
      targetRtp: Number(form.targetRtp) || 0,
      playerCount: Number(form.playerCount) || 0,
      totalBets: Number(form.totalBets) || 0,
      totalWins: Number(form.totalWins) || 0,
      rank: Number(form.rank) || 0,
      isActive: form.isActive,
      description: form.description.trim() || null,
    };

    try {
      const res = await fetch(isEdit ? `/api/games/${game!.id}` : "/api/games", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "保存失败");
        setSaving(false);
        return;
      }
      router.push("/admin/games");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("网络错误，请重试");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-rtp-danger/30 bg-rtp-danger/10 px-4 py-2 text-sm text-rtp-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>游戏名称 *</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="例如：赛博之轮"
          />
        </div>

        <div>
          <label className={labelCls}>分类</label>
          <select
            className={inputCls}
            value={form.category}
            onChange={(e) => update("category", e.target.value as Category)}
          >
            {CATEGORY_OPTIONS.filter((o) => o.value !== "ALL").map((o) => (
              <option key={o.value} value={o.value} className="bg-bg-card">
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>图片 URL</label>
          <input
            className={inputCls}
            value={form.image}
            onChange={(e) => update("image", e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div>
          <label className={labelCls}>当前 RTP (%)</label>
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={form.rtp}
            onChange={(e) => update("rtp", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>目标 RTP (%)</label>
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={form.targetRtp}
            onChange={(e) => update("targetRtp", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>玩家数</label>
          <input
            type="number"
            className={inputCls}
            value={form.playerCount}
            onChange={(e) => update("playerCount", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>排名权重（越小越靠前）</label>
          <input
            type="number"
            className={inputCls}
            value={form.rank}
            onChange={(e) => update("rank", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>总投注</label>
          <input
            type="number"
            className={inputCls}
            value={form.totalBets}
            onChange={(e) => update("totalBets", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>总赢额</label>
          <input
            type="number"
            className={inputCls}
            value={form.totalWins}
            onChange={(e) => update("totalWins", e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>描述</label>
          <textarea
            className={`${inputCls} min-h-[72px] resize-y`}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="游戏简介…"
          />
        </div>

        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => update("isActive", e.target.checked)}
            className="h-4 w-4 accent-neon-blue"
          />
          <span className="text-sm text-content-secondary">
            激活（前台展示此游戏）
          </span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-neon-blue/40 bg-neon-blue/10 px-6 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-neon-blue transition-all hover:bg-neon-blue/20 hover:shadow-neon-blue disabled:opacity-50"
        >
          {saving ? "保存中…" : isEdit ? "更新游戏" : "创建游戏"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/games")}
          className="rounded-lg border border-white/10 px-6 py-2.5 text-sm text-content-secondary transition-all hover:text-content-primary"
        >
          取消
        </button>
      </div>
    </form>
  );
}
