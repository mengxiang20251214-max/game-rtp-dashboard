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
    { value: "ALL", label: t("ALL") },
    ...categories.map((c) => ({ value: c.name, label: c.label })),
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
            className="relative flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 sm:px-5 sm:py-2 font-mono text-[10px] sm:text-[11px] font-bold uppercase transition-all duration-200"
            style={{
              letterSpacing: "0.14em",
              borderColor: isActive
                ? "rgba(63,208,201,0.55)"
                : "rgba(174,184,208,0.14)",
              background: isActive
                ? "rgba(63,208,201,0.12)"
                : "transparent",
              color: isActive ? "#3fd0c9" : "#8b96b4",
              boxShadow: isActive
                ? "0 0 16px rgba(63,208,201,0.18)"
                : "none",
            }}
          >
            {/* 发光圆点（选中态） */}
            {isActive && (
              <motion.span
                layoutId="cat-dot"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: "#3fd0c9", boxShadow: "0 0 6px rgba(63,208,201,0.80)" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            {opt.label}
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] tabular-nums"
              style={{
                background: isActive ? "rgba(63,208,201,0.18)" : "rgba(174,184,208,0.08)",
                color: isActive ? "#3fd0c9" : "#5d6b91",
              }}
            >
              {counts[opt.value] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
