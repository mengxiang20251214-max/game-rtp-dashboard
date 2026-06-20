interface StatBadgeProps {
  label: string;
  value: string;
  accent?: "blue" | "purple" | "pink" | "default";
}

const accentMap: Record<NonNullable<StatBadgeProps["accent"]>, string> = {
  blue: "text-neon-blue",
  purple: "text-neon-purple",
  pink: "text-neon-pink",
  default: "text-content-primary",
};

export default function StatBadge({ label, value, accent = "default" }: StatBadgeProps) {
  return (
    <div className="flex flex-col rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/5">
      <span className="text-[10px] uppercase tracking-wider text-content-secondary">
        {label}
      </span>
      <span className={`mt-0.5 font-display text-sm font-semibold ${accentMap[accent]}`}>
        {value}
      </span>
    </div>
  );
}
