import type { Category, Status, Game } from "@/types";

// ─────────────────────────────────────────────
//  工具函数
// ─────────────────────────────────────────────

// 深色占位模糊图（加载时显示），与卡片背景同色调
export const BLUR_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="5"><rect width="8" height="5" fill="#111827"/></svg>'
)}`;

export const CATEGORY_LABELS: Record<Category, string> = {
  SLOT: "老虎机",
  TABLE: "桌游",
  LIVE: "真人",
  POKER: "棋牌",
  CASUAL: "休闲",
};

export const CATEGORY_OPTIONS: { value: Category | "ALL"; label: string }[] = [
  { value: "ALL", label: "全部" },
  { value: "SLOT", label: "老虎机" },
  { value: "TABLE", label: "桌游" },
  { value: "LIVE", label: "真人" },
  { value: "POKER", label: "棋牌" },
  { value: "CASUAL", label: "休闲" },
];

// 仅取值（标签由 i18n 翻译）
export const CATEGORY_FILTER_VALUES: (Category | "ALL")[] = [
  "ALL",
  "SLOT",
  "TABLE",
  "LIVE",
  "POKER",
  "CASUAL",
];

export const CATEGORY_VALUES: Category[] = ["SLOT", "TABLE", "LIVE", "POKER", "CASUAL"];

export const STATUS_LABELS: Record<Status, string> = {
  NORMAL: "正常",
  WARNING: "正常",
  CRITICAL: "正常",
};

/**
 * 写库用的 status —— 这是面向用户的热门游戏运营展示，不是风控后台，
 * 因此**永不**产出 WARNING / CRITICAL 这类负面状态，统一为 NORMAL。
 * （schema 的 status 字段保留以兼容，但语义已不再表达「预警/异常」。）
 * 面向用户的正向标签（HOT/PUPULER/RTP TINGGI/TRENDING/NEW/NORMAL）
 * 由 getDisplayStatus() 按热度指标实时计算，见下。
 */
export function deriveStatus(_rtp: number, _targetRtp: number): Status {
  void _rtp; void _targetRtp;
  return "NORMAL";
}

// ─────────────────────────────────────────────
//  正向运营展示标签（前台 + 后台统一）
//  逻辑：玩家越多 / 投注越大 / RTP 越高 / 排名越靠前 = 越热门越推荐
// ─────────────────────────────────────────────

export type DisplayStatus =
  | "HOT"
  | "PUPULER"
  | "RTP_TINGGI"
  | "TRENDING"
  | "NEW"
  | "NORMAL";

/** 正向标签的展示文案（全大写，运营风格） */
export const DISPLAY_STATUS_LABELS: Record<DisplayStatus, string> = {
  HOT: "HOT",
  PUPULER: "PUPULER",
  RTP_TINGGI: "RTP TINGGI",
  TRENDING: "TRENDING",
  NEW: "NEW",
  NORMAL: "NORMAL",
};

/** 正向标签配色（仅 HOT=金；其余品牌蓝；NORMAL 中性但不灰主信息） */
export function displayStatusColor(s: DisplayStatus): { color: string; bg: string } {
  if (s === "HOT") return { color: "#f2c14e", bg: "rgba(242,193,78,0.14)" };
  if (s === "NORMAL") return { color: "#8b96b4", bg: "rgba(139,150,180,0.12)" };
  // PUPULER / RTP_TINGGI / TRENDING / NEW 一律品牌蓝
  return { color: "#4DABE9", bg: "rgba(77,171,233,0.13)" };
}

export interface DisplayStatusInput {
  rank: number;
  playerCount: number;
  totalBets: number;
  rtp: number;
  isNew?: boolean;
  heatTier?: string; // 'blazing' | 'hot' | 'normal' | 'cold'
}

/**
 * 计算面向用户的正向运营标签。
 * 优先级（参考需求建议逻辑）：
 *   rank===1 → HOT
 *   高玩家 & 高投注 → PUPULER
 *   RTP ≥ 96 → RTP TINGGI
 *   新游 → NEW
 *   趋势/热度较高 → TRENDING
 *   其余 → NORMAL（不显示任何负面/预警）
 */
export function getDisplayStatus(g: DisplayStatusInput): DisplayStatus {
  if (g.rank === 1) return "HOT";
  const playersHigh = g.playerCount >= 1500;
  const betHigh = g.totalBets >= 1_000_000_000; // ≥ 1B IDR
  if (playersHigh && betHigh) return "PUPULER";
  if (g.rtp >= 96) return "RTP_TINGGI";
  if (g.isNew) return "NEW";
  if (g.heatTier === "hot" || g.heatTier === "blazing") return "TRENDING";
  return "NORMAL";
}

/**
 * RTP 文字/进度条颜色 —— 面向用户的运营展示，统一品牌蓝。
 * 不再用红/橙做预警；保留入参签名以兼容旧调用。
 */
export function rtpColor(_status?: Status): string {
  void _status;
  return "#4DABE9"; // 品牌蓝
}

/** 进度条填充比例（0-100），以 targetRtp 为满刻度参考，限制在合理区间 */
export function rtpPercent(rtp: number, targetRtp: number): number {
  if (targetRtp <= 0) return 0;
  // 以目标值为 100% 参考，最高展示到 100%
  const pct = (rtp / targetRtp) * 100;
  return Math.max(0, Math.min(100, Math.round(pct * 10) / 10));
}

/** 千分位 + 中文单位（万 / 亿）格式化大数字（后台使用，保持现状） */
export function formatNumber(n: number): string {
  if (n >= 1e8) return `${(n / 1e8).toFixed(2)}亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  return n.toLocaleString("zh-CN");
}

/** 格式化人数（后台使用，保持现状） */
export function formatPlayers(n: number): string {
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  return n.toLocaleString("zh-CN");
}

/** 百分比格式化（RTP，后台使用，保持现状） */
export function formatRtp(n: number): string {
  return `${n.toFixed(1)}%`;
}

// ─────────────────────────────────────────────
//  前台印尼本地化格式（id-ID：千分位用点、小数用逗号）
//  统一走 Intl.NumberFormat('id-ID')，禁止手写逗号拼接
// ─────────────────────────────────────────────

const idrFmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const numFmt = new Intl.NumberFormat("id-ID");
const pctFmt = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 印尼盾金额：12480000 → "Rp 12.480.000" */
export function formatIDR(n: number): string {
  // Intl 输出 "Rp12.480.000"，补一个空格更易读
  return idrFmt.format(Math.max(0, Math.round(n))).replace(/^Rp\s?/, "Rp ");
}

/** 普通数量（玩家数等）：12847 → "12.847" */
export function formatNum(n: number): string {
  return numFmt.format(Math.max(0, Math.round(n)));
}

/** 百分比（RTP，两位小数、逗号）：96.53 → "96,53%" */
export function formatPct(n: number): string {
  return `${pctFmt.format(n)}%`;
}

/** 安全解析 trend（Prisma Json 字段可能是任意类型） */
export function parseTrend(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is number => typeof x === "number");
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "number") : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** 将 Prisma 记录序列化为前端使用的 Game 类型 */
export function serializeGame(record: {
  id: string;
  name: string;
  category: string;
  image: string | null;
  rtp: number;
  targetRtp: number;
  status: string;
  playerCount: number;
  totalBets: number;
  totalWins: number;
  trend: unknown;
  rank: number;
  pinned?: boolean;
  pinOrder?: number;
  featured?: boolean;
  rankWeight?: number;  // legacy, kept synced
  isActive: boolean;
  description: string | null;
  detailUrl?: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Game {
  return {
    id: record.id,
    name: record.name,
    category: record.category as Category,
    image: record.image,
    rtp: record.rtp,
    targetRtp: record.targetRtp,
    status: record.status as Status,
    playerCount: record.playerCount,
    totalBets: record.totalBets,
    totalWins: record.totalWins,
    trend: parseTrend(record.trend),
    rank: record.rank,
    pinned: record.pinned ?? (record.rankWeight ?? 0) > 0,
    pinOrder: record.pinOrder ?? record.rankWeight ?? 0,
    featured: record.featured ?? false,
    delta: 0,            // overridden by computeRankings at query time
    heatTier: "normal",  // overridden by computeRankings at query time
    isNew: false,        // overridden by computeRankings at query time
    isActive: record.isActive,
    description: record.description,
    detailUrl: record.detailUrl ?? null,
    seoTitle: record.seoTitle,
    seoDescription: record.seoDescription,
    seoKeywords: record.seoKeywords,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/** 生成 SVG sparkline 的 points 字符串 */
export function sparklinePoints(
  trend: number[],
  width: number,
  height: number
): string {
  if (trend.length < 2) return "";
  const min = Math.min(...trend);
  const max = Math.max(...trend);
  const range = max - min || 1;
  const step = width / (trend.length - 1);
  return trend
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
