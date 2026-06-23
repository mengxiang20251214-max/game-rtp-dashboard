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

export default function CategoryFilter({
  active,
  categories,
  counts,
  onChange,
}: CategoryFilterProps) {
  const t = useTranslations("category");

  const options = [
    { value: "ALL", label: t("ALL"), icon: "" },
    ...categories.map((c) => ({ value: c.name, label: c.label, icon: c.icon ?? "" })),
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {options.map((opt) => {
        const isActive = active === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "relative flex items-center gap-2 rounded-full border px-5 py-2",
              "font-mono text-xs font-bold uppercase transition-all",
              isActive
                ? "border-neon-blue text-neon-blue shadow-neon-blue"
                : "border-white/15 text-content-secondary hover:border-neon-blue/40 hover:text-content-primary",
            ].join(" ")}
            style={
              isActive
                ? { letterSpacing: "0.16em", filter: "drop-shadow(0 0 4px rgba(0,240,255,0.4))" }
                : { letterSpacing: "0.16em" }
            }
          >
            {isActive && (
              <motion.span
                layoutId="category-active-bg"
                className="absolute inset-0 -z-10 rounded-full bg-neon-blue/10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {opt.icon ? `${opt.icon} ` : ""}
            {opt.label}
            <span
              className={[
                "rounded-full px-1.5 py-0.5 text-[9px] tabular-nums",
                isActive
                  ? "bg-neon-blue/20 text-neon-blue"
                  : "bg-white/5 text-content-secondary",
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
