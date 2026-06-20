import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Category = "SLOT" | "TABLE" | "LIVE";

type SeedGame = {
  name: string;
  category: Category;
  targetRtp: number; // 设计目标 RTP
  rtp: number; // 当前实时 RTP（围绕目标波动，用于演示状态颜色）
  playerCount: number;
  totalBets: number; // 累计投注
  totalWins: number; // 累计派彩
  image: string;
  description: string;
};

// 12 个游戏种子数据
const games: SeedGame[] = [
  {
    name: "赛博之轮",
    category: "SLOT",
    targetRtp: 96.5,
    rtp: 96.7,
    playerCount: 1234,
    totalBets: 125000,
    totalWins: 120625,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
    description: "霓虹齿轮转动，命运在数据流中重组。",
  },
  {
    name: "星际老虎机",
    category: "SLOT",
    targetRtp: 97.2,
    rtp: 97.0,
    playerCount: 856,
    totalBets: 89000,
    totalWins: 86508,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
    description: "穿越星云，每一次旋转都是一场跃迁。",
  },
  {
    name: "埃及宝藏",
    category: "SLOT",
    targetRtp: 95.8,
    rtp: 93.5,
    playerCount: 2103,
    totalBets: 245000,
    totalWins: 234710,
    image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=600&q=80",
    description: "法老的密室，藏着千年算法的秘密。",
  },
  {
    name: "龙之传说",
    category: "SLOT",
    targetRtp: 96.0,
    rtp: 94.8,
    playerCount: 1542,
    totalBets: 178000,
    totalWins: 170880,
    image: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80",
    description: "东方巨龙盘旋于全息天际，喷吐数据火焰。",
  },
  {
    name: "黄金之城",
    category: "SLOT",
    targetRtp: 94.5,
    rtp: 92.0,
    playerCount: 987,
    totalBets: 112000,
    totalWins: 105840,
    image: "https://images.unsplash.com/photo-1605870445919-838d190e8e1b?w=600&q=80",
    description: "黄金洪流之城，每一块砖都是赔率的结晶。",
  },
  {
    name: "太空漫游",
    category: "SLOT",
    targetRtp: 98.0,
    rtp: 98.1,
    playerCount: 654,
    totalBets: 76000,
    totalWins: 74480,
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80",
    description: "失重舱内下注，在群星间收割幸运。",
  },
  {
    name: "21点至尊",
    category: "TABLE",
    targetRtp: 99.5,
    rtp: 99.4,
    playerCount: 432,
    totalBets: 54000,
    totalWins: 53730,
    image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=600&q=80",
    description: "破解庄家算法，21 是终极密钥。",
  },
  {
    name: "轮盘大师",
    category: "TABLE",
    targetRtp: 97.3,
    rtp: 96.2,
    playerCount: 321,
    totalBets: 42000,
    totalWins: 40866,
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    description: "红与黑的二进制，命运在转盘上编译。",
  },
  {
    name: "德州扑克",
    category: "TABLE",
    targetRtp: 98.8,
    rtp: 98.9,
    playerCount: 567,
    totalBets: 89000,
    totalWins: 87932,
    image: "https://images.unsplash.com/photo-1541278107931-e006523892df?w=600&q=80",
    description: "心理与概率的全息博弈，诈唬亦是策略。",
  },
  {
    name: "百家乐",
    category: "TABLE",
    targetRtp: 98.9,
    rtp: 98.6,
    playerCount: 789,
    totalBets: 156000,
    totalWins: 154284,
    image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=600&q=80",
    description: "庄闲对决，在光影矩阵中分出胜负。",
  },
  {
    name: "真人骰宝",
    category: "LIVE",
    targetRtp: 97.8,
    rtp: 97.9,
    playerCount: 234,
    totalBets: 34000,
    totalWins: 33252,
    image: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=600&q=80",
    description: "实时直播，三枚数据骰掷出概率之海。",
  },
  {
    name: "龙虎斗",
    category: "LIVE",
    targetRtp: 96.7,
    rtp: 95.0,
    playerCount: 145,
    totalBets: 28000,
    totalWins: 27076,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
    description: "龙与虎的瞬间对决，一张牌定胜负。",
  },
];

// 根据 rtp 与 targetRtp 的偏差推导状态
function deriveStatus(rtp: number, targetRtp: number): "NORMAL" | "WARNING" | "CRITICAL" {
  const diff = rtp - targetRtp;
  if (diff <= -2) return "CRITICAL";
  if (diff <= -1) return "WARNING";
  return "NORMAL";
}

// 生成围绕 rtp 波动的 12 点趋势数据（稳定的伪随机）
function genTrend(rtp: number, seed: number): number[] {
  const points: number[] = [];
  for (let i = 0; i < 12; i++) {
    const wobble = Math.sin(seed * 7.3 + i * 1.7) * 0.8;
    points.push(Math.round((rtp + wobble) * 100) / 100);
  }
  return points;
}

async function main() {
  console.log("🌱 开始播种数据...");

  // 清空旧数据
  await prisma.game.deleteMany();

  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    await prisma.game.create({
      data: {
        name: g.name,
        category: g.category,
        image: g.image,
        rtp: g.rtp,
        targetRtp: g.targetRtp,
        status: deriveStatus(g.rtp, g.targetRtp),
        playerCount: g.playerCount,
        totalBets: g.totalBets,
        totalWins: g.totalWins,
        trend: JSON.stringify(genTrend(g.rtp, i + 1)),
        rank: i + 1,
        isActive: true,
        description: g.description,
      },
    });
    console.log(`  ✓ ${g.name} (${g.category}) — ${deriveStatus(g.rtp, g.targetRtp)}`);
  }

  console.log(`✅ 完成，共插入 ${games.length} 个游戏。`);
}

main()
  .catch((e) => {
    console.error("❌ 播种失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
