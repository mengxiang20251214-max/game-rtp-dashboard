"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, LOCALE_LABELS, LOCALE_COOKIE, type Locale } from "@/i18n/config";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(next: Locale) {
    // 写入 cookie（一年有效），随后刷新让服务端按新语言重渲染
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <select
      aria-label="Language"
      value={locale}
      disabled={isPending}
      onChange={(e) => onChange(e.target.value as Locale)}
      className="cursor-pointer rounded-lg border border-white/10 bg-bg-secondary px-2 py-2 text-xs text-content-secondary outline-none transition-all hover:border-neon-blue/40 hover:text-neon-blue focus:border-neon-blue disabled:opacity-60"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l} className="bg-bg-card text-content-primary">
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
