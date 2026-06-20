"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Game } from "@/types";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  rtpColor,
  formatRtp,
  formatPlayers,
} from "@/lib/game-utils";

export default function GameTable({ initialGames }: { initialGames: Game[] }) {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>(initialGames);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleRank(id: string, direction: "up" | "down") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/games/${id}/rank`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const json = await res.json();
      if (json.ok) await reload();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`确认删除游戏「${name}」？此操作不可撤销。`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/games/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        setGames((gs) => gs.filter((g) => g.id !== id));
      } else {
        alert(json.error || "删除失败");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function reload() {
    const res = await fetch("/api/games?all=true", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setGames(json.data as Game[]);
    router.refresh();
  }

  if (games.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 py-16 text-center text-content-secondary">
        暂无游戏，去
        <Link href="/admin/games/new" className="mx-1 text-neon-blue hover:underline">
          添加一个
        </Link>
        吧
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-content-secondary">
            <th className="px-4 py-3">排名</th>
            <th className="px-4 py-3">名称</th>
            <th className="px-4 py-3">分类</th>
            <th className="px-4 py-3">RTP / 目标</th>
            <th className="px-4 py-3">状态</th>
            <th className="px-4 py-3">玩家</th>
            <th className="px-4 py-3">显示</th>
            <th className="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => {
            const color = rtpColor(g.status);
            const busy = busyId === g.id;
            return (
              <tr
                key={g.id}
                className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                  busy ? "opacity-50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="font-display text-content-primary">#{g.rank}</span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleRank(g.id, "up")}
                        disabled={busy}
                        className="text-content-secondary hover:text-neon-blue"
                        title="上移"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleRank(g.id, "down")}
                        disabled={busy}
                        className="text-content-secondary hover:text-neon-blue"
                        title="下移"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-content-primary">{g.name}</td>
                <td className="px-4 py-3 text-content-secondary">
                  {CATEGORY_LABELS[g.category]}
                </td>
                <td className="px-4 py-3">
                  <span style={{ color }} className="font-display font-semibold">
                    {formatRtp(g.rtp)}
                  </span>
                  <span className="text-content-secondary"> / {formatRtp(g.targetRtp)}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs"
                    style={{ color }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: color }}
                    />
                    {STATUS_LABELS[g.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-content-secondary">
                  {formatPlayers(g.playerCount)}
                </td>
                <td className="px-4 py-3">
                  {g.isActive ? (
                    <span className="text-rtp-success">●</span>
                  ) : (
                    <span className="text-content-secondary">○</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/games/${g.id}/edit`}
                      className="rounded-md border border-white/10 px-3 py-1 text-xs text-content-secondary transition-all hover:border-neon-blue/40 hover:text-neon-blue"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(g.id, g.name)}
                      disabled={busy}
                      className="rounded-md border border-rtp-danger/30 px-3 py-1 text-xs text-rtp-danger transition-all hover:bg-rtp-danger/10"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
