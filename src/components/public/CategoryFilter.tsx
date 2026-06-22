"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Category } from "@/types";
import { CATEGORY_FILTER_VALUES } from "@/lib/game-utils";

interface CategoryFilterProps {
  active: Category | "ALL";
  counts: Record<Category | "ALL", number>;
  onChange: (value: Category | "ALL") => void;
}

export default function CategoryFilter({ active, counts, onChange }: CategoryFilterProps) {
  const t = useTranslations("category");

  return (
    <div className="flex flex-wrap items-center gap-3">
      {CATEGORY_FILTER_VALUES.map((value) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`relative flex items-center gap-2 rounded-full border px-5 py-2 font-display text-sm font-medium transition-all ${
              isActive
                ? "border-neon-blue text-neon-blue shadow-neon-blue"
                : "border-white/10 text-content-secondary hover:border-neon-blue/40 hover:text-content-primary"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="category-active-bg"
                className="absolute inset-0 -z-10 rounded-full bg-neon-blue/10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {t(value)}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                isActive ? "bg-neon-blue/20 text-neon-blue" : "bg-white/5 text-content-secondary"
              }`}
            >
              {counts[value] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
