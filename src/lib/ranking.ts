// Two-stage ranking (V2 — toggle-based):
//   Stage 1 — pinned:  pinned=true, sorted by pinOrder asc (drag/up-down decides)
//   Stage 2 — auto:    pinned=false, sorted by composite score desc
// Visual heat (heatTier) is monotonic with score/rank — brighter = hotter.

export type HeatTier = "blazing" | "hot" | "normal" | "cold";

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

export function computeRankings(games: RankInput[]): RankResult[] {
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

  const pinned = scored.filter((g) => g.pinned).sort((a, b) => a.pinOrder - b.pinOrder);
  const auto   = scored.filter((g) => !g.pinned).sort((a, b) => b.score - a.score);
  const sorted = [...pinned, ...auto];

  const n = sorted.length;
  return sorted.map((g, i) => {
    const rank = i + 1;
    const percentile = n > 1 ? i / (n - 1) : 0; // 0 = top, 1 = bottom

    // Monotonic heat: glow follows heat, never give cold games special highlight
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

    return {
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
    };
  });
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
  };
}
