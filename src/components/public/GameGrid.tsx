"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("grid");

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-24 text-center">
        <span className="font-display text-4xl text-neon-blue/30">∅</span>
        <p className="mt-4 text-content-secondary">{t("empty")}</p>
      </div>
    );
  }

  return (
    <motion.div
      key={games.map((g) => g.id).join("-")}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 sm:gap-5"
    >
      <AnimatePresence mode="popLayout">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
