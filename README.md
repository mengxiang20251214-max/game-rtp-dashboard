# 游戏 RTP 展示面板 + 后台管理

深色赛博朋克科技风的游戏 RTP（Return To Player）实时展示面板，含前台展示与密码保护的后台管理。

## 技术栈

Next.js 14 (App Router) · TypeScript · TailwindCSS · Framer Motion · Prisma · SQLite · NextAuth.js

## 快速开始

```bash
pnpm install          # 安装依赖（postinstall 自动 prisma generate）
cp .env.local.example .env.local   # 配置环境变量（已附带可用的 .env）
pnpm db:push          # 创建 SQLite 表
pnpm db:seed          # 写入 12 个种子游戏
pnpm dev              # 启动 http://localhost:3000
```

> 已附带可直接运行的 `.env` / `.env.local`。生产环境请务必修改 `NEXTAUTH_SECRET` 与 `ADMIN_PASSWORD`。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 开发服务器 |
| `pnpm build` / `pnpm start` | 构建 / 生产启动 |
| `pnpm db:push` | 同步 schema 到数据库 |
| `pnpm db:seed` | 写入种子数据 |
| `pnpm db:reset` | 重置并重新播种 |
| `pnpm db:studio` | Prisma Studio 可视化 |

## 页面

- `/` — 前台：分类筛选 + 响应式卡片网格 + Framer Motion 入场动画 + RTP 动态进度条
- `/admin` — 后台（需登录）：概览统计 / 游戏列表 / 增删改 / 排名调整 / 智能运营配置（见 [docs/smart-config.md](docs/smart-config.md)）
- `/admin/login` — 后台登录（默认密码 `admin123`）

## API

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| GET | `/api/games` | 游戏列表（`?category=` 筛选，`?all=true` 含未激活） | 否 |
| POST | `/api/games` | 新增游戏 | 是 |
| GET | `/api/games/:id` | 单个游戏 | 否 |
| PUT | `/api/games/:id` | 更新游戏 | 是 |
| DELETE | `/api/games/:id` | 删除游戏 | 是 |
| PATCH | `/api/games/:id/rank` | 调整排名（`{direction:"up"\|"down"}` 或 `{rank}`） | 是 |
| POST | `/api/admin/games/smart-config/preview` | 智能运营配置预览（dry-run，不写库） | 是 |
| POST | `/api/admin/games/smart-config/apply` | 应用配置（先自动备份再批量写入） | 是 |
| POST | `/api/admin/games/smart-config/rollback` | 回滚到上次备份（`{confirm:true}`） | 是 |

## 实现说明

- **SQLite 适配**：SQLite 不支持 Prisma 原生 `enum` 与 `Json`，因此 `category`/`status` 以 `String` 存储（由 `src/types` 的联合类型约束），`trend` 以 JSON 字符串存储（`game-utils.parseTrend` 解析）。
- **状态自动推导**：`status` 由 `rtp` 与 `targetRtp` 偏差自动计算（≤ -2 异常 / ≤ -1 预警 / 否则正常），创建与更新时统一在服务端推导。
- **鉴权**：NextAuth Credentials Provider（单一管理员密码），`middleware.ts` 保护 `/admin` 及其子路由。
