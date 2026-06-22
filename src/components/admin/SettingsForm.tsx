"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { SiteSettings } from "@/types";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-content-primary outline-none focus:border-neon-blue";

const MAX_LOGO_BYTES = 300 * 1024; // 300KB

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const t = useTranslations("admin.settings");
  const fileRef = useRef<HTMLInputElement>(null);
  const [siteTitle, setSiteTitle] = useState(initial.siteTitle);
  const [copyright, setCopyright] = useState(initial.copyright);
  const [logo, setLogo] = useState(initial.logo);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setError(t("logoTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    setBusy(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: [
          { key: "siteTitle", value: siteTitle, type: "text" },
          { key: "copyright", value: copyright, type: "text" },
          { key: "logo", value: logo, type: "image" },
        ],
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setError(json.error || t("saveFailed"));
      return;
    }
    setMsg(t("saved"));
    router.refresh();
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-5">
      {error && (
        <div className="rounded-lg border border-rtp-danger/30 bg-rtp-danger/10 px-4 py-2 text-sm text-rtp-danger">
          {error}
        </div>
      )}
      {msg && (
        <div className="rounded-lg border border-rtp-success/30 bg-rtp-success/10 px-4 py-2 text-sm text-rtp-success">
          {msg}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs text-content-secondary">{t("siteTitle")}</label>
        <input className={inputCls} value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-content-secondary">{t("copyright")}</label>
        <input className={inputCls} value={copyright} onChange={(e) => setCopyright(e.target.value)} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-content-secondary">{t("logo")}</label>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-white/10 bg-black/40">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="logo" className="max-h-14 max-w-14 object-contain" />
            ) : (
              <span className="text-[10px] text-content-secondary">无</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={onPickLogo}
              className="text-xs text-content-secondary file:mr-3 file:rounded-md file:border-0 file:bg-neon-blue/10 file:px-3 file:py-1.5 file:text-neon-blue"
            />
            <span className="text-[11px] text-content-secondary">{t("logoHint")}</span>
            {logo && (
              <button
                type="button"
                onClick={() => {
                  setLogo("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="self-start text-[11px] text-rtp-danger hover:underline"
              >
                {t("removeLogo")}
              </button>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg border border-neon-blue/40 bg-neon-blue/10 px-6 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-neon-blue hover:bg-neon-blue/20 disabled:opacity-50"
      >
        {busy ? t("saving") : t("save")}
      </button>
    </form>
  );
}
