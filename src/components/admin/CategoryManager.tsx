"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export interface AdminCategory {
  id: string;
  name: string;
  label: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  gameCount: number;
}

type Draft = {
  id: string | null;
  name: string;
  label: string;
  icon: string;
  sortOrder: string;
  isActive: boolean;
};

const empty: Draft = { id: null, name: "", label: "", icon: "", sortOrder: "0", isActive: true };

// 常用图标快捷选择
const EMOJI_PRESETS = ["🎰", "🎲", "🎯", "🃏", "🎮", "🎪", "🏆", "⭐", "🔥", "📺", "♠️", "💎"];

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-content-primary outline-none focus:border-neon-blue";

export default function CategoryManager({ initial }: { initial: AdminCategory[] }) {
  const router = useRouter();
  const t = useTranslations("admin.categories");
  const [cats, setCats] = useState<AdminCategory[]>(initial);
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isEdit = draft.id !== null;

  async function reload() {
    const res = await fetch("/api/admin/categories", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setCats(json.data);
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!draft.name.trim() || !draft.label.trim()) {
      setError(t("required"));
      return;
    }
    setBusy(true);
    const payload = {
      name: draft.name.trim(),
      label: draft.label.trim(),
      icon: draft.icon.trim() || null,
      sortOrder: Number(draft.sortOrder) || 0,
      isActive: draft.isActive,
    };
    const res = await fetch(
      isEdit ? `/api/admin/categories/${draft.id}` : "/api/admin/categories",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setError(json.error || t("saveFailed"));
      return;
    }
    setDraft(empty);
    await reload();
  }

  async function remove(c: AdminCategory) {
    if (!confirm(t("confirmDelete", { label: c.label }))) return;
    setBusy(true);
    const res = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      alert(json.error || t("deleteFailed"));
      return;
    }
    await reload();
  }

  return (
    <div className="space-y-6">
      {/* 新增 / 编辑表单 */}
      <form
        onSubmit={submit}
        className="rounded-xl border border-white/10 bg-bg-card/60 p-4"
      >
        <h2 className="mb-3 font-display text-sm font-bold text-content-primary">
          {isEdit ? t("editTitle") : t("addTitle")}
        </h2>
        {error && <p className="mb-2 text-xs text-rtp-danger">{error}</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="col-span-1">
            <label className="mb-1 block text-[11px] text-content-secondary">{t("code")}</label>
            <input
              className={inputCls}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="SLOT"
              disabled={isEdit}
            />
          </div>
          <div className="col-span-1">
            <label className="mb-1 block text-[11px] text-content-secondary">{t("label")}</label>
            <input
              className={inputCls}
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="Slot"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1 block text-[11px] text-content-secondary">{t("icon")}</label>
            <input
              className={inputCls}
              value={draft.icon}
              onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
              placeholder="🎰"
            />
            <div className="mt-1.5 flex flex-wrap gap-1">
              {EMOJI_PRESETS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setDraft({ ...draft, icon: em })}
                  className={`rounded border px-1.5 py-0.5 text-sm transition-colors ${
                    draft.icon === em
                      ? "border-neon-blue bg-neon-blue/10"
                      : "border-white/10 hover:border-neon-blue/40"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-1">
            <label className="mb-1 block text-[11px] text-content-secondary">{t("sortOrder")}</label>
            <input
              type="number"
              className={inputCls}
              value={draft.sortOrder}
              onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })}
            />
          </div>
          <div className="col-span-1 flex items-end gap-2">
            <label className="flex items-center gap-1.5 text-xs text-content-secondary">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                className="h-4 w-4 accent-neon-blue"
              />
              {t("active")}
            </label>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg border border-neon-blue/40 bg-neon-blue/10 px-4 py-2 text-sm font-semibold text-neon-blue hover:bg-neon-blue/20 disabled:opacity-50"
          >
            {isEdit ? t("update") : t("create")}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={() => setDraft(empty)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-content-secondary"
            >
              {t("cancel")}
            </button>
          )}
        </div>
      </form>

      {/* 分类列表 */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-content-secondary">
              <th className="px-4 py-3">{t("sortOrder")}</th>
              <th className="px-4 py-3">{t("code")}</th>
              <th className="px-4 py-3">{t("label")}</th>
              <th className="px-4 py-3">{t("active")}</th>
              <th className="px-4 py-3">{t("gameCount")}</th>
              <th className="px-4 py-3 text-right">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 text-content-secondary">{c.sortOrder}</td>
                <td className="px-4 py-3 font-display text-content-primary">
                  {c.icon} {c.name}
                </td>
                <td className="px-4 py-3 text-content-primary">{c.label}</td>
                <td className="px-4 py-3">
                  {c.isActive ? (
                    <span className="text-rtp-success">●</span>
                  ) : (
                    <span className="text-content-secondary">○</span>
                  )}
                </td>
                <td className="px-4 py-3 text-content-secondary">{c.gameCount}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() =>
                        setDraft({
                          id: c.id,
                          name: c.name,
                          label: c.label,
                          icon: c.icon ?? "",
                          sortOrder: String(c.sortOrder),
                          isActive: c.isActive,
                        })
                      }
                      className="rounded-md border border-white/10 px-3 py-1 text-xs text-content-secondary hover:border-neon-blue/40 hover:text-neon-blue"
                    >
                      {t("edit")}
                    </button>
                    <button
                      onClick={() => remove(c)}
                      disabled={busy}
                      className="rounded-md border border-rtp-danger/30 px-3 py-1 text-xs text-rtp-danger hover:bg-rtp-danger/10"
                    >
                      {t("delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
