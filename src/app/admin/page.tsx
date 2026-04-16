"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { cn, formatCount, formatRelativeTime } from "@/lib/utils";

/* ══════════════════════════════════════
   型定義
══════════════════════════════════════ */
interface KpiData {
  dau:          number;
  dauChange:    number;
  mau:          number;
  mauChange:    number;
  weeklyPosts:  number;
  postsChange:  number;
  pendingReports: number;
}

interface ReportItem {
  id:          string;
  targetTitle: string;
  authorName:  string;
  reason:      string;
  status:      "pending" | "reviewed" | "action_taken" | "dismissed";
  createdAt:   string;
}

/* ══════════════════════════════════════
   モックデータ
══════════════════════════════════════ */
const MOCK_KPI: KpiData = {
  dau: 8421, dauChange: 12,
  mau: 64200, mauChange: 8,
  weeklyPosts: 142, postsChange: 5,
  pendingReports: 7,
};

const MOCK_REPORTS: ReportItem[] = [
  { id: "r1", targetTitle: "深紅の回廊",   authorName: "夜鷹文庫", reason: "R18相当・年齢設定誤り", status: "pending",     createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "r2", targetTitle: "境界の向こう", authorName: "青嵐",     reason: "著作権侵害の疑い",      status: "pending",     createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "r3", targetTitle: "月夜の怪談",   authorName: "影絵師",   reason: "スパム・広告目的",      status: "action_taken", createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
];

const MOCK_RANKING_AUTHORS = [
  { name: "深夜の蛍",  count: 8 },
  { name: "塩と珊瑚",  count: 6 },
  { name: "雨硝子",    count: 5 },
];

const MOCK_GENRE_DATA = [
  { label: "恋愛",       pct: 30, color: "#7a5dc7" },
  { label: "SF",         pct: 20, color: "#1d9e75" },
  { label: "ファンタジー", pct: 15, color: "#378add" },
  { label: "ホラー",     pct: 10, color: "#d85a30" },
  { label: "その他",     pct: 25, color: "#888780" },
];

/* ══════════════════════════════════════
   サイドバー定義
══════════════════════════════════════ */
type NavItem = {
  id:    string;
  label: string;
  badge?: number;
  icon:  React.ReactNode;
};

/* ══════════════════════════════════════
   メインページ
══════════════════════════════════════ */
export default function AdminPage() {
  const { user } = useAuthStore();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [reports, setReports]     = useState<ReportItem[]>(MOCK_REPORTS);
  const [reportFilter, setReportFilter] = useState<"pending" | "all">("pending");

  const pendingCount = reports.filter(r => r.status === "pending").length;

  const handleReportAction = (id: string, action: "dismiss" | "action") => {
    setReports(rs => rs.map(r =>
      r.id === id
        ? { ...r, status: action === "dismiss" ? "dismissed" : "action_taken" }
        : r
    ));
  };

  const filteredReports = reportFilter === "pending"
    ? reports.filter(r => r.status === "pending")
    : reports;

  return (
    <div className="min-h-dvh bg-bg flex">

      {/* ── サイドバー ── */}
      <aside className="w-[152px] flex-shrink-0 bg-[#100f18] border-r border-border flex flex-col">
        {/* ロゴ */}
        <div className="px-3.5 py-4 border-b border-border">
          <Link href="/" className="font-serif text-[13px] text-accent-lt block">
            Novel<span className="text-accent">Flow</span>
          </Link>
          <span className="text-[9px] text-text-3 mt-0.5 block">Admin Panel</span>
        </div>

        {/* ナビ */}
        <nav className="flex-1 py-2">
          <NavSection label="メイン" />
          {([
            { id: "dashboard", label: "ダッシュボード", icon: <DashIcon /> },
          ] satisfies NavItem[]).map(item => (
            <NavLink key={item.id} item={item} active={activeNav === item.id} onClick={setActiveNav} />
          ))}

          <NavSection label="コンテンツ" />
          {([
            { id: "works",   label: "作品管理",   icon: <WorksIcon />,  badge: 0 },
            { id: "reports", label: "通報管理",   icon: <ReportIcon />, badge: pendingCount },
          ] satisfies NavItem[]).map(item => (
            <NavLink key={item.id} item={item} active={activeNav === item.id} onClick={setActiveNav} />
          ))}

          <NavSection label="ユーザー" />
          {([
            { id: "users",  label: "ユーザー管理", icon: <UsersIcon /> },
          ] satisfies NavItem[]).map(item => (
            <NavLink key={item.id} item={item} active={activeNav === item.id} onClick={setActiveNav} />
          ))}

          <NavSection label="システム" />
          {([
            { id: "settings", label: "システム設定", icon: <SettingsIcon /> },
          ] satisfies NavItem[]).map(item => (
            <NavLink key={item.id} item={item} active={activeNav === item.id} onClick={setActiveNav} />
          ))}
        </nav>

        {/* フッター */}
        <Link href="/"
          className="flex items-center gap-2 px-3.5 py-3 border-t border-border text-[11px] text-text-3 hover:text-text-2 transition-colors">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 12L6 8l4-4"/></svg>
          サイトへ戻る
        </Link>
      </aside>

      {/* ── メインコンテンツ ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* トップバー */}
        <div className="flex items-center justify-between px-5 h-12 bg-[#100f18] border-b border-border flex-shrink-0">
          <div>
            <h1 className="text-[14px] font-medium text-text-1">ダッシュボード</h1>
            <p className="text-[10px] text-text-3">集計期間：週次</p>
          </div>
          <div className="flex gap-2">
            <button className="text-[11px] px-3 py-1.5 rounded-lg bg-white/5 border border-border text-text-2 hover:border-border-2 transition-colors">
              CSVエクスポート
            </button>
            <button className="text-[11px] px-3 py-1.5 rounded-lg bg-accent-2 text-white hover:bg-accent transition-colors">
              レポート生成
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

          {/* KPI カード */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="DAU（日次）" value={formatCount(MOCK_KPI.dau)} change={MOCK_KPI.dauChange} up />
            <KpiCard label="MAU（月次）" value={formatCount(MOCK_KPI.mau)} change={MOCK_KPI.mauChange} up />
            <KpiCard label="週間投稿数" value={String(MOCK_KPI.weeklyPosts)} change={MOCK_KPI.postsChange} up />
            <KpiCard
              label="未処理通報"
              value={String(MOCK_KPI.pendingReports)}
              change={0}
              up={false}
              danger={MOCK_KPI.pendingReports > 0}
            />
          </div>

          {/* グラフ＋ジャンル */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
            {/* 折れ線グラフ */}
            <div className="bg-bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[12px] font-medium text-text-2">PV・新規登録の推移</p>
                <div className="flex gap-1">
                  {["7日","30日","90日"].map((p, i) => (
                    <button key={p}
                      className={cn("text-[10px] px-2.5 py-1 rounded-xl border transition-all",
                        i === 0 ? "bg-accent-dim border-accent-lt/30 text-accent-lt" : "border-border text-text-3")}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <LineChart />
              <div className="flex gap-4 mt-3">
                <ChartLegend color="#7a5dc7" label="PV" />
                <ChartLegend color="#1d9e75" label="新規登録" />
              </div>
            </div>

            {/* ジャンル分布 */}
            <div className="bg-bg-card border border-border rounded-lg p-4">
              <p className="text-[12px] font-medium text-text-2 mb-4">人気ジャンル分布</p>
              <DonutChart data={MOCK_GENRE_DATA} />
              <div className="flex flex-col gap-1.5 mt-4">
                {MOCK_GENRE_DATA.map(g => (
                  <div key={g.label} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: g.color }} />
                    <span className="text-[11px] text-text-2 flex-1">{g.label}</span>
                    <span className="text-[11px] font-medium text-text-1">{g.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 審査キュー */}
          <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-[12px] font-medium text-text-2">コンテンツ審査キュー</p>
              <div className="flex gap-1">
                {([["pending","未処理"], ["all","すべて"]] as const).map(([f, l]) => (
                  <button key={f} onClick={() => setReportFilter(f)}
                    className={cn("text-[10px] px-2.5 py-1 rounded-xl border transition-all",
                      reportFilter === f
                        ? "bg-coral/20 border-coral/30 text-[#f0997b]"
                        : "border-border text-text-3 hover:text-text-2")}>
                    {l}{f === "pending" && pendingCount > 0 && ` (${pendingCount})`}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-[#141320]">
                    {["作品名","作者","通報理由","通報日","ステータス","操作"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-normal text-text-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(r => (
                    <tr key={r.id} className="border-b border-white/4 last:border-b-0 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-[11px] text-text-1">{r.targetTitle}</td>
                      <td className="px-4 py-3 text-[11px] text-text-2">{r.authorName}</td>
                      <td className="px-4 py-3 text-[11px] text-text-2">{r.reason}</td>
                      <td className="px-4 py-3 text-[11px] text-text-3 whitespace-nowrap">{formatRelativeTime(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <ReportStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {r.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleReportAction(r.id, "action")}
                                className="text-[10px] px-2.5 py-1 rounded-md bg-accent-dim border border-accent-lt/25 text-accent-lt hover:bg-accent/20 transition-colors whitespace-nowrap">
                                対応する
                              </button>
                              <button
                                onClick={() => handleReportAction(r.id, "dismiss")}
                                className="text-[10px] px-2.5 py-1 rounded-md bg-white/4 border border-border text-text-3 hover:text-text-2 hover:border-border-2 transition-colors">
                                却下
                              </button>
                            </>
                          )}
                          {r.status !== "pending" && (
                            <span className="text-[10px] text-text-3">処理済み</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[12px] text-text-3">
                        未処理の通報はありません ✓
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 下段：投稿ランキング＋新規登録バーチャート */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 投稿数ランキング */}
            <div className="bg-bg-card border border-border rounded-lg p-4">
              <p className="text-[12px] font-medium text-text-2 mb-4">投稿数ランキング（週）</p>
              <div className="flex flex-col gap-3">
                {MOCK_RANKING_AUTHORS.map((a, i) => (
                  <div key={a.name} className="flex items-center gap-3">
                    <span className={cn(
                      "font-serif text-[18px] min-w-[20px] text-center",
                      i === 0 ? "text-amber" : i === 1 ? "text-[#B4B2A9]" : "text-[#f0997b]"
                    )}>{i + 1}</span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium text-accent-lt"
                      style={{ background: "rgba(122,93,199,0.3)" }}>
                      {a.name.charAt(0)}
                    </div>
                    <span className="flex-1 text-[12px] text-text-1">{a.name}</span>
                    <span className="text-[11px] text-accent">{a.count}話</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 新規登録バーチャート */}
            <div className="bg-bg-card border border-border rounded-lg p-4">
              <p className="text-[12px] font-medium text-text-2 mb-4">新規登録数（日別・今週）</p>
              <BarChart />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   サブコンポーネント
══════════════════════════════════════ */

/* サイドバーナビ */
function NavSection({ label }: { label: string }) {
  return (
    <p className="text-[9px] text-text-3 px-3.5 pt-3 pb-1 uppercase tracking-widest">{label}</p>
  );
}
function NavLink({ item, active, onClick }: {
  item: NavItem; active: boolean; onClick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(item.id)}
      className={cn(
        "w-full flex items-center gap-2 px-3.5 py-2 text-[11px] transition-all",
        "border-l-2",
        active
          ? "bg-accent/15 border-l-accent text-accent-lt"
          : "border-l-transparent text-text-2 hover:bg-white/3 hover:text-text-1"
      )}
    >
      <span className="w-4 flex-shrink-0 flex items-center justify-center">{item.icon}</span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-coral/25 text-[#f0997b]">
          {item.badge}
        </span>
      )}
    </button>
  );
}

/* KPIカード */
function KpiCard({ label, value, change, up, danger = false }: {
  label: string; value: string; change: number; up: boolean; danger?: boolean;
}) {
  return (
    <div className="bg-bg-card border border-border rounded-lg p-4">
      <p className="text-[10px] text-text-3 mb-2">{label}</p>
      <p className={cn("text-[22px] font-medium leading-none mb-1.5", danger ? "text-[#f0997b]" : "text-text-1")}>
        {value}
      </p>
      {change !== 0 && (
        <p className={cn("text-[10px] flex items-center gap-1",
          up ? "text-[#5dcaa5]" : "text-[#f0997b]")}>
          {up ? "▲" : "▼"} {Math.abs(change)}% {up ? "先週比" : "要対応"}
        </p>
      )}
    </div>
  );
}

/* 通報ステータスバッジ */
function ReportStatusBadge({ status }: { status: ReportItem["status"] }) {
  const map = {
    pending:      { label: "確認待ち",  cls: "bg-amber/15 text-amber" },
    reviewed:     { label: "確認済み",  cls: "bg-blue/15 text-[#85b7eb]" },
    action_taken: { label: "非公開済み", cls: "bg-coral/15 text-[#f0997b]" },
    dismissed:    { label: "却下済み",  cls: "bg-white/7 text-text-3" },
  };
  const s = map[status];
  return (
    <span className={cn("text-[9.5px] px-2 py-0.5 rounded-md", s.cls)}>{s.label}</span>
  );
}

/* 折れ線グラフ（SVG） */
function LineChart() {
  return (
    <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="none">
      <defs>
        <linearGradient id="gPV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a5dc7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7a5dc7" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gNew" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d9e75" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1d9e75" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* PV面 */}
      <path d="M0,60 C30,55 60,35 90,40 C120,45 150,22 180,24 C210,26 240,16 270,18 L300,14 L300,80 L0,80Z"
        fill="url(#gPV)" />
      <path d="M0,60 C30,55 60,35 90,40 C120,45 150,22 180,24 C210,26 240,16 270,18 L300,14"
        fill="none" stroke="#7a5dc7" strokeWidth="1.5" />
      {/* 新規面 */}
      <path d="M0,68 C30,65 60,60 90,61 C120,62 150,55 180,52 C210,50 240,48 270,45 L300,43 L300,80 L0,80Z"
        fill="url(#gNew)" />
      <path d="M0,68 C30,65 60,60 90,61 C120,62 150,55 180,52 C210,50 240,48 270,45 L300,43"
        fill="none" stroke="#1d9e75" strokeWidth="1.5" />
      {/* X軸ラベル */}
      {["月","火","水","木","金","土","日"].map((d, i) => (
        <text key={d} x={i * 43 + 3} y={79} fontSize="7" fill="rgba(255,255,255,0.25)">{d}</text>
      ))}
    </svg>
  );
}

/* ドーナツグラフ（SVG） */
function DonutChart({ data }: { data: typeof MOCK_GENRE_DATA }) {
  const total = data.reduce((s, d) => s + d.pct, 0);
  const r = 40, cx = 60, cy = 50;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map(d => {
    const dash = (d.pct / total) * circ;
    const slice = { ...d, dash, offset };
    offset += dash;
    return slice;
  });
  return (
    <svg width="120" height="100" viewBox="0 0 120 100">
      {slices.map(s => (
        <circle
          key={s.label}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={14}
          strokeDasharray={`${s.dash} ${circ - s.dash}`}
          strokeDashoffset={-s.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)">ジャンル</text>
    </svg>
  );
}

/* バーチャート */
function BarChart() {
  const bars = [55, 70, 45, 80, 60, 90, 100];
  const days = ["月","火","水","木","金","土","日"];
  return (
    <div className="flex items-end gap-1.5 h-[60px]">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={cn(
              "w-full rounded-t-sm transition-all",
              i === bars.length - 1 ? "bg-accent" : "bg-accent/30"
            )}
            style={{ height: `${h}%` }}
          />
          <span className={cn(
            "text-[9px]",
            i === bars.length - 1 ? "text-accent-lt" : "text-text-3"
          )}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function ChartLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-0.5 rounded-full" style={{ background: color }} />
      <span className="text-[10px] text-text-3">{label}</span>
    </div>
  );
}

/* ── アイコン ── */
const DashIcon = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>;
const WorksIcon = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 2h8l2 3v9H2V5z"/><path d="M4 2v4h8V2"/></svg>;
const ReportIcon = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 3h10v8H3z"/><path d="M5 6h6M5 9h4"/></svg>;
const UsersIcon = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>;
const SettingsIcon = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/></svg>;
