"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { GlobalNav } from "@/components/layout/Nav";
import { NovelCard } from "@/components/works/WorkCard";
import { MOCK_WORKS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Work } from "@/types";

/* ══════════════════════════════════════
   定数
══════════════════════════════════════ */
const GENRES = [
  { value: "",           label: "すべて",      emoji: "✨" },
  { value: "romance",    label: "恋愛",         emoji: "💜" },
  { value: "sf",         label: "SF",           emoji: "🌌" },
  { value: "fantasy",    label: "ファンタジー", emoji: "🗡️" },
  { value: "horror",     label: "ホラー",       emoji: "👻" },
  { value: "mystery",    label: "ミステリー",   emoji: "🔍" },
  { value: "comedy",     label: "コメディ",     emoji: "😂" },
  { value: "historical", label: "歴史・時代",   emoji: "📖" },
  { value: "other",      label: "その他",       emoji: "🎭" },
] as const;

const STATUS_OPTIONS = [
  { value: "",           label: "すべて" },
  { value: "ongoing",    label: "連載中" },
  { value: "completed",  label: "完結" },
  { value: "hiatus",     label: "休載中" },
] as const;

const SORT_OPTIONS = [
  { value: "like",       label: "いいね順" },
  { value: "new",        label: "新着順" },
  { value: "char",       label: "文字数順" },
] as const;

/* ══════════════════════════════════════
   検索ページ
══════════════════════════════════════ */
export default function SearchPage() {
  const [query,  setQuery]  = useState("");
  const [genre,  setGenre]  = useState("");
  const [status, setStatus] = useState("");
  const [sort,   setSort]   = useState<"like" | "new" | "char">("like");

  const results = useMemo<Work[]>(() => {
    let list = [...MOCK_WORKS];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(w =>
        w.title.toLowerCase().includes(q) ||
        (w.synopsis ?? "").toLowerCase().includes(q) ||
        w.author.displayName.toLowerCase().includes(q)
      );
    }
    if (genre)  list = list.filter(w => w.genre === genre);
    if (status) list = list.filter(w => w.serialStatus === status);

    if (sort === "like") list.sort((a, b) => b.likeCount - a.likeCount);
    if (sort === "new")  list.sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime());
    if (sort === "char") list.sort((a, b) => b.totalCharCount - a.totalCharCount);

    return list;
  }, [query, genre, status, sort]);

  return (
    <>
      <GlobalNav />
      <main className="min-h-dvh bg-bg">

        {/* ヘッダー */}
        <div className="border-b border-border bg-[#0c0b14]">
          <div className="max-w-[1100px] mx-auto px-8 pt-10 pb-6">
            <p className="text-[10px] text-accent tracking-widest uppercase mb-1">SEARCH</p>
            <h1 className="font-serif text-[clamp(24px,3.5vw,36px)] font-normal text-text-1 mb-6">
              作品を探す
            </h1>

            {/* 検索バー */}
            <div className="relative max-w-[560px]">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3"
                width="14" height="14" viewBox="0 0 16 16" fill="none"
                stroke="currentColor" strokeWidth="1.7"
              >
                <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5l3.5 3.5" />
              </svg>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="タイトル・作者名・あらすじで検索…"
                className="w-full bg-bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent-lt/40 transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l10 10M13 3L3 13" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* フィルター + 結果 */}
        <div className="max-w-[1100px] mx-auto px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* サイドフィルター */}
            <aside className="w-full lg:w-[200px] flex-shrink-0">
              <FilterSection title="ジャンル">
                <div className="flex flex-col gap-0.5">
                  {GENRES.map(g => (
                    <button
                      key={g.value}
                      onClick={() => setGenre(g.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[12px] transition-all",
                        genre === g.value
                          ? "bg-accent/20 text-accent-lt border border-accent-lt/30"
                          : "text-text-2 hover:bg-white/4 hover:text-text-1"
                      )}
                    >
                      <span className="text-[14px]">{g.emoji}</span>
                      {g.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="連載状態">
                <div className="flex flex-col gap-0.5">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setStatus(s.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[12px] transition-all",
                        status === s.value
                          ? "bg-accent/20 text-accent-lt border border-accent-lt/30"
                          : "text-text-2 hover:bg-white/4 hover:text-text-1"
                      )}
                    >
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0",
                        s.value === "ongoing"   ? "bg-teal" :
                        s.value === "completed" ? "bg-accent-lt" :
                        s.value === "hiatus"    ? "bg-amber/70" :
                        "bg-white/20"
                      )} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </FilterSection>
            </aside>

            {/* 結果リスト */}
            <div className="flex-1 min-w-0">
              {/* 結果件数 + ソート */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-[12px] text-text-3">
                  <span className="text-text-1 font-medium">{results.length}</span> 件
                  {(query || genre || status) && (
                    <button
                      onClick={() => { setQuery(""); setGenre(""); setStatus(""); }}
                      className="ml-3 text-[11px] text-accent hover:text-accent-lt transition-colors"
                    >
                      フィルターをクリア
                    </button>
                  )}
                </p>
                <div className="flex gap-1">
                  {SORT_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setSort(s.value as typeof sort)}
                      className={cn(
                        "text-[10.5px] px-3 py-1.5 rounded-xl border transition-all",
                        sort === s.value
                          ? "bg-accent-dim border-accent-lt/30 text-accent-lt"
                          : "bg-transparent border-border text-text-3 hover:text-text-2"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {results.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {results.map(w => (
                    <NovelCard key={w.id} work={w} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

/* ══════════════════════════════════════
   サブコンポーネント
══════════════════════════════════════ */
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-[9.5px] text-text-3 uppercase tracking-widest mb-2 px-1">{title}</p>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-4xl mb-4">🔍</p>
      <p className="text-[15px] text-text-2 mb-2">作品が見つかりませんでした</p>
      <p className="text-[12px] text-text-3 leading-relaxed">
        検索条件を変えてお試しください
      </p>
    </div>
  );
}
