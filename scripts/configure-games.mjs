// 一次性配置脚本：把现有所有游戏自动分布到不同热度档（爆款/热门/普通/冷门），
// 并写入可信的玩家数/总投注/RTP 数值。只改这些字段，保留游戏名/图片/分类/链接/手动置顶。
//
// 用法（在项目根目录运行，把线上 Neon 连接串临时传给本次命令）：
//   DATABASE_URL="postgres://...你的neon..." node scripts/configure-games.mjs
//
// 先预览不写库：
//   DRY_RUN=1 DATABASE_URL="postgres://..." node scripts/configure-games.mjs
//
// 只配置某分类（可选）：
//   ONLY_CATEGORY=SLOT DATABASE_URL="postgres://..." node scripts/configure-games.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY = process.env.DRY_RUN === "1";
const ONLY = (process.env.ONLY_CATEGORY || "").trim().toUpperCase();

// 数值区间（印尼盾场景，金额较大；玩家数从热到冷递减）
const PLAYERS_TOP = 13200;   // 最热玩家数
const PLAYERS_MIN = 320;     // 普通段最低
const COLD_PLAYERS_MAX = 48; // 冷门：强制 < 50（系统据此判冷）
const BETS_TOP = 5_200_000_000; // Rp 5.2 miliar
const BETS_MIN = 6_500_000;     // Rp 6.5 juta

const rand = (min, max) => min + Math.random() * (max - min);
const jitter = (v, pct = 0.06) => Math.round(v * (1 + (Math.random() - 0.5) * 2 * pct));
// 平滑递减曲线（ease-in-out），frac: 0=最热 .. 1=最冷
const curve = (frac) => {
  const e = frac < 0.5 ? 2 * frac * frac : 1 - Math.pow(-2 * frac + 2, 2) / 2;
  return e;
};
const lerp = (a, b, t) => a + (b - a) * t;

function tierOf(frac) {
  if (frac <= 0.0001) return "blazing"; // 榜首（同时设 featured）
  if (frac <= 0.30) return "hot";
  if (frac >= 0.80) return "cold";
  return "normal";
}

async function main() {
  const where = { isActive: true, ...(ONLY ? { category: ONLY } : {}) };
  const games = await prisma.game.findMany({ where });

  if (games.length === 0) {
    console.log("没有找到可配置的游戏（isActive=true）。");
    return;
  }

  // 以当前玩家数从高到低排序，保留你原有的"谁更受欢迎"的意图；并列按名称
  games.sort((a, b) => b.playerCount - a.playerCount || a.name.localeCompare(b.name));

  const n = games.length;
  const plan = games.map((g, i) => {
    const frac = n > 1 ? i / (n - 1) : 0;
    const t = curve(frac);
    const tier = tierOf(frac);

    let players;
    if (tier === "cold") {
      players = Math.max(8, Math.round(rand(8, COLD_PLAYERS_MAX)));
    } else {
      players = Math.max(PLAYERS_MIN, jitter(lerp(PLAYERS_TOP, PLAYERS_MIN, t)));
    }
    const totalBets = Math.max(1_000_000, jitter(lerp(BETS_TOP, BETS_MIN, t)));

    // RTP 围绕目标小幅波动（越接近目标越健康；冷门略偏低更真实）
    const target = g.targetRtp || 96.5;
    const drift = tier === "cold" ? rand(-1.6, -0.4) : rand(-0.8, 0.5);
    const rtp = Math.round((target + drift) * 100) / 100;
    const totalWins = Math.max(1, Math.round((totalBets * rtp) / 100));

    const featured = i === 0; // 全站唯一金色 HOT 卡

    return { g, i, tier, players, totalBets, totalWins, rtp, target, featured };
  });

  // 打印计划表
  console.log(`共 ${n} 款游戏${ONLY ? `（分类=${ONLY}）` : ""}${DRY ? "  [DRY RUN 预览，不写库]" : ""}\n`);
  const idr = (x) => new Intl.NumberFormat("id-ID").format(x);
  for (const p of plan) {
    console.log(
      `${String(p.i + 1).padStart(2)}. [${p.tier.padEnd(7)}] ${p.g.name.padEnd(22)} ` +
      `players=${String(p.players).padStart(6)}  bets=Rp ${idr(p.totalBets).padStart(13)}  ` +
      `rtp=${p.rtp}/${p.target}${p.featured ? "  ⭐FEATURED" : ""}`
    );
  }

  if (DRY) {
    console.log("\n预览结束。确认无误后去掉 DRY_RUN=1 再运行即可写入。");
    return;
  }

  // 写库
  let done = 0;
  for (const p of plan) {
    await prisma.game.update({
      where: { id: p.g.id },
      data: {
        playerCount: p.players,
        totalBets: p.totalBets,
        totalWins: p.totalWins,
        rtp: p.rtp,
        featured: p.featured,
        // 同步初始基线（每日 00:00 重置以此为准，避免漂移）
        initialPlayerCount: p.players,
        initialTotalBets: p.totalBets,
        initialTotalWins: p.totalWins,
      },
    });
    done++;
  }
  console.log(`\n✅ 已更新 ${done} 款游戏。打开前台刷新即可看到新的热度分布与金色 HOT 卡。`);
}

main()
  .catch((e) => {
    console.error("配置失败:", e?.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
