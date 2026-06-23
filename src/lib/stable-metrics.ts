// 跨刷新数据一致性（防穿帮）：每款游戏的虚拟基线按「日期 + gameId」持久化到
// localStorage，首次见到时以服务端值播种，当天后续刷新都从基线恢复 —— 避免刷新时
// 数字大幅突变。实时微跳动只在该基线上 ±0.1%~0.5% 浮动（见 GameCard）。

export interface MetricBase {
  players: number;
  totalBets: number;
  totalWins: number;
}

const PREFIX = "x168-metrics-";
const todayKey = () => `${PREFIX}${new Date().toISOString().slice(0, 10)}`;

type Store = Record<string, MetricBase>;

function readStore(key: string): Store {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") as Store;
  } catch {
    return {};
  }
}

// 清理非今天的旧基线，避免 localStorage 堆积
function cleanupOldKeys(keepKey: string) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX) && k !== keepKey) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

/**
 * 返回该游戏当天稳定的基线值；首次调用以 server 值播种并落盘。
 * SSR / 无 localStorage 时直接返回 server 值（不破坏首屏一致性）。
 */
export function stableBase(id: string, server: MetricBase): MetricBase {
  if (typeof window === "undefined") return server;
  try {
    const key = todayKey();
    const store = readStore(key);
    if (store[id]) return store[id];
    store[id] = server;
    localStorage.setItem(key, JSON.stringify(store));
    cleanupOldKeys(key);
    return server;
  } catch {
    return server;
  }
}
