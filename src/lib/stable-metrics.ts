// 让前台"活起来但不穿帮"：持久化「上一次显示值」到 localStorage，每次页面加载/刷新
// 在上次值基础上走一小步（随机游走累积），而非固定不变、也非整组重抽。
// 仅前台虚拟视觉，不回写后端。

export interface MetricBase {
  players: number;
  totalBets: number;
  totalWins: number;
}

const STORE_KEY  = "x168-walk-metrics";
const ONLINE_KEY = "x168-walk-online";

type Store = Record<string, MetricBase>;

function readStore(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") as Store;
  } catch {
    return {};
  }
}

// 走一小步：±mag 量级随机游走，posBias 概率为正（温和上升偏置）
function step(prev: number, magMin: number, magMax: number, posBias: number): number {
  const mag = magMin + Math.random() * (magMax - magMin);
  const sign = Math.random() < posBias ? 1 : -1;
  return Math.max(1, Math.round(prev * (1 + sign * mag)));
}

// ── 热度分层（驱动「投注增长幅度」与「玩家波动幅度」） ──────────────
// tier 由调用方按 heatTier / rank 传入。
export type MetricTier = "hot" | "popular" | "normal" | "cold";

// 投注 Total Taruhan：累计值，主要只增不减；幅度按热度分层（更明显）。
// posBias 接近 1 = 几乎只涨；min/max = 每轮增长幅度区间。
const BET_GROWTH: Record<MetricTier, { min: number; max: number; posBias: number }> = {
  hot:     { min: 0.0020, max: 0.0080, posBias: 0.96 }, // +0.20%~0.80%
  popular: { min: 0.0010, max: 0.0045, posBias: 0.94 }, // +0.10%~0.45%
  normal:  { min: 0.0003, max: 0.0018, posBias: 0.92 }, // +0.03%~0.18%
  cold:    { min: 0.0001, max: 0.0008, posBias: 0.90 }, // +0.01%~0.08%
};

// 玩家 Pemain：非累计，可上下波动；幅度按热度分层（posBias=0.5 = 真正双向）。
const PLAYER_SWING: Record<MetricTier, { min: number; max: number }> = {
  hot:     { min: 0.015, max: 0.040 }, // ±1.5%~4.0%
  popular: { min: 0.010, max: 0.030 }, // ±1.0%~3.0%
  normal:  { min: 0.005, max: 0.018 }, // ±0.5%~1.8%
  cold:    { min: 0.002, max: 0.010 }, // ±0.2%~1.0%
};

// 玩家波动下限：不低于 server 真值的 35%，避免被随机游走拖到不合理的低值。
const PLAYER_FLOOR_RATIO = 0.35;

// 本地存值是否相对 server 真值「严重偏离」（量级差 > DRIFT_TOLERANCE 倍）。
// 用于脏值自愈：偏离过大说明本地值过期/损坏，应丢弃改用 server 真值重新播种。
const DRIFT_TOLERANCE = 50;
function ratioOutOfRange(local: number, srv: number): boolean {
  // server 有真值而本地几乎为 0，或两者比值超出 [1/tol, tol]，判为脏值
  if (srv > 0 && local <= 0) return true;
  if (srv <= 0) return false;
  const r = local / srv;
  return r > DRIFT_TOLERANCE || r < 1 / DRIFT_TOLERANCE;
}
function isStale(prev: MetricBase, server: MetricBase): boolean {
  return (
    ratioOutOfRange(prev.players, server.players) ||
    ratioOutOfRange(prev.totalBets, server.totalBets)
  );
}

/**
 * 在「上一次显示值」基础上为单款游戏走一步（按热度 tier 分层）。
 * - totalBets：累计值，主要只增不减；增长幅度按 tier 分层（hot 最大）。
 * - players：非累计，上下波动；波动幅度按 tier 分层；不低于 server×35%。
 * - currentRtp：围绕 server 基准小幅浮动，钳制在 target 附近的窄带，
 *   且**绝不超过 99.5%**；再据此推出 totalWins，保证 rtp=totalWins/totalBets 自洽。
 * 首次见到该游戏时以 server 值播种（不走步），写回 localStorage。
 * server 永远是基准；本地值偏离过大时（脏值）丢弃重播种。
 */
export function walkMetrics(
  id: string,
  server: MetricBase & { targetRtp: number },
  tier: MetricTier = "normal"
): MetricBase {
  if (typeof window === "undefined") {
    const { players, totalBets, totalWins } = server;
    return { players, totalBets, totalWins };
  }
  try {
    const store = readStore();
    let prev = store[id];

    // ── 脏值自愈 ──
    // walkMetrics 平时只在本地存值上随机游走、不回看 server。但如果本地存的
    // players / totalBets 与 server 真值量级严重偏离（>50 倍），说明本地值是
    // 过期/损坏的脏数据（例如早期播种过 players=1、totalBets=1，就会永远困在 1
    // 附近，导致前台显示 Pemain 1 / Rp 1 而后台是几千/几十亿）。此时丢弃本地值，
    // 用 server 真值重新播种。正常随机游走（按 tier 的小幅）远在阈值内，不受影响。
    if (prev && isStale(prev, server)) {
      prev = undefined as unknown as MetricBase;
    }

    let next: MetricBase;
    if (!prev) {
      next = { players: server.players, totalBets: server.totalBets, totalWins: server.totalWins };
    } else {
      // 投注：按 tier 分层、几乎只增（像真实平台累计流水）
      const bg = BET_GROWTH[tier];
      const totalBets = step(prev.totalBets, bg.min, bg.max, bg.posBias);

      // 玩家：按 tier 分层、双向波动（posBias=0.5），并设下限避免拖到不合理低值
      const ps = PLAYER_SWING[tier];
      const floor = Math.max(1, Math.round(server.players * PLAYER_FLOOR_RATIO));
      const players = Math.max(floor, step(prev.players, ps.min, ps.max, 0.5));

      // RTP：围绕上次值小幅浮动，钳制在 [target-1.5, min(target+1.0, 99.5)]，绝不跳 100%
      const prevRtp = prev.totalBets > 0 ? (prev.totalWins / prev.totalBets) * 100 : server.targetRtp;
      const target = server.targetRtp || 96.5;
      const lo = target - 1.5;
      const hi = Math.min(target + 1.0, 99.5);
      const rtp = Math.min(hi, Math.max(lo, prevRtp + (Math.random() - 0.5) * 0.25));
      const totalWins = Math.max(1, Math.round((totalBets * rtp) / 100));

      next = { players, totalBets, totalWins };
    }

    store[id] = next;
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    return next;
  } catch {
    const { players, totalBets, totalWins } = server;
    return { players, totalBets, totalWins };
  }
}

/**
 * 顶部在线人数走一步：±1%~3%（比金额略大，更有实时感），从上次值继续走。
 * 首次以 fallback 播种。
 */
export function walkOnline(fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(ONLINE_KEY);
    const prev = raw != null ? Number(raw) : NaN;
    const next = Number.isFinite(prev) && prev > 0
      ? step(prev, 0.01, 0.03, 0.55)
      : Math.max(1, Math.round(fallback));
    localStorage.setItem(ONLINE_KEY, String(next));
    return next;
  } catch {
    return fallback;
  }
}
