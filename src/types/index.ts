// ─────────────────────────────────────────────
//  共享类型定义
// ─────────────────────────────────────────────

export type Category = "SLOT" | "TABLE" | "LIVE";
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
}

// 更新游戏（全部可选）
export type GameUpdateInput = Partial<GameInput>;

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
