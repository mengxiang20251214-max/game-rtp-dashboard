"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { CategoryItem } from "@/types";

interface CategoryFilterProps {
  active: string;
  categories: CategoryItem[];
  counts: Record<string, number>;
  onChange: (value: string) => void;
}

export default function CategoryFilter({ active, categories, counts, onChange }: CategoryFilterProps) {
  const t = useTranslations("category");

  const options = [
    { value: "ALL", label: t("ALL"), icon: "🎮" },
    ...categories.map((c) => ({ value: c.name, label: c.label, icon: c.icon ?? "" })),
  ];

  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto sm:flex-wrap sm:justify-center sm:overflow-visible sm:gap-2.5">
      {options.map((opt) => {
        const isActive = active === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "relative flex shrink-0 items-center gap-1.5 rounded-full border",
              "px-3 py-1.5 sm:px-5 sm:py-2",
              "font-mono text-[10px] sm:text-xs font-bold uppercase transition-all",
              isActive
                ? "border-neon-gold text-neon-gold shadow-neon-gold"
                : "border-white/15 text-content-secondary hover:border-neon-gold/40 hover:text-content-primary",
            ].join(" ")}
            style={
              isActive
                ? { letterSpacing: "0.14em", filter: "drop-shadow(0 0 5px rgba(245,158,11,0.5))" }
                : { letterSpacing: "0.14em" }
            }
          >
            {isActive && (
              <motion.span
                layoutId="category-active-bg"
                className="absolute inset-0 -z-10 rounded-full bg-neon-gold/10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {opt.icon && <span className="text-[11px]">{opt.icon}</span>}
            {opt.label}
            <span
              className={[
                "rounded-full px-1 py-0.5 text-[8px] tabular-nums",
                isActive ? "bg-neon-gold/20 text-neon-gold" : "bg-white/5 text-content-secondary",
              ].join(" ")}
            >
              {counts[opt.value] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
