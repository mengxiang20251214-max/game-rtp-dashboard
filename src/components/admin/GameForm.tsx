"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Category, CategoryItem, Game } from "@/types";

type FormState = {
  name: string;
  category: Category;
  image: string;
  rtp: string;
  targetRtp: string;
  playerCount: string;
  totalBets: string;
  totalWins: string;
  rank: string;
  isActive: boolean;
  description: string;
  detailUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

function toFormState(game?: Game): FormState {
  return {
    name: game?.name ?? "",
    category: game?.category ?? "SLOT",
    image: game?.image ?? "",
    rtp: game ? String(game.rtp) : "0",
    targetRtp: game ? String(game.targetRtp) : "96.5",
    playerCount: game ? String(game.playerCount) : "0",
    totalBets: game ? String(game.totalBets) : "0",
    totalWins: game ? String(game.totalWins) : "0",
    rank: game ? String(game.rank) : "0",
    isActive: game?.isActive ?? true,
    description: game?.description ?? "",
    detailUrl: game?.detailUrl ?? "",
    seoTitle: game?.seoTitle ?? "",
    seoDescription: game?.seoDescription ?? "",
    seoKeywords: game?.seoKeywords ?? "",
  };
}

const MAX_IMG_BYTES = 2 * 1024 * 1024; // 2 MB

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-content-primary outline-none transition-all focus:border-neon-blue focus:shadow-neon-blue";
const labelCls = "mb-1.5 block text-xs text-content-secondary";

export default function GameForm({
  game,
  categories,
}: {
  game?: Game;
  categories: CategoryItem[];
}) {
  const router = useRouter();
  const t = useTranslations("admin.form");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(game);
  const [form, setForm] = useState<FormState>(() => toFormState(game));
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imgTab, setImgTab] = useState<"url" | "upload">(
    game?.image?.startsWith("data:") ? "upload" : "url"
  );
  const fileRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMG_BYTES) {
      setImgError("图片过大（最大 2 MB）");
      return;
    }
    setImgError("");
    const reader = new FileReader();
    reader.onload = () => update("image", reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError(t("nameRequired"));
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      image: form.image.trim() || null,
      rtp: Number(form.rtp) || 0,
      targetRtp: Number(form.targetRtp) || 0,
      playerCount: Number(form.playerCount) || 0,
      totalBets: Number(form.totalBets) || 0,
      totalWins: Number(form.totalWins) || 0,
      rank: Number(form.rank) || 0,
      isActive: form.isActive,
      description: form.description.trim() || null,
      detailUrl: form.detailUrl.trim() || null,
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
      seoKeywords: form.seoKeywords.trim() || null,
    };

    try {
      const res = await fetch(isEdit ? `/api/games/${game!.id}` : "/api/games", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || t("saveFailed"));
        setSaving(false);
        return;
      }
      router.push("/admin/games");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(t("networkError"));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-rtp-danger/30 bg-rtp-danger/10 px-4 py-2 text-sm text-rtp-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t("name")}</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder={t("namePlaceholder")}
          />
        </div>

        <div>
          <label className={labelCls}>{t("category")}</label>
          <select
            className={inputCls}
            value={form.category}
            onChange={(e) => update("category", e.target.value as Category)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name} className="bg-bg-card">
                {c.icon ? `${c.icon} ` : ""}
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* 图片：URL 或 本地上传 */}
        <div className="sm:col-span-2">
          <label className={labelCls}>{t("image")}</label>

          {/* Tab 切换 */}
          <div className="mb-2 flex gap-1 rounded-lg border border-white/10 p-1 text-xs w-fit">
            <button
              type="button"
              onClick={() => setImgTab("url")}
              className={`rounded px-3 py-1 transition-all ${
                imgTab === "url"
                  ? "bg-neon-blue/20 text-neon-blue"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setImgTab("upload")}
              className={`rounded px-3 py-1 transition-all ${
                imgTab === "upload"
                  ? "bg-neon-blue/20 text-neon-blue"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              上传图片
            </button>
          </div>

          {imgTab === "url" ? (
            <input
              className={inputCls}
              value={form.image.startsWith("data:") ? "" : form.image}
              onChange={(e) => update("image", e.target.value)}
              placeholder="https://…"
            />
          ) : (
            <div className="space-y-2">
              {/* 点击区域 */}
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-black/20 px-4 py-6 transition-all hover:border-neon-blue/40 hover:bg-neon-blue/5"
              >
                {form.image.startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.image}
                    alt="preview"
                    className="max-h-32 max-w-full rounded object-contain"
                  />
                ) : (
                  <>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-content-secondary"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="text-xs text-content-secondary">
                      点击选择图片（PNG / JPG / WebP，≤ 2 MB）
                    </span>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
              {imgError && <p className="text-xs text-rtp-danger">{imgError}</p>}
              {form.image.startsWith("data:") && (
                <button
                  type="button"
                  onClick={() => { update("image", ""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-xs text-content-secondary hover:text-rtp-danger"
                >
                  移除图片
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <label className={labelCls}>{t("rtp")}</label>
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={form.rtp}
            onChange={(e) => update("rtp", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>{t("targetRtp")}</label>
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={form.targetRtp}
            onChange={(e) => update("targetRtp", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>{t("playerCount")}</label>
          <input
            type="number"
            className={inputCls}
            value={form.playerCount}
            onChange={(e) => update("playerCount", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>{t("rank")}</label>
          <input
            type="number"
            className={inputCls}
            value={form.rank}
            onChange={(e) => update("rank", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>{t("totalBets")}</label>
          <input
            type="number"
            className={inputCls}
            value={form.totalBets}
            onChange={(e) => update("totalBets", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>{t("totalWins")}</label>
          <input
            type="number"
            className={inputCls}
            value={form.totalWins}
            onChange={(e) => update("totalWins", e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>{t("description")}</label>
          <textarea
            className={`${inputCls} min-h-[72px] resize-y`}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder={t("descriptionPlaceholder")}
          />
        </div>

        {/* 详情跳转链接 */}
        <div className="sm:col-span-2">
          <label className={labelCls}>详情跳转链接（「查看详情」按钮目标 URL）</label>
          <input
            className={inputCls}
            value={form.detailUrl}
            onChange={(e) => update("detailUrl", e.target.value)}
            placeholder="https://example.com/game/mahjong-ways"
          />
          <p className="mt-1 text-[10px] text-content-secondary/60">
            填写后前台「查看详情」会跳转到此地址（新标签页打开），留空则按钮置灰
          </p>
        </div>

        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => update("isActive", e.target.checked)}
            className="h-4 w-4 accent-neon-blue"
          />
          <span className="text-sm text-content-secondary">{t("isActive")}</span>
        </label>
      </div>

      {/* SEO 设置 */}
      <fieldset className="space-y-4 rounded-xl border border-white/10 p-4">
        <legend className="px-2 font-display text-xs uppercase tracking-wider text-neon-purple">
          {t("seoSection")}
        </legend>

        <div>
          <label className={labelCls}>{t("seoTitle")}</label>
          <input
            className={inputCls}
            value={form.seoTitle}
            onChange={(e) => update("seoTitle", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>{t("seoDescription")}</label>
          <textarea
            className={`${inputCls} min-h-[60px] resize-y`}
            value={form.seoDescription}
            onChange={(e) => update("seoDescription", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>{t("seoKeywords")}</label>
          <input
            className={inputCls}
            value={form.seoKeywords}
            onChange={(e) => update("seoKeywords", e.target.value)}
            placeholder="RTP, slot, casino"
          />
        </div>
      </fieldset>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-neon-blue/40 bg-neon-blue/10 px-6 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-neon-blue transition-all hover:bg-neon-blue/20 hover:shadow-neon-blue disabled:opacity-50"
        >
          {saving ? tCommon("saving") : isEdit ? t("update") : t("create")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/games")}
          className="rounded-lg border border-white/10 px-6 py-2.5 text-sm text-content-secondary transition-all hover:text-content-primary"
        >
          {tCommon("cancel")}
        </button>
      </div>
    </form>
  );
}
