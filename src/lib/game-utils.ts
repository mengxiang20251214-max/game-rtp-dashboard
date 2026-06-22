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
};

export const CATEGORY_OPTIONS: { value: Category | "ALL"; label: string }[] = [
  { value: "ALL", label: "全部" },
  { value: "SLOT", label: "老虎机" },
  { value: "TABLE", label: "桌游" },
  { value: "LIVE", label: "真人" },
];

// 仅取值（标签由 i18n 翻译）
export const CATEGORY_FILTER_VALUES: (Category | "ALL")[] = [
  "ALL",
  "SLOT",
  "TABLE",
  "LIVE",
];

export const CATEGORY_VALUES: Category[] = ["SLOT", "TABLE", "LIVE"];

export const STATUS_LABELS: Record<Status, string> = {
  NORMAL: "正常",
  WARNING: "预警",
  CRITICAL: "异常",
};

/** 根据当前 RTP 与目标 RTP 的偏差推导状态 */
export function deriveStatus(rtp: number, targetRtp: number): Status {
  const diff = rtp - targetRtp;
  if (diff <= -2) return "CRITICAL";
  if (diff <= -1) return "WARNING";
  return "NORMAL";
}

/** RTP 进度条/文字颜色（基于状态） */
export function rtpColor(status: Status): string {
  switch (status) {
    case "CRITICAL":
      return "#ef4444";
    case "WARNING":
      return "#f59e0b";
    default:
      return "#22c55e";
  }
}

/** 进度条填充比例（0-100），以 targetRtp 为满刻度参考，限制在合理区间 */
export function rtpPercent(rtp: number, targetRtp: number): number {
  if (targetRtp <= 0) return 0;
  // 以目标值为 100% 参考，最高展示到 100%
  const pct = (rtp / targetRtp) * 100;
  return Math.max(0, Math.min(100, Math.round(pct * 10) / 10));
}

/** 千分位 + 中文单位（万 / 亿）格式化大数字 */
export function formatNumber(n: number): string {
  if (n >= 1e8) return `${(n / 1e8).toFixed(2)}亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  return n.toLocaleString("zh-CN");
}

/** 格式化人数 */
export function formatPlayers(n: number): string {
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  return n.toLocaleString("zh-CN");
}

/** 百分比格式化（RTP） */
export function formatRtp(n: number): string {
  return `${n.toFixed(1)}%`;
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
  isActive: boolean;
  description: string | null;
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
    isActive: record.isActive,
    description: record.description,
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
