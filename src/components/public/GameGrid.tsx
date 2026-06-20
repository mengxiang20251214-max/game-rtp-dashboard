"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Game } from "@/types";
import GameCard from "./GameCard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export default function GameGrid({ games }: { games: Game[] }) {
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-24 text-center">
        <span className="font-display text-4xl text-neon-blue/30">∅</span>
        <p className="mt-4 text-content-secondary">该分类下暂无游戏</p>
      </div>
    );
  }

  return (
    <motion.div
      key={games.map((g) => g.id).join("-")}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <AnimatePresence mode="popLayout">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
