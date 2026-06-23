interface StatBadgeProps {
  label: string;
  value: string;
  accent?: "blue" | "purple" | "pink" | "default";
  compact?: boolean;
}

const accentMap: Record<NonNullable<StatBadgeProps["accent"]>, string> = {
  blue:    "text-aurora",
  purple:  "text-neon-purple",
  pink:    "text-neon-pink",
  default: "text-content-primary",
};

export default function StatBadge({
  label,
  value,
  accent = "default",
  compact = false,
}: StatBadgeProps) {
  return (
    <div
      className={`flex flex-col rounded-lg bg-bg-card/50 ring-1 ring-border-subtle/14 ${
        compact ? "px-2 py-1.5" : "px-3 py-2"
      }`}
    >
      <span
        className={`uppercase tracking-wider text-content-secondary ${
          compact ? "text-[8px]" : "text-[10px]"
        }`}
      >
        {label}
      </span>
      <span
        className={`mt-0.5 font-display font-semibold ${accentMap[accent]} ${
          compact ? "text-[11px]" : "text-sm"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
