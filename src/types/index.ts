// ─────────────────────────────────────────────
//  共享类型定义
// ─────────────────────────────────────────────

export type Category = "SLOT" | "TABLE" | "LIVE" | "POKER" | "CASUAL";
export type Status = "NORMAL" | "WARNING" | "CRITICAL";
export type HeatTier = "blazing" | "hot" | "normal" | "cold";

export interface Game {
  id: string;
  name: string;
  category: Category;
  image: string | null;
  rtp: number;
  targetRtp: number;
  status: Status;
  playerCount: number;
  totalBets: number;
  totalWins: number;
  trend: number[];
  rank: number;
  pinned: boolean;      // 置顶开关
  pinOrder: number;     // 置顶区内顺序
  featured: boolean;    // HOT 金色焦点
  delta: number;        // prevRank − rank (>0=上升, <0=下降, 0=不变/新)
  heatTier: HeatTier;   // 后端打的热度分级（视觉强度跟随）
  isNew: boolean;       // 新游（prevRank=0）
  isActive: boolean;
  description: string | null;
  detailUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  categoryLabel?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建游戏的输入（后台表单提交）
export interface GameInput {
  name: string;
  category: Category;
  image?: string | null;
  rtp?: number;
  targetRtp?: number;
  playerCount?: number;
  totalBets?: number;
  totalWins?: number;
  trend?: number[];
  rank?: number;
  pinned?: boolean;
  pinOrder?: number;
  featured?: boolean;
  isActive?: boolean;
  description?: string | null;
  detailUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
}

// 更新游戏（全部可选）
export type GameUpdateInput = Partial<GameInput>;

// 游戏分类（数据库实体；与字符串联合类型 Category 区分）
export interface CategoryItem {
  id: string;
  name: string;
  label: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

// 站点设置
export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  copyright: string;
  logo: string; // base64 data URL 或空
}

// 页面级 SEO 配置
export interface SeoConfig {
  id: string;
  key: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeoConfigInput {
  key: string;
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  ogImage?: string | null;
}

// 分类筛选选项
export interface CategoryOption {
  value: Category | "ALL";
  label: string;
}

// 统一 API 响应包装
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
