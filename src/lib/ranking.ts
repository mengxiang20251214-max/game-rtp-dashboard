// Two-stage ranking (V2 — toggle-based):
//   Stage 1 — pinned:  pinned=true, sorted by pinOrder asc (drag/up-down decides)
//   Stage 2 — auto:    pinned=false, sorted by composite score desc
// Visual heat (heatTier) is monotonic with score/rank — brighter = hotter.

export type HeatTier = "blazing" | "hot" | "normal" | "cold";

// 用户端排序模式（仅作用于「自动区」，置顶区恒定优先）
export type SortMode = "composite" | "hot" | "new" | "rtp";
export const SORT_MODES: SortMode[] = ["composite", "hot", "new", "rtp"];
export function normalizeSort(v: string | null | undefined): SortMode {
  return SORT_MODES.includes(v as SortMode) ? (v as SortMode) : "composite";
}

export interface RankInput {
  id: string;
  pinned: boolean;
  pinOrder: number;     // order within pinned region (lower = higher)
  featured: boolean;    // forces gold HOT focus
  playerCount: number;
  totalBets: number;
  totalWins: number;
  targetRtp: number;
  prevRank: number;     // last computed rank; 0 = new / unknown
  createdAt: number;    // ms timestamp, for "new" sort mode
}

export interface RankResult {
  id: string;
  currentRtp: number;   // totalWins / totalBets × 100
  score: number;        // composite 0–100
  playersScore: number;
  betScore: number;
  rtpScore: number;
  rank: number;         // 1-indexed final position
  delta: number;        // prevRank − rank  (>0 = up, <0 = down, 0 = unchanged/new)
  heatTier: HeatTier;
  isNew: boolean;       // prevRank === 0
}

function minmaxNorm(values: number[]): (v: number) => number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) return () => 50;
  return (v) => ((v - min) / range) * 100;
}

export function computeRankings(games: RankInput[], sort: SortMode = "composite"): RankResult[] {
  if (games.length === 0) return [];

  const logPlayers = games.map((g) => Math.log(1 + g.playerCount));
  const logBets    = games.map((g) => Math.log(1 + g.totalBets));
  const normPlayers = minmaxNorm(logPlayers);
  const normBets    = minmaxNorm(logBets);

  const scored = games.map((g, i) => {
    const currentRtp   = g.totalBets > 0 ? (g.totalWins / g.totalBets) * 100 : g.targetRtp;
    const playersScore = normPlayers(logPlayers[i]);
    const betScore     = normBets(logBets[i]);
    // RTP health: closer to target = higher; over/under both penalised
    const rtpScore     = Math.max(0, Math.min(100, 100 - Math.abs(currentRtp - g.targetRtp) * 8));
    const score        = 0.45 * playersScore + 0.40 * betScore + 0.15 * rtpScore;
    return { ...g, currentRtp, playersScore, betScore, rtpScore, score };
  });

  type Scored = (typeof scored)[number];
  const pinnedRegion = scored.filter((g) => g.pinned).sort((a, b) => a.pinOrder - b.pinOrder);
  const autoRegion   = scored.filter((g) => !g.pinned);

  // ── 权威名次/热度/涨跌：始终按「综合」模式判定（不随排序模式变） ──
  const composite = [...pinnedRegion, ...[...autoRegion].sort((a, b) => b.score - a.score)];
  const n = composite.length;
  const meta = new Map<string, RankResult>();
  composite.forEach((g, i) => {
    const rank = i + 1;
    const percentile = n > 1 ? i / (n - 1) : 0; // 0 = top, 1 = bottom
    let heatTier: HeatTier;
    if (rank === 1 || g.featured) {
      heatTier = "blazing";
    } else if (percentile <= 0.3 && g.playerCount >= 50) {
      heatTier = "hot";
    } else if (!g.pinned && (percentile >= 0.8 || g.playerCount < 50)) {
      heatTier = "cold";
    } else {
      heatTier = "normal";
    }
    meta.set(g.id, {
      id:           g.id,
      currentRtp:   Math.round(g.currentRtp * 100) / 100,
      score:        Math.round(g.score),
      playersScore: Math.round(g.playersScore),
      betScore:     Math.round(g.betScore),
      rtpScore:     Math.round(g.rtpScore),
      rank,
      delta:        g.prevRank > 0 ? g.prevRank - rank : 0,
      heatTier,
      isNew:        g.prevRank === 0,
    });
  });

  // ── 展示顺序：置顶区恒定优先 ⧺ 自动区按 sort 模式排序 ──
  const autoSorters: Record<SortMode, (a: Scored, b: Scored) => number> = {
    composite: (a, b) => b.score - a.score,
    hot:       (a, b) => b.playerCount - a.playerCount,
    rtp:       (a, b) => b.currentRtp - a.currentRtp,
    // 最新：新游优先，再按上架时间倒序
    new:       (a, b) =>
      (b.prevRank === 0 ? 1 : 0) - (a.prevRank === 0 ? 1 : 0) || b.createdAt - a.createdAt,
  };
  const autoDisplay = [...autoRegion].sort(autoSorters[sort]);
  const display = [...pinnedRegion, ...autoDisplay];

  // 返回「展示顺序」的结果，但每项的 rank/delta/heatTier 取自综合权威 meta
  return display.map((g) => meta.get(g.id)!);
}

// Build a RankInput from a raw DB record (tolerates pre-migration rows via rankWeight)
export function toRankInput(g: Record<string, unknown>): RankInput {
  const rankWeight = (g.rankWeight as number) ?? 0;
  const pinnedRaw  = (g.pinned as boolean) ?? false;
  const pinOrderRaw = (g.pinOrder as number) ?? 0;
  return {
    id:          g.id as string,
    pinned:      pinnedRaw || rankWeight > 0,                  // legacy fallback
    pinOrder:    pinOrderRaw > 0 ? pinOrderRaw : rankWeight,   // legacy fallback
    featured:    (g.featured as boolean) ?? false,
    playerCount: (g.playerCount as number) ?? 0,
    totalBets:   (g.totalBets as number) ?? 0,
    totalWins:   (g.totalWins as number) ?? 0,
    targetRtp:   (g.targetRtp as number) ?? 96.5,
    prevRank:    (g.prevRank as number) ?? 0,
    createdAt:   g.createdAt instanceof Date
      ? g.createdAt.getTime()
      : typeof g.createdAt === "string"
        ? new Date(g.createdAt).getTime()
        : (g.createdAt as number) ?? 0,
  };
}
