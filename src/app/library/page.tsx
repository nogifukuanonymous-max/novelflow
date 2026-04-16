"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { GlobalNav, BottomTabBar } from "@/components/layout/Nav";
import { NovelCard } from "@/components/works/WorkCard";
import { ProgressBar } from "@/components/ui";
import { fetchBookmarks } from "@/lib/supabase/queries";
import { MOCK_WORKS } from "@/lib/mock-data";
import { getWorkGradient, cn } from "@/lib/utils";
import type { Bookmark } from "@/types";

type LibTab = "reading" | "bookmarks" | "history";

const FILTERS = ["すべて", "恋愛", "SF", "ファンタジー", "ホラー", "完結のみ"] as const;

/* ══════════════════════════════════════
   履歴モックデータ
══════════════════════════════════════ */
const MOCK_HISTORY = [
  { workId: "work-001", workTitle: "花と雨の形而上学", epTitle: "第3話　交差する夜明け", time: "2時間前" },
  { workId: "work-002", workTitle: "海底の図書館",     epTitle: "第4話　深海の記憶",       time: "昨日" },
  { workId: "work-004", workTitle: "青と銀の境界線",   epTitle: "第7話（完）",             time: "2日前" },
  { workId: "work-003", workTitle: "猫と怪異の方程式", epTitle: "第2話",                   time: "4日前" },
];

/* ══════════════════════════════════════
   メインページ
══════════════════════════════════════ */
export default function LibraryPage() {
  const [tab, setTab]       = useState<LibTab>("reading");
  const [filter, setFilter] = useState("すべて");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks()
      .then(setBookmarks)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-dvh bg-bg">
      <GlobalNav />

      {/* ページ内タブ */}
      <div className="fixed top-[52px] left-0 right-0 z-40 flex border-b border-border backdrop-blur-nav"
        style={{ background: "rgba(10,9,16,0.95)" }}>
        {(["reading","bookmarks","history"] as const).map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-[12px] border-b-2 transition-all duration-200",
              tab === t ? "text-accent-lt border-b-accent" : "text-text-3 border-b-transparent hover:text-text-2"
            )}
          >
            {["読書中", "ブックマーク", "履歴"][i]}
          </button>
        ))}
      </div>

      <div className="pt-[104px] pb-24">
        {/* フィルタバー */}
        <div className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-none border-b border-border">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "text-[11px] px-3 py-1.5 rounded-2xl whitespace-nowrap flex-shrink-0 border transition-all",
                filter === f
                  ? "bg-accent/25 border-accent-lt/35 text-accent-lt"
                  : "bg-bg-card border-border text-text-3 hover:text-text-2"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* 読書中タブ */}
        {tab === "reading" && (
          <ReadingTab bookmarks={bookmarks} loading={loading} />
        )}

        {/* ブックマークタブ */}
        {tab === "bookmarks" && (
          <BookmarksTab bookmarks={bookmarks} loading={loading} />
        )}

        {/* 履歴タブ */}
        {tab === "history" && <HistoryTab />}
      </div>

      <BottomTabBar active="library" />
    </div>
  );
}

/* ══════════════════════════════════════
   読書中タブ
══════════════════════════════════════ */
function ReadingTab({ bookmarks, loading }: { bookmarks: Bookmark[]; loading: boolean }) {
  const resumeWork = MOCK_WORKS[0]; // 最後に読んだ作品（実際はAPI）
  const progress   = { pct: 38, epRead: 3, total: 13 };

  return (
    <div className="px-4 pt-4 flex flex-col gap-6">
      {/* 続きから読む */}
      <div>
        <SectionHeader title="続きから読む" />
        <ResumeCard work={resumeWork} progress={progress} />
      </div>

      {/* フォロー中の新着 */}
      <div>
        <SectionHeader title="フォロー中の新着" action={<MoreLink href="/search" />} />
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
          {MOCK_WORKS.slice(1).map(w => (
            <div key={w.id} className="flex-shrink-0 w-[110px]">
              <NovelCard work={w} className="w-[110px]" />
              <span className="text-[8.5px] mt-1 inline-block px-1.5 py-0.5 rounded-md bg-teal/15 text-[#5dcaa5]">
                NEW 2話
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 最近のブックマーク */}
      <div>
        <SectionHeader title="最近のブックマーク" action={<MoreLink href="/library?tab=bookmarks" />} />
        {loading ? (
          <LoadingSkeleton />
        ) : bookmarks.length > 0 ? (
          <div className="flex flex-col gap-2">
            {bookmarks.slice(0, 3).map(bm => (
              <BookmarkRow key={bm.id} bookmark={bm} />
            ))}
          </div>
        ) : (
          <MockBookmarks />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   ブックマークタブ
══════════════════════════════════════ */
function BookmarksTab({ bookmarks, loading }: { bookmarks: Bookmark[]; loading: boolean }) {
  if (loading) return <div className="px-4 pt-4"><LoadingSkeleton /></div>;

  if (bookmarks.length === 0) {
    return (
      <div className="px-4 pt-4">
        <MockBookmarks showAll />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 flex flex-col gap-2">
      {bookmarks.map(bm => (
        <BookmarkRow key={bm.id} bookmark={bm} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   履歴タブ
══════════════════════════════════════ */
function HistoryTab() {
  return (
    <div className="px-4 pt-4">
      <p className="text-[10px] text-text-3 mb-3">過去30日間</p>
      <div className="flex flex-col">
        {MOCK_HISTORY.map((h, i) => {
          const grad = getWorkGradient(h.workId);
          return (
            <Link
              key={i}
              href={`/works/${h.workId}`}
              className="flex items-center gap-3 py-2.5 px-2 rounded-lg border border-transparent hover:bg-bg-card hover:border-border transition-all"
            >
              <div className="w-7 h-9 rounded flex-shrink-0" style={{ background: grad }} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-text-1 truncate">{h.workTitle}</p>
                <p className="text-[10px] text-text-3 mt-0.5">{h.epTitle}</p>
              </div>
              <span className="text-[10px] text-text-3 flex-shrink-0">{h.time}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   続きから読むカード
══════════════════════════════════════ */
function ResumeCard({ work, progress }: {
  work: typeof MOCK_WORKS[0];
  progress: { pct: number; epRead: number; total: number };
}) {
  const grad = getWorkGradient(work.id);
  return (
    <Link
      href={`/works/${work.id}`}
      className={cn(
        "flex gap-3.5 p-3.5 rounded-xl",
        "bg-bg-card border border-accent/20",
        "hover:border-accent-lt/30 hover:bg-bg-card2 transition-all"
      )}
    >
      <div className="w-14 h-[74px] rounded-lg flex-shrink-0 flex items-center justify-center text-2xl"
        style={{ background: grad }}>
        🌸
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="text-[13px] font-medium text-text-1 mb-0.5">{work.title}</p>
          <p className="text-[11px] text-text-2">第3話　交差する夜明け</p>
        </div>
        <div className="mt-2">
          <ProgressBar value={progress.pct} className="mb-1.5" />
          <div className="flex justify-between text-[10px] text-text-3">
            <span>{progress.epRead}話まで読了</span>
            <span>{progress.pct}%</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-2 flex-shrink-0">
        <button
          onClick={e => { e.preventDefault(); window.location.href = `/works/${work.id}/episodes/ep-003`; }}
          className="text-[11px] px-3 py-1.5 rounded-2xl bg-accent-2 text-white whitespace-nowrap hover:bg-accent transition-colors"
        >
          続きを読む
        </button>
        <button
          onClick={e => { e.preventDefault(); alert("目次を表示"); }}
          className="text-[11px] px-3 py-1.5 rounded-2xl bg-transparent border border-border-2 text-text-2 whitespace-nowrap hover:border-accent hover:text-accent-lt transition-all"
        >
          目次
        </button>
      </div>
    </Link>
  );
}

/* ── ブックマーク行 ── */
function BookmarkRow({ bookmark }: { bookmark: Bookmark }) {
  const grad = getWorkGradient(bookmark.workId);
  return (
    <Link
      href={`/works/${bookmark.workId}`}
      className="flex items-center gap-3 px-3 py-2.5 bg-bg-card border border-border rounded-lg hover:border-accent-lt/20 hover:bg-bg-card2 transition-all"
    >
      <div className="w-10 h-14 rounded flex-shrink-0" style={{ background: grad }} />
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-medium text-text-1 truncate">{bookmark.work.title}</p>
        <p className="text-[10px] text-text-3 mt-0.5">{bookmark.work.author.displayName}</p>
        <div className="flex gap-1.5 mt-1.5 items-center">
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-accent/15 text-accent-lt border border-accent-lt/15">
            {bookmark.work.genre}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-[10px] text-text-3">4話読了</span>
        <span className="text-sm">🔖</span>
      </div>
    </Link>
  );
}

/* ── モックブックマーク（ログイン前 or データなし） ── */
function MockBookmarks({ showAll = false }: { showAll?: boolean }) {
  const items = MOCK_WORKS.slice(0, showAll ? 4 : 2);
  return (
    <div className="flex flex-col gap-2">
      {items.map(w => {
        const grad = getWorkGradient(w.id);
        return (
          <Link key={w.id} href={`/works/${w.id}`}
            className="flex items-center gap-3 px-3 py-2.5 bg-bg-card border border-border rounded-lg hover:border-accent-lt/20 transition-all">
            <div className="w-10 h-14 rounded flex-shrink-0" style={{ background: grad }} />
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-text-1 truncate">{w.title}</p>
              <p className="text-[10px] text-text-3 mt-0.5">{w.author.displayName}</p>
            </div>
            <span className="text-sm text-text-3">🔖</span>
          </Link>
        );
      })}
    </div>
  );
}

/* ── ユーティリティコンポーネント ── */
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[13px] font-medium text-text-1">{title}</p>
      {action}
    </div>
  );
}
function MoreLink({ href }: { href: string }) {
  return <Link href={href} className="text-[11px] text-accent hover:text-accent-lt transition-colors">すべて見る</Link>;
}
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1,2,3].map(i => (
        <div key={i} className="h-16 bg-bg-card rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
