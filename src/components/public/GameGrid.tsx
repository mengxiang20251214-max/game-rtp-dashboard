"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Game } from "@/types";
import GameCard from "./GameCard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 18, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1    },
};

interface GameGridProps {
  games: Game[];
  sectionTitle?: string;
}

export default function GameGrid({ games, sectionTitle }: GameGridProps) {
  const t = useTranslations("grid");

  if (games.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-[20px] border py-24 text-center"
        style={{ borderColor: "rgba(174,184,208,0.14)", borderStyle: "dashed" }}
      >
        <span
          className="font-mono text-4xl"
          style={{ color: "rgba(55,182,255,0.25)" }}
        >
          ∅
        </span>
        <p className="mt-4 font-display text-sm text-content-secondary">
          {t("empty")}
        </p>
      </div>
    );
  }

  // 找出 playerCount 最高的 index，作为 isFeature（黄金卡）
  const featureIdx = games.reduce(
    (best, g, i) => (g.playerCount > games[best].playerCount ? i : best),
    0
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* 区块标题 */}
      {sectionTitle && (
        <div className="flex items-center gap-4">
          <div
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(174,184,208,0.24))",
            }}
          />
          <h2
            className="shrink-0 font-serif text-lg sm:text-2xl font-bold"
            style={{ color: "#d3dae9" }}
          >
            {sectionTitle}
          </h2>
          <div
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(90deg, rgba(174,184,208,0.24), transparent)",
            }}
          />
        </div>
      )}

      <motion.div
        key={games.map((g) => g.id).join("-")}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 sm:gap-[28px]"
      >
        <AnimatePresence mode="popLayout">
          {games.map((game, i) => (
            <motion.div key={game.id} variants={cardVariants} transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
              <GameCard
                game={game}
                isFeature={i === featureIdx}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
