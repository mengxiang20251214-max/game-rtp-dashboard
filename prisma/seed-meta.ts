import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 5 个初始分类（label 为前台展示用印尼语）
const categories = [
  { name: "SLOT", label: "Slot", icon: "🎰", sortOrder: 1 },
  { name: "TABLE", label: "Meja", icon: "🎲", sortOrder: 2 },
  { name: "LIVE", label: "Langsung", icon: "🎯", sortOrder: 3 },
  { name: "POKER", label: "Poker", icon: "🃏", sortOrder: 4 },
  { name: "CASUAL", label: "Kasual", icon: "🎮", sortOrder: 5 },
];

const settings = [
  { key: "siteTitle", value: "RTP 数据中枢 · Game RTP Dashboard", type: "text" },
  { key: "copyright", value: "RTP 数据中枢 · 仅供演示", type: "text" },
  { key: "logo", value: "", type: "image" },
];

async function main() {
  console.log("🌱 播种分类与站点设置...");

  // 1) 分类（按 name upsert，幂等）
  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c.name },
      create: { ...c, isActive: true },
      update: { label: c.label, icon: c.icon, sortOrder: c.sortOrder },
    });
    console.log(`  ✓ category ${c.name} → ${c.label}`);
  }

  // 2) 回填 Game.categoryId（按 category 字符串匹配 Category.name）
  const cats = await prisma.category.findMany();
  const byName = new Map(cats.map((c) => [c.name, c.id]));
  let filled = 0;
  const games = await prisma.game.findMany({ select: { id: true, category: true } });
  for (const g of games) {
    const cid = byName.get(g.category);
    if (cid) {
      await prisma.game.update({ where: { id: g.id }, data: { categoryId: cid } });
      filled++;
    }
  }
  console.log(`  ✓ 回填 categoryId: ${filled}/${games.length}`);

  // 3) 站点设置（按 key upsert，幂等；不覆盖已有值）
  for (const s of settings) {
    const existing = await prisma.siteSetting.findUnique({ where: { key: s.key } });
    if (existing) {
      console.log(`  · setting ${s.key} 已存在，跳过`);
      continue;
    }
    await prisma.siteSetting.create({ data: s });
    console.log(`  ✓ setting ${s.key}`);
  }

  console.log("✅ 完成");
}

main()
  .catch((e) => {
    console.error("❌ 失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
