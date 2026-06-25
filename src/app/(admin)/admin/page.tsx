import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { serializeGame, formatNumber, formatRtp } from "@/lib/game-utils";
import SmartConfigPanel from "@/components/admin/SmartConfigPanel";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const t = await getTranslations("admin.overview");
  const records = await prisma.game.findMany();
  const games = records.map(serializeGame);

  // 智能运营配置：最近一次备份元信息（用于「恢复上次备份」按钮可用态）
  const lastBackup = await prisma.configBackup.findFirst({
    where: { kind: "smart-config" },
    orderBy: { createdAt: "desc" },
  });
  const initialBackup = lastBackup
    ? {
        hasBackup: true,
        backupId: lastBackup.id,
        createdAt: lastBackup.createdAt.toISOString(),
        gameCount: lastBackup.gameCount,
        operator: lastBackup.operator,
      }
    : { hasBackup: false };

  const total = games.length;
  const active = games.filter((g) => g.isActive).length;
  // 正向运营指标：HOT 焦点游戏数量（不再统计「异常/预警」）。
  const featured = games.filter((g) => g.featured).length;
  const players = games.reduce((s, g) => s + g.playerCount, 0);
  const avgRtp =
    total > 0 ? games.reduce((s, g) => s + g.rtp, 0) / total : 0;
  const totalBets = games.reduce((s, g) => s + g.totalBets, 0);

  const stats = [
    { label: t("totalGames"), value: String(total), accent: "text-neon-blue" },
    { label: t("active"), value: String(active), accent: "text-rtp-success" },
    { label: t("warning"), value: String(featured), accent: "text-neon-gold" },
    { label: t("totalPlayers"), value: formatNumber(players), accent: "text-neon-pink" },
    { label: t("avgRtp"), value: formatRtp(avgRtp), accent: "text-neon-purple" },
    { label: t("totalBets"), value: formatNumber(totalBets), accent: "text-content-primary" },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-content-primary">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-content-secondary">{t("subtitle")}</p>
        </div>
        <Link
          href="/admin/games/new"
          className="rounded-lg border border-neon-blue/40 bg-neon-blue/10 px-4 py-2 font-display text-sm font-semibold text-neon-blue transition-all hover:shadow-neon-blue"
        >
          {t("addGame")}
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
          {t("goToGames")}
        </Link>
      </div>

      {/* 智能运营配置（一键生成真实感模拟运营数据） */}
      <SmartConfigPanel initialBackup={initialBackup} />
    </div>
  );
}
