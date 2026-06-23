// Two-stage ranking:
//   Stage 1 — pinned:  rankWeight > 0, ascending (1 beats 2)
//   Stage 2 — auto:    rankWeight = 0, sorted by composite score desc
// rankWeight = 0 is intentionally LAST, not first.

export interface RankInput {
  id: string;
  rankWeight: number;   // 0 = auto, 1/2/3… = pinned (lower = higher priority)
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
  rank: number;         // 1-indexed final position
  delta: number;        // prevRank − rank  (>0 = moved up, <0 = dropped, 0 = unchanged / new)
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
    // RTP health: closer to target = higher score; over/under both penalised
    const rtpScore     = Math.max(0, Math.min(100, 100 - Math.abs(currentRtp - g.targetRtp) * 8));
    const score        = 0.45 * playersScore + 0.40 * betScore + 0.15 * rtpScore;
    return { ...g, currentRtp, score };
  });

  const pinned = scored.filter((g) => g.rankWeight > 0).sort((a, b) => a.rankWeight - b.rankWeight);
  const auto   = scored.filter((g) => g.rankWeight === 0).sort((a, b) => b.score - a.score);
  const sorted = [...pinned, ...auto];

  return sorted.map((g, i) => ({
    id:         g.id,
    currentRtp: Math.round(g.currentRtp * 100) / 100,
    score:      Math.round(g.score),
    rank:       i + 1,
    // prevRank 0 means new/unknown → delta 0
    delta:      g.prevRank > 0 ? g.prevRank - (i + 1) : 0,
  }));
}
