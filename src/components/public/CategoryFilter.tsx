"use client";

import { motion } from "framer-motion";
import type { Category } from "@/types";
import { CATEGORY_OPTIONS } from "@/lib/game-utils";

interface CategoryFilterProps {
  active: Category | "ALL";
  counts: Record<Category | "ALL", number>;
  onChange: (value: Category | "ALL") => void;
}

export default function CategoryFilter({ active, counts, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {CATEGORY_OPTIONS.map((opt) => {
        const isActive = active === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
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
            {opt.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                isActive ? "bg-neon-blue/20 text-neon-blue" : "bg-white/5 text-content-secondary"
              }`}
            >
              {counts[opt.value] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
