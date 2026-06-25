// ─────────────────────────────────────────────────────────────────────────────
//  智能运营配置核心逻辑（纯函数 · deterministic · 可测试）
//
//  作用：基于「当前 N 个游戏」生成一套**真实感模拟运营配置**——
//        仅产出展示运营参数（rtp / targetRtp / playerCount / totalBets /
//        totalWins / featured），不改动任何基础信息（name / slug / image /
//        provider / category）。
//
//  说明（重要）：
//   · 这是「真实感模拟运营配置」，不是任何真实第三方平台数据。
//   · 排名(rank)/热度(heatTier=HOT/PUPULER/cold)/NEW 由 lib/ranking.ts 在
//     读取时根据 players/bets/wins/targetRtp/featured/prevRank 计算，本模块
//     不直接写 rank/heatTier，而是通过驱动「玩家数 / 投注 / featured」让计算结果
//     自然落到目标分层（玩家越多、投注越大 → 综合分越高 → 名次越靠前）。
//   · deterministic：用基于 (game.id + dateKey) 的 seeded random，
//     同一天多次生成结果一致；换天才会变化。不会每次刷新完全随机。
//   · 金色卡视觉仍由前端 rank === 1 控制；本模块可标多个 featured(HOT)，
//     但前台金皮肤只会出现在第 1 名。
// ─────────────────────────────────────────────────────────────────────────────

// ── 输入：当前游戏的基础信息（只读，不修改） ──────────────────────────────
export interface SmartConfigGame {
  id: string;
  name: string;
  category: string;
  // 现有展示值（用于「前后对比」展示）
  rtp: number;
  targetRtp: number;
  playerCount: number;
  totalBets: number;
  totalWins: number;
  featured: boolean;
  pinned: boolean;
  createdAt: string | number | Date;
}

// ── 输出：新的展示运营配置（映射到现有 Game 字段名） ──────────────────────
export interface SmartConfigResult {
  id: string;
  rtp: number;          // = totalWins / totalBets × 100（与现有口径一致）
  targetRtp: number;
  playerCount: number;
  totalBets: number;
  totalWins: number;
  featured: boolean;    // 是否给 HOT（多个允许；前台金色仍仅 rank 1）
  tier: Tier;           // 仅用于摘要/调试，不写库
}

export type Tier = "rank1" | "top5" | "top15" | "normal" | "cold" | "new";

// ── 各分层的运营区间（严格按需求文档） ───────────────────────────────────
interface Band {
  rtpMin: number; rtpMax: number;          // RTP 当前值区间
  targetAddMin: number; targetAddMax: number; // Target = 当前 + [add]
  playerMin: number; playerMax: number;
  betMin: number; betMax: number;          // 投注金额（IDR）
}

const BANDS: Record<Tier, Band> = {
  // 排名 1：HOT 焦点
  rank1:  { rtpMin: 97.2, rtpMax: 98.2, targetAddMin: 0.3, targetAddMax: 1.2, playerMin: 5000, playerMax: 8500, betMin: 5.5e9, betMax: 9.8e9 },
  // 排名 2-5：HOT / PUPULER
  top5:   { rtpMin: 96.2, rtpMax: 97.6, targetAddMin: 0.3, targetAddMax: 1.5, playerMin: 2000, playerMax: 5800, betMin: 1.2e9, betMax: 5.8e9 },
  // 排名 6-15：PUPULER / RTP Tinggi
  top15:  { rtpMin: 94.5, rtpMax: 96.8, targetAddMin: 0.3, targetAddMax: 2.0, playerMin: 900,  playerMax: 3500, betMin: 4.5e8, betMax: 2.8e9 },
  // 普通游戏
  normal: { rtpMin: 91.8, rtpMax: 95.8, targetAddMin: 0.5, targetAddMax: 2.5, playerMin: 180,  playerMax: 1200, betMin: 8.0e7, betMax: 8.0e8 },
  // 冷门游戏
  cold:   { rtpMin: 88.5, rtpMax: 93.8, targetAddMin: 0.8, targetAddMax: 2.8, playerMin: 35,   playerMax: 350,  betMin: 8.0e6, betMax: 1.2e8 },
  // NEW 游戏：RTP 偏高、玩家中等、投注中低
  new:    { rtpMin: 95.0, rtpMax: 97.0, targetAddMin: 0.3, targetAddMax: 1.5, playerMin: 100,  playerMax: 900,  betMin: 1.0e8, betMax: 9.0e8 },
};

// ── seeded PRNG（mulberry32 + 字符串哈希），deterministic ─────────────────
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// 每款游戏一条独立 RNG 流（id + 日期 + 用途盐），保证同日稳定、跨用途独立
function rngFor(id: string, dateKey: string, salt: string): () => number {
  return mulberry32(hashStr(`${id}::${dateKey}::${salt}`));
}
function lerp(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

// 今日日期键（UTC，稳定到「天」）
export function currentDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ── 分层划分 ──────────────────────────────────────────────────────────────
// 用 deterministic 的「优先分」给游戏排序，再按需求建议的数量切片到各层。
// 优先分 = 基础人气(现有 players/bets 对数) + 名次/featured 倾向 + 稳定扰动，
// 同一天稳定；既参考现状又不照搬，形成自然但可控的分布。
interface Ranked extends SmartConfigGame {
  priority: number;
  isNewPick: boolean;
}

function pickNewCount(total: number, rng: () => number): number {
  // NEW 数量 4-8，且不超过总数的 ~15%
  const cap = Math.max(4, Math.min(8, Math.floor(total * 0.15)));
  const lo = Math.min(4, cap);
  return lo + Math.floor(rng() * (cap - lo + 1));
}

export interface SmartConfigOptions {
  dateKey?: string;
}

export function generateSmartConfig(
  games: SmartConfigGame[],
  opts: SmartConfigOptions = {}
): SmartConfigResult[] {
  const dateKey = opts.dateKey ?? currentDateKey();
  const total = games.length;
  if (total === 0) return [];

  // 1) 计算 deterministic 优先分
  const maxBets = Math.max(1, ...games.map((g) => g.totalBets));
  const maxPlayers = Math.max(1, ...games.map((g) => g.playerCount));
  const ranked: Ranked[] = games.map((g) => {
    const rng = rngFor(g.id, dateKey, "priority");
    const popularity =
      0.5 * (Math.log1p(g.playerCount) / Math.log1p(maxPlayers)) +
      0.5 * (Math.log1p(g.totalBets) / Math.log1p(maxBets)); // 0-1
    const featuredBias = g.featured ? 0.15 : 0;
    const pinnedBias = g.pinned ? 0.25 : 0; // 运营置顶的游戏更可能在前
    const jitter = (rng() - 0.5) * 0.30;     // 稳定扰动：现状≠照搬
    const priority = popularity + featuredBias + pinnedBias + jitter;
    return { ...g, priority, isNewPick: false };
  });

  // 2) 选 NEW：deterministic 抽取一批「非置顶、非头部」的游戏作为新游，
  //    使其不会全部排在最前（NEW 落在 normal 区间附近的人气）。
  const newRng = mulberry32(hashStr(`NEW::${dateKey}`));
  const newCount = pickNewCount(total, newRng);
  // 候选：按 priority 取「中后段」，避免 NEW 抢占榜首
  const byPriorityDesc = [...ranked].sort((a, b) => b.priority - a.priority);
  const newCandidates = byPriorityDesc.slice(Math.floor(total * 0.35)); // 跳过前 35%
  // 在候选里 deterministic 洗牌后取前 newCount 个
  const shuffled = [...newCandidates]
    .map((g) => ({ g, k: mulberry32(hashStr(`NEWPICK::${g.id}::${dateKey}`))() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.g);
  const newIds = new Set(shuffled.slice(0, newCount).map((g) => g.id));

  // 3) 非 NEW 的游戏按 priority 排序后切片到 rank1 / top5 / top15 / normal / cold
  const nonNew = byPriorityDesc.filter((g) => !newIds.has(g.id));
  const tierOf = new Map<string, Tier>();
  nonNew.forEach((g, i) => {
    const pos = i + 1; // 1-indexed 在非 NEW 序列里的位置
    let tier: Tier;
    if (pos === 1) tier = "rank1";
    else if (pos <= 5) tier = "top5";
    else if (pos <= 15) tier = "top15";
    else {
      // 末段约 20% 划为 cold，其余 normal
      const coldStart = Math.ceil(nonNew.length * 0.80);
      tier = pos > coldStart ? "cold" : "normal";
    }
    tierOf.set(g.id, tier);
  });
  for (const id of newIds) tierOf.set(id, "new");

  // 4) 按层区间生成具体数值（deterministic）
  return ranked.map((g) => {
    const tier = tierOf.get(g.id) ?? "normal";
    const band = BANDS[tier];
    const rng = rngFor(g.id, dateKey, "values");

    // RTP 当前值
    const rtp = round2(lerp(rng, band.rtpMin, band.rtpMax));
    // Target = 当前 + add（始终高于当前，作为「目标」弱参照）
    const targetRtp = round2(rtp + lerp(rng, band.targetAddMin, band.targetAddMax));

    // 玩家数
    const playerCount = Math.round(lerp(rng, band.playerMin, band.playerMax));

    // 投注：与玩家数正相关但有自然差异（人气高→投注偏高，叠加独立扰动）
    const playerRatio =
      band.playerMax > band.playerMin
        ? (playerCount - band.playerMin) / (band.playerMax - band.playerMin)
        : 0.5;
    const betSpan = band.betMax - band.betMin;
    const betBase = band.betMin + betSpan * (0.35 + 0.5 * playerRatio); // 跟随玩家
    const betJitter = (rng() - 0.5) * betSpan * 0.30;                   // 独立差异
    const totalBets = clamp(Math.round(betBase + betJitter), band.betMin, band.betMax);

    // totalWins 由 rtp 反推，保证 rtp = totalWins/totalBets 自洽
    const totalWins = Math.max(1, Math.round((totalBets * rtp) / 100));

    // featured(HOT)：rank1 必给；top5 部分给（deterministic）。
    // 前台金色仍仅 rank===1，这里多给只影响 heatTier=blazing 的内部标记。
    const featured =
      tier === "rank1" ? true : tier === "top5" ? rng() < 0.5 : false;

    return { id: g.id, rtp, targetRtp, playerCount, totalBets, totalWins, featured, tier };
  });
}

// ── 摘要（preview/apply 都用） ────────────────────────────────────────────
export interface SmartConfigSummary {
  totalGames: number;
  categoryCounts: Record<string, number>;
  statusCounts: { hot: number; popular: number; new: number };
  rtpRange: { min: number; max: number; avg: number };
  playerRange: { min: number; max: number; total: number };
  betRange: { min: number; max: number; total: number };
}

export function summarize(
  games: SmartConfigGame[],
  results: SmartConfigResult[]
): SmartConfigSummary {
  const byId = new Map(games.map((g) => [g.id, g]));
  const rtps = results.map((r) => r.rtp);
  const players = results.map((r) => r.playerCount);
  const bets = results.map((r) => r.totalBets);

  const categoryCounts: Record<string, number> = {};
  for (const r of results) {
    const cat = byId.get(r.id)?.category ?? "UNKNOWN";
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  }

  // HOT(blazing/hot) ≈ featured 或 rank1/top5；PUPULER ≈ top15 档；NEW ≈ new 档
  const hot = results.filter((r) => r.tier === "rank1" || r.tier === "top5").length;
  const popular = results.filter((r) => r.tier === "top15").length;
  const newCount = results.filter((r) => r.tier === "new").length;

  return {
    totalGames: results.length,
    categoryCounts,
    statusCounts: { hot, popular, new: newCount },
    rtpRange: { min: round2(Math.min(...rtps)), max: round2(Math.max(...rtps)), avg: round2(avg(rtps)) },
    playerRange: { min: Math.min(...players), max: Math.max(...players), total: sum(players) },
    betRange: { min: Math.min(...bets), max: Math.max(...bets), total: sum(bets) },
  };
}

// 前后对比（取前 limit 条变化最大的，用于 UI 展示）
export interface ChangeRow {
  id: string;
  name: string;
  before: { rtp: number; playerCount: number; totalBets: number };
  after: { rtp: number; playerCount: number; totalBets: number };
}

export function diffChanges(
  games: SmartConfigGame[],
  results: SmartConfigResult[],
  limit = 10
): ChangeRow[] {
  const byId = new Map(results.map((r) => [r.id, r]));
  const rows: (ChangeRow & { mag: number })[] = [];
  for (const g of games) {
    const r = byId.get(g.id);
    if (!r) continue;
    const mag =
      Math.abs(r.playerCount - g.playerCount) / Math.max(1, g.playerCount) +
      Math.abs(r.totalBets - g.totalBets) / Math.max(1, g.totalBets);
    rows.push({
      id: g.id,
      name: g.name,
      before: { rtp: round2(g.rtp), playerCount: g.playerCount, totalBets: Math.round(g.totalBets) },
      after: { rtp: r.rtp, playerCount: r.playerCount, totalBets: r.totalBets },
      mag,
    });
  }
  return rows.sort((a, b) => b.mag - a.mag).slice(0, limit).map(({ mag, ...row }) => { void mag; return row; });
}

// ── 小工具 ──────────────────────────────────────────────────────────────
function round2(n: number) { return Math.round(n * 100) / 100; }
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }
function sum(arr: number[]) { return arr.reduce((s, x) => s + x, 0); }
function avg(arr: number[]) { return arr.length ? sum(arr) / arr.length : 0; }
