// 一次性导入脚本：把「游戏插图/AllImages」里的封面图，连同游戏名/分类/RTP 一起
// 写入后台游戏库；随后把全部游戏自动分布到不同热度档（爆款/热门/普通/冷门）。
// 图片以 base64 data URL 存入 DB（与后台上传一致）。名字与图片严格对应。
//
// 用法（项目根目录，临时传入线上 Neon 连接串）：
//   先预览（不写库）：
//     DRY_RUN=1 DATABASE_URL="postgres://..." node scripts/seed-games.mjs
//   正式写入：
//     DATABASE_URL="postgres://..." node scripts/seed-games.mjs
//
// 图片目录可用 IMAGES_DIR 覆盖（默认指向桌面 游戏插图/AllImages）。

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const prisma = new PrismaClient();
const DRY = process.env.DRY_RUN === "1";
const PRUNE = process.env.PRUNE === "1"; // 删除这 54 款之外的所有游戏（只保留这 54 款）
const IMAGES_DIR =
  process.env.IMAGES_DIR || join(homedir(), "Desktop", "游戏插图", "AllImages");

// 文件号 → { 游戏名, 分类 }。47–50 是 01–04 的重复封面，已跳过。
// 分类：SLOT 老虎机 / TABLE 桌游 / POKER 棋牌纸牌 / CASUAL 休闲街机 / LIVE 真人
const GAMES = [
  { f: "01", name: "Rising Fortunes",   cat: "SLOT" },
  { f: "02", name: "Doki Doki 1000",    cat: "SLOT" },
  { f: "03", name: "Endless Treasure",  cat: "SLOT" },
  { f: "04", name: "Oishi Delights",    cat: "SLOT" },
  { f: "05", name: "Starlight Christmas", cat: "SLOT" },
  { f: "06", name: "Fortune Gems",      cat: "SLOT" },
  { f: "07", name: "Zeus & Hades",      cat: "SLOT" },
  { f: "08", name: "Sweet Bonanza Xmas", cat: "SLOT" },
  { f: "09", name: "Zombie Outbreak",   cat: "SLOT" },
  { f: "10", name: "Super Ace",         cat: "SLOT" },
  { f: "11", name: "Fortune Dragon",    cat: "SLOT" },
  { f: "12", name: "Thai River Wonders", cat: "SLOT" },
  { f: "13", name: "Bao Zhu Zhao Fu",   cat: "SLOT" },
  { f: "14", name: "5 Lions",           cat: "SLOT" },
  { f: "15", name: "Caishen Wins",      cat: "SLOT" },
  { f: "16", name: "The Dog House",     cat: "SLOT" },
  { f: "17", name: "Putri Bulan",       cat: "SLOT" },
  { f: "18", name: "Songkran Splash",   cat: "SLOT" },
  { f: "19", name: "Taberna Muertos",   cat: "SLOT" },
  { f: "20", name: "Big Bass",          cat: "SLOT" },
  { f: "21", name: "Fortune Rabbit",    cat: "SLOT" },
  { f: "22", name: "Buffalo King",      cat: "SLOT" },
  { f: "23", name: "Gems Bonanza",      cat: "SLOT" },
  { f: "24", name: "Wild Chuco",        cat: "SLOT" },
  { f: "25", name: "Air Fighter",       cat: "CASUAL" },
  { f: "26", name: "Aviator 2",         cat: "CASUAL" },
  { f: "27", name: "Crash Cricket",     cat: "CASUAL" },
  { f: "28", name: "Tropicana",         cat: "SLOT" },
  { f: "29", name: "Black Jack",        cat: "TABLE" },
  { f: "30", name: "QiuQiu",            cat: "POKER" },
  { f: "31", name: "Truco Paulista",    cat: "POKER" },
  { f: "32", name: "Gin Rummy",         cat: "POKER" },
  { f: "33", name: "Gaple",             cat: "POKER" },
  { f: "34", name: "Tien Len",          cat: "POKER" },
  { f: "35", name: "Point Rummy",       cat: "POKER" },
  { f: "36", name: "Cacheta",           cat: "POKER" },
  { f: "37", name: "Tongits",           cat: "POKER" },
  { f: "38", name: "29 Cards",          cat: "POKER" },
  { f: "39", name: "Spades",            cat: "POKER" },
  { f: "40", name: "Teenpatti",         cat: "POKER" },
  { f: "41", name: "Pai Kaeng",         cat: "POKER" },
  { f: "42", name: "Snake & Ladders",   cat: "CASUAL" },
  { f: "43", name: "Dummy",             cat: "POKER" },
  { f: "44", name: "Mahjong Phoenix",   cat: "TABLE" },
  { f: "45", name: "Super Niubi",       cat: "SLOT" },
  { f: "46", name: "Asgardian Rising",  cat: "SLOT" },
  // 47–50 重复封面，跳过
  { f: "51", name: "Cocktail Nights",   cat: "SLOT" },
  { f: "52", name: "Fortune Ox",        cat: "SLOT" },
  { f: "53", name: "God Of Wealth",     cat: "SLOT" },
  { f: "54", name: "Dragon Hatch",      cat: "SLOT" },
  { f: "55", name: "Fortune Tiger",     cat: "SLOT" },
  { f: "56", name: "Gong Xi Fa Cai",    cat: "SLOT" },
  { f: "57", name: "Fortune Mouse",     cat: "SLOT" },
  { f: "58", name: "888 Gold",          cat: "SLOT" },
];

// 知名热门标题优先排在前面（决定热度档；featured=榜首）
const HOT_PRIORITY = [
  "Fortune Tiger", "Sweet Bonanza Xmas", "Fortune Ox", "Fortune Mouse",
  "Fortune Rabbit", "Super Ace", "Fortune Dragon", "Fortune Gems",
  "5 Lions", "Mahjong Phoenix", "Caishen Wins", "Dragon Hatch",
  "Big Bass", "Gates of Olympus", "God Of Wealth", "Gong Xi Fa Cai",
];

// 确定性伪随机（按名字播种，保证多次运行结果稳定）
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

// 数值区间（印尼盾场景；吸引但不夸张，与前台进度条满刻度一致）
// 玩家数：热门 ~4200 递减到冷门 <50；投注：热门 ~Rp 2.8 miliar 递减到 ~Rp 3 juta
const PLAYERS_TOP = 4200, PLAYERS_MIN = 240, COLD_PLAYERS_MAX = 45;
const BETS_TOP = 2_800_000_000, BETS_MIN = 3_000_000;
const lerp = (a, b, t) => a + (b - a) * t;
const curve = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const jit = (v, seed, pct = 0.06) => Math.round(v * (1 + (hash(seed) - 0.5) * 2 * pct));

function tier(frac) {
  if (frac <= 0.0001) return "blazing";
  if (frac <= 0.30) return "hot";
  if (frac >= 0.80) return "cold";
  return "normal";
}

function mime(file) {
  return file.endsWith(".webp") ? "image/webp"
    : file.endsWith(".png") ? "image/png"
    : file.endsWith(".jpg") || file.endsWith(".jpeg") ? "image/jpeg"
    : "image/webp";
}

async function main() {
  // 1) 读图 + 组装条目
  const entries = [];
  for (const g of GAMES) {
    const path = join(IMAGES_DIR, `${g.f}.webp`);
    if (!existsSync(path)) { console.warn(`⚠ 缺图，跳过：${path}`); continue; }
    const b64 = readFileSync(path).toString("base64");
    const targetRtp = Math.round((95.8 + (hash(g.name) * 1.4)) * 10) / 10; // 95.8~97.2
    entries.push({ ...g, image: `data:${mime(path)};base64,${b64}`, targetRtp });
  }

  // 2) 排定热度顺序：优先名单在前，其余按名字哈希稳定排序
  const prio = (name) => {
    const i = HOT_PRIORITY.indexOf(name);
    return i >= 0 ? i : HOT_PRIORITY.length + hash(name) * 1000;
  };
  entries.sort((a, b) => prio(a.name) - prio(b.name));

  const n = entries.length;
  const plan = entries.map((e, i) => {
    const frac = n > 1 ? i / (n - 1) : 0;
    const t = curve(frac);
    const tr = tier(frac);
    const players = tr === "cold"
      ? Math.max(8, Math.round(8 + hash(e.name + "p") * (COLD_PLAYERS_MAX - 8)))
      : Math.max(PLAYERS_MIN, jit(lerp(PLAYERS_TOP, PLAYERS_MIN, t), e.name + "p"));
    const totalBets = Math.max(1_000_000, jit(lerp(BETS_TOP, BETS_MIN, t), e.name + "b"));
    const drift = tr === "cold" ? -1.0 - hash(e.name + "r") * 0.8 : (hash(e.name + "r") - 0.4) * 1.2;
    const rtp = Math.round((e.targetRtp + drift) * 100) / 100;
    const totalWins = Math.max(1, Math.round((totalBets * rtp) / 100));
    return { ...e, tier: tr, players, totalBets, totalWins, rtp, featured: i === 0 };
  });

  // 打印计划
  const idr = (x) => new Intl.NumberFormat("id-ID").format(x);
  console.log(`图片目录：${IMAGES_DIR}`);
  console.log(`共 ${n} 款游戏${DRY ? "  [DRY RUN 预览，不写库]" : ""}\n`);
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    console.log(
      `${String(i + 1).padStart(2)}. [${p.tier.padEnd(7)}] ${p.cat.padEnd(6)} ${p.name.padEnd(20)} ` +
      `players=${String(p.players).padStart(6)} bets=Rp ${idr(p.totalBets).padStart(13)} ` +
      `rtp=${p.rtp}/${p.targetRtp}${p.featured ? "  ⭐FEATURED" : ""}`
    );
  }
  if (DRY) {
    console.log(
      `\n预览结束（${PRUNE ? "PRUNE=1：将删除这 54 款之外的所有游戏" : "未加 PRUNE，不删除其它游戏"}）。` +
      `\n去掉 DRY_RUN=1 再运行即可写入。`
    );
    return;
  }

  // 3) 分类 name→id（让前台分类标签更干净）
  const cats = await prisma.category.findMany();
  const catIdByName = new Map(cats.map((c) => [c.name, c.id]));

  // 4) upsert 每个游戏
  let created = 0, updated = 0;
  for (const p of plan) {
    const existing = await prisma.game.findUnique({ where: { name: p.name } });
    const data = {
      category: p.cat,
      categoryId: catIdByName.get(p.cat) ?? null,
      image: p.image,
      targetRtp: p.targetRtp,
      rtp: p.rtp,
      playerCount: p.players,
      totalBets: p.totalBets,
      totalWins: p.totalWins,
      featured: p.featured,
      isActive: true,
      initialPlayerCount: p.players,
      initialTotalBets: p.totalBets,
      initialTotalWins: p.totalWins,
    };
    if (existing) {
      await prisma.game.update({ where: { name: p.name }, data });
      updated++;
    } else {
      await prisma.game.create({ data: { name: p.name, ...data } });
      created++;
    }
  }
  // 5) 处理本批之外的其它游戏
  const names = plan.map((p) => p.name);
  const others = await prisma.game.findMany({
    where: { name: { notIn: names } },
    select: { id: true, name: true },
  });

  let pruned = 0;
  if (others.length > 0) {
    if (PRUNE) {
      // 只保留这 54 款：删除其余全部游戏
      console.log(`\n将删除以下 ${others.length} 款多余游戏：`);
      console.log("  " + others.map((g) => g.name).join(", "));
      const del = await prisma.game.deleteMany({ where: { name: { notIn: names } } });
      pruned = del.count;
    } else {
      // 未开启 PRUNE：至少保证全站只有一张金卡
      await prisma.game.updateMany({
        where: { featured: true, name: { notIn: names } },
        data: { featured: false },
      });
      console.log(
        `\n⚠ 检测到另有 ${others.length} 款不在本批的游戏，未删除` +
        `（如需只保留这 54 款，请加 PRUNE=1 重新运行）。`
      );
    }
  }

  console.log(
    `\n✅ 完成：新增 ${created}，更新 ${updated}` +
    (pruned ? `，删除 ${pruned}` : "") +
    `。打开前台刷新即可看到封面、热度分布与金色 HOT 卡。`
  );
}

main()
  .catch((e) => { console.error("导入失败:", e?.message || e); process.exit(1); })
  .finally(() => prisma.$disconnect());
