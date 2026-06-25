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
 * 在「上一次显示值」基础上为单款游戏走一步。
 * - players / totalBets：±0.3%~0.8%，60% 概率为正（缓慢累积）
 * - currentRtp：在上次值附近 ±0.15 绝对小步，钳制在 target 附近合理带，
 *   再据此推出 totalWins，保证 currentRtp = totalWins/totalBets 自洽且不漂移。
 * 首次见到该游戏时以 server 值播种（不走步），写回 localStorage。
 */
export function walkMetrics(
  id: string,
  server: MetricBase & { targetRtp: number }
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
    // 用 server 真值重新播种。正常随机游走（±0.3%~几个百分点）远在阈值内，不受影响。
    if (prev && isStale(prev, server)) {
      prev = undefined as unknown as MetricBase;
    }

    let next: MetricBase;
    if (!prev) {
      next = { players: server.players, totalBets: server.totalBets, totalWins: server.totalWins };
    } else {
      const players   = step(prev.players, 0.003, 0.008, 0.6);
      const totalBets = step(prev.totalBets, 0.003, 0.008, 0.6);
      const prevRtp = prev.totalBets > 0 ? (prev.totalWins / prev.totalBets) * 100 : server.targetRtp;
      const target = server.targetRtp || 96.5;
      const lo = target - 2;
      const hi = target + 1.5;
      const rtp = Math.min(hi, Math.max(lo, prevRtp + (Math.random() - 0.5) * 0.3));
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
