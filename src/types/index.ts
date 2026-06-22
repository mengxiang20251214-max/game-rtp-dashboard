// ─────────────────────────────────────────────
//  共享类型定义
// ─────────────────────────────────────────────

export type Category = "SLOT" | "TABLE" | "LIVE" | "POKER" | "CASUAL";
export type Status = "NORMAL" | "WARNING" | "CRITICAL";

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
  isActive: boolean;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  categoryLabel?: string; // 来自 Category.label（前台展示用，运行时附加）
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
  isActive?: boolean;
  description?: string | null;
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
