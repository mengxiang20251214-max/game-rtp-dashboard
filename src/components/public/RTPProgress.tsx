"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Status } from "@/types";
import { rtpColor, formatRtp } from "@/lib/game-utils";

interface RTPProgressProps {
  rtp: number;
  targetRtp: number;
  status: Status;
}

export default function RTPProgress({ rtp, targetRtp, status }: RTPProgressProps) {
  const t = useTranslations("rtp");
  const color = rtpColor(status);
  // 以 max(rtp,target)*1.02 为满量程，使目标线可见
  const scaleMax = Math.max(rtp, targetRtp) * 1.02;
  const fillPct = scaleMax > 0 ? Math.min(100, (rtp / scaleMax) * 100) : 0;
  const targetPct = scaleMax > 0 ? Math.min(100, (targetRtp / scaleMax) * 100) : 0;

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-wider text-content-secondary">
          {t("realtime")}
        </span>
        <span
          className="font-display text-base font-bold"
          style={{ color, textShadow: `0 0 10px ${color}66` }}
        >
          {formatRtp(rtp)}
        </span>
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-track ring-1 ring-border-subtle/10">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            boxShadow: `0 0 12px ${color}99`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        {/* 目标 RTP 标记线 */}
        <div
          className="absolute top-0 h-full w-px bg-white/70"
          style={{ left: `${targetPct}%` }}
          title={t("target", { value: formatRtp(targetRtp) })}
        />
      </div>

      <div className="mt-1 flex justify-end">
        <span className="text-[10px] text-content-secondary">
          {t("target", { value: formatRtp(targetRtp) })}
        </span>
      </div>
    </div>
  );
}
