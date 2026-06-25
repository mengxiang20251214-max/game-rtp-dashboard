"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── 类型（与 API 返回结构对齐） ───────────────────────────────────────────
interface ChangeRow {
  id: string;
  name: string;
  before: { rtp: number; playerCount: number; totalBets: number };
  after: { rtp: number; playerCount: number; totalBets: number };
}
interface PreviewData {
  dryRun: boolean;
  note: string;
  totalGames: number;
  categoryCounts: Record<string, number>;
  statusCounts: { hot: number; popular: number; new: number };
  rtpRange: { min: number; max: number; avg: number };
  playerRange: { min: number; max: number; total: number };
  betRange: { min: number; max: number; total: number };
  changes: ChangeRow[];
}
interface BackupMeta {
  hasBackup: boolean;
  backupId?: string;
  createdAt?: string;
  gameCount?: number;
  operator?: string | null;
}

// ── 格式化（后台展示用，简单千分位即可） ──────────────────────────────────
const nf = new Intl.NumberFormat("id-ID");
const fmtN = (n: number) => nf.format(Math.round(n));
const fmtIDR = (n: number) => "Rp " + nf.format(Math.round(n));
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

export default function SmartConfigPanel({ initialBackup }: { initialBackup: BackupMeta }) {
  const router = useRouter();
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [backup, setBackup] = useState<BackupMeta>(initialBackup);
  const [loading, setLoading] = useState<"preview" | "apply" | "rollback" | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function call(url: string, body?: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }

  async function onPreview() {
    setError(""); setMsg(""); setLoading("preview");
    try {
      const json = await call("/api/admin/games/smart-config/preview");
      if (!json.ok) { setError(json.error || "生成预览失败"); return; }
      setPreview(json.data as PreviewData);
      setMsg("预览已生成（未写入数据库）。");
    } catch {
      setError("网络错误，生成预览失败");
    } finally {
      setLoading(null);
    }
  }

  async function onApply() {
    if (!preview) return;
    if (!window.confirm(
      "确认应用智能运营配置？\n\n这会先自动备份当前配置，然后批量更新全部游戏的 RTP / 人数 / 投注 / HOT 标记。\n基础信息（名称 / 图片 / 厂商 / 分类）不会改动。"
    )) return;
    setError(""); setMsg(""); setLoading("apply");
    try {
      const json = await call("/api/admin/games/smart-config/apply");
      if (!json.ok) { setError(json.error || "应用失败"); return; }
      const d = json.data;
      setMsg(`已应用并自动备份（backupId: ${d.backupId}）。共更新 ${d.totalGames} 个游戏。`);
      setPreview(null);
      // 刷新备份元信息 + 后台数据
      await refreshBackup();
      router.refresh();
    } catch {
      setError("网络错误，应用失败");
    } finally {
      setLoading(null);
    }
  }

  async function onRollback() {
    if (!backup.hasBackup) return;
    if (!window.confirm(
      `确认恢复上次备份？\n\n备份时间：${backup.createdAt ? new Date(backup.createdAt).toLocaleString() : "-"}\n将恢复 ${backup.gameCount ?? "?"} 个游戏的展示字段（基础信息不变）。`
    )) return;
    setError(""); setMsg(""); setLoading("rollback");
    try {
      const json = await call("/api/admin/games/smart-config/rollback", { confirm: true });
      if (!json.ok) { setError(json.error || "回滚失败"); return; }
      setMsg(`已恢复上次备份，共恢复 ${json.data.restoredCount} 个游戏。`);
      setPreview(null);
      router.refresh();
    } catch {
      setError("网络错误，回滚失败");
    } finally {
      setLoading(null);
    }
  }

  async function refreshBackup() {
    try {
      const res = await fetch("/api/admin/games/smart-config/rollback", { method: "GET" });
      const json = await res.json();
      if (json.ok) setBackup(json.data as BackupMeta);
    } catch { /* 忽略 */ }
  }

  const busy = loading !== null;

  return (
    <section className="mt-10 rounded-xl border border-neon-purple/30 bg-bg-card/60 p-5">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="font-display text-lg font-bold text-content-primary">智能运营配置</h2>
        <span className="rounded-full border border-neon-purple/40 px-2 py-0.5 text-[10px] text-neon-purple">
          一键
        </span>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-content-secondary">
        根据当前游戏自动生成<strong className="text-content-primary">真实感模拟运营配置</strong>
        （RTP / 人数 / 投注 / HOT / PUPULER / NEW）。
        不会修改游戏名称、图片、厂商、分类或接口结构。
        <span className="text-content-weak"> 数据为模拟运营配置，非真实第三方平台数据。</span>
      </p>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onPreview}
          disabled={busy}
          className="rounded-lg border border-neon-blue/40 bg-neon-blue/10 px-4 py-2 font-display text-sm font-semibold text-neon-blue transition-all hover:shadow-neon-blue disabled:opacity-50"
        >
          {loading === "preview" ? "生成中…" : "生成预览"}
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={busy || !preview}
          className="rounded-lg border border-rtp-success/40 bg-rtp-success/10 px-4 py-2 font-display text-sm font-semibold text-rtp-success transition-all hover:shadow-neon-green disabled:opacity-40"
          title={!preview ? "请先生成预览" : undefined}
        >
          {loading === "apply" ? "应用中…" : "确认应用"}
        </button>
        <button
          type="button"
          onClick={onRollback}
          disabled={busy || !backup.hasBackup}
          className="rounded-lg border border-rtp-warning/40 bg-rtp-warning/10 px-4 py-2 font-display text-sm font-semibold text-rtp-warning transition-all disabled:opacity-40"
          title={!backup.hasBackup ? "暂无可恢复的备份" : undefined}
        >
          {loading === "rollback" ? "恢复中…" : "恢复上次备份"}
        </button>
      </div>

      {/* 备份状态 */}
      <p className="mt-2 text-[11px] text-content-weak">
        {backup.hasBackup
          ? `上次备份：${backup.createdAt ? new Date(backup.createdAt).toLocaleString() : "-"} · ${backup.gameCount ?? "?"} 个游戏${backup.operator ? ` · ${backup.operator}` : ""}`
          : "暂无备份（首次应用会自动创建备份）"}
      </p>

      {/* 提示 / 错误 */}
      {msg && <p className="mt-3 rounded-lg border border-rtp-success/30 bg-rtp-success/10 px-3 py-2 text-xs text-rtp-success">{msg}</p>}
      {error && <p className="mt-3 rounded-lg border border-rtp-danger/30 bg-rtp-danger/10 px-3 py-2 text-xs text-rtp-danger">{error}</p>}

      {/* 预览摘要 */}
      {preview && (
        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-neon-blue/20 bg-neon-blue/[0.04] px-3 py-2 text-[11px] text-content-secondary">
            {preview.note}
          </div>

          {/* 统计卡 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="总游戏数" value={String(preview.totalGames)} />
            <Stat label="HOT" value={String(preview.statusCounts.hot)} accent="text-neon-gold" />
            <Stat label="PUPULER" value={String(preview.statusCounts.popular)} accent="text-neon-blue" />
            <Stat label="NEW" value={String(preview.statusCounts.new)} accent="text-rtp-success" />
            <Stat label="RTP 最小 / 最大" value={`${fmtPct(preview.rtpRange.min)} / ${fmtPct(preview.rtpRange.max)}`} />
            <Stat label="RTP 平均" value={fmtPct(preview.rtpRange.avg)} />
            <Stat label="玩家 最小 / 最大" value={`${fmtN(preview.playerRange.min)} / ${fmtN(preview.playerRange.max)}`} />
            <Stat label="玩家 总数" value={fmtN(preview.playerRange.total)} />
            <Stat label="投注 最小" value={fmtIDR(preview.betRange.min)} />
            <Stat label="投注 最大" value={fmtIDR(preview.betRange.max)} />
            <Stat label="投注 总额" value={fmtIDR(preview.betRange.total)} className="col-span-2" />
          </div>

          {/* 分类分布 */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(preview.categoryCounts).map(([cat, n]) => (
              <span key={cat} className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-content-secondary">
                {cat}: <span className="text-content-primary">{n}</span>
              </span>
            ))}
          </div>

          {/* 前 10 个变化对比 */}
          <div>
            <p className="mb-2 text-xs font-semibold text-content-secondary">变化对比（前 10）</p>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-black/30 text-content-weak">
                  <tr>
                    <th className="px-3 py-2">游戏</th>
                    <th className="px-3 py-2">RTP 前→后</th>
                    <th className="px-3 py-2">玩家 前→后</th>
                    <th className="px-3 py-2">投注 前→后</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.changes.map((c) => (
                    <tr key={c.id} className="border-t border-white/5">
                      <td className="px-3 py-2 text-content-primary">{c.name}</td>
                      <td className="px-3 py-2 text-content-secondary">{fmtPct(c.before.rtp)} → <span className="text-neon-blue">{fmtPct(c.after.rtp)}</span></td>
                      <td className="px-3 py-2 text-content-secondary">{fmtN(c.before.playerCount)} → <span className="text-content-primary">{fmtN(c.after.playerCount)}</span></td>
                      <td className="px-3 py-2 text-content-secondary">{fmtIDR(c.before.totalBets)} → <span className="text-content-primary">{fmtIDR(c.after.totalBets)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, accent, className }: { label: string; value: string; accent?: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-black/30 px-3 py-2 ${className ?? ""}`}>
      <p className="text-[10px] uppercase tracking-wide text-content-weak">{label}</p>
      <p className={`mt-1 font-display text-sm font-bold ${accent ?? "text-content-primary"}`}>{value}</p>
    </div>
  );
}
