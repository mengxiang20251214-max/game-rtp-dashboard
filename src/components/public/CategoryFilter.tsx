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
              "font-mono text-[10px] sm:text-xs font-bold uppercase transition-all duration-200",
              isActive
                ? "border-teal-500 text-white shadow-[0_2px_12px_rgba(13,148,136,0.35)]"
                : "border-white/70 bg-white/55 text-slate-600 hover:border-teal-400/70 hover:text-teal-700 hover:bg-white/80",
            ].join(" ")}
            style={{ letterSpacing: "0.13em" }}
          >
            {/* 选中态背景（layoutId 动画滑动） */}
            {isActive && (
              <motion.span
                layoutId="category-active-bg"
                className="absolute inset-0 -z-10 rounded-full bg-teal-500"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {opt.icon && <span className="text-[11px]">{opt.icon}</span>}
            {opt.label}
            <span
              className={[
                "rounded-full px-1 py-0.5 text-[8px] tabular-nums",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-sky-100 text-slate-500",
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
