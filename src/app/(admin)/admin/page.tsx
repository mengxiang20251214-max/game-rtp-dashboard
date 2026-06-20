import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeGame, formatNumber, formatRtp } from "@/lib/game-utils";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const records = await prisma.game.findMany();
  const games = records.map(serializeGame);

  const total = games.length;
  const active = games.filter((g) => g.isActive).length;
  const warning = games.filter((g) => g.status !== "NORMAL").length;
  const players = games.reduce((s, g) => s + g.playerCount, 0);
  const avgRtp =
    total > 0 ? games.reduce((s, g) => s + g.rtp, 0) / total : 0;
  const totalBets = games.reduce((s, g) => s + g.totalBets, 0);

  const stats = [
    { label: "游戏总数", value: String(total), accent: "text-neon-blue" },
    { label: "激活中", value: String(active), accent: "text-rtp-success" },
    { label: "异常 / 预警", value: String(warning), accent: "text-rtp-warning" },
    { label: "总玩家数", value: formatNumber(players), accent: "text-neon-pink" },
    { label: "平均 RTP", value: formatRtp(avgRtp), accent: "text-neon-purple" },
    { label: "总投注额", value: formatNumber(totalBets), accent: "text-content-primary" },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-content-primary">概览</h1>
          <p className="mt-1 text-sm text-content-secondary">后台数据总览</p>
        </div>
        <Link
          href="/admin/games/new"
          className="rounded-lg border border-neon-blue/40 bg-neon-blue/10 px-4 py-2 font-display text-sm font-semibold text-neon-blue transition-all hover:shadow-neon-blue"
        >
          + 添加游戏
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/10 bg-bg-card/60 p-5"
          >
            <p className="text-xs uppercase tracking-wider text-content-secondary">
              {s.label}
            </p>
            <p className={`mt-2 font-display text-2xl font-bold ${s.accent}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href="/admin/games"
          className="text-sm text-neon-blue hover:underline"
        >
          前往游戏管理 →
        </Link>
      </div>
    </div>
  );
}
