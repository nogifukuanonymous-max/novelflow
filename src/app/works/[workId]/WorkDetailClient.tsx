"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Work, Chapter, MediaPack, Episode } from "@/types";
import { useNameStore, usePackStore } from "@/lib/store";
import { formatCount, formatCharCount, formatDate, getWorkGradient, getGenreInfo, getStatusInfo } from "@/lib/utils";
import { NamePanel } from "@/components/reader/NameTransform";
import { ProgressBar, RadioCard, StatusBadge, ReadingModeBadge, Toggle } from "@/components/ui";
import { BackNav } from "@/components/layout/Nav";
import { cn } from "@/lib/utils";

type TabId = "info" | "episodes" | "comments";

interface Props {
  work: Work;
  chapters: Chapter[];
  packs: MediaPack[];
}

export function WorkDetailClient({ work, chapters, packs }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [bookmarked, setBookmarked] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"flip" | "scroll">("flip");
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [packModalOpen, setPackModalOpen] = useState(false);

  const { getActivePack, activatePack, getImports } = usePackStore();
  const activePack = getActivePack(work.id);
  const importedPacks = getImports(work.id);

  const allEpisodes = chapters.flatMap(c => c.episodes);
  const firstEp = allEpisodes[0];
  const grad = getWorkGradient(work.id);
  const genreInfo = getGenreInfo(work.genre);
  const statusInfo = getStatusInfo(work.serialStatus);

  /* 読むボタン */
  const handleRead = () => {
    if (!firstEp) return;
    router.push(`/works/${work.id}/episodes/${firstEp.id}?mode=${selectedMode}`);
  };

  return (
    <>
      <BackNav
        href="/"
        label="一覧に戻る"
        rightContent={
          <div className="flex gap-2">
            <button className="btn-icon w-9 h-9" onClick={() => {}}>
              <SearchIcon />
            </button>
            <button className="btn-icon w-9 h-9" onClick={() => navigator.share?.({ title: work.title, url: location.href })}>
              <ShareIcon />
            </button>
          </div>
        }
      />

      {/* ヒーローカバー */}
      <div className="relative h-[280px] overflow-hidden mt-[52px]">
        <div className="absolute inset-0" style={{ background: grad }}>
          <div className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px), radial-gradient(circle, rgba(197,179,255,0.10) 1px, transparent 1px)",
              backgroundSize: "60px 60px, 30px 30px",
              maskImage: "radial-gradient(ellipse 100% 100% at 50% 100%, transparent 20%, black 80%)",
              WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 50% 100%, transparent 20%, black 80%)",
            }}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[65%]"
          style={{ background: "linear-gradient(to bottom, transparent, #0a0910)" }} />
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-7 flex items-end gap-5 max-w-[900px]">
          {/* サムネ */}
          <div className="w-[88px] h-[118px] rounded-[10px] flex-shrink-0 flex items-center justify-center text-3xl border border-white/15 relative z-10"
            style={{ background: grad, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            🌸
          </div>
          {/* テキスト */}
          <div className="pb-1 relative z-10">
            <h1 className="font-serif text-[clamp(20px,3.5vw,32px)] font-normal text-white leading-[1.25] mb-1.5">
              {work.title}
            </h1>
            <p className="text-[12px] text-text-2 mb-2.5">
              著：<span className="text-accent-lt">{work.author.displayName}</span>
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {work.nameChars.length > 0 && (
                <span className="badge-purple text-[10px]">👤 名前変換</span>
              )}
              <span className={cn("text-[10px] px-2.5 py-0.5 rounded-full border", genreInfo.color)}>
                {genreInfo.label}
              </span>
              <StatusBadge status={work.serialStatus} />
              <ReadingModeBadge mode={work.readingMode} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-7 pb-20">
        {/* メタバー */}
        <div className="flex border-b border-border">
          {[
            { label: "♥ " + formatCount(work.likeCount), sub: "いいね" },
            { label: formatCharCount(work.totalCharCount),  sub: "総文字数" },
            { label: work.episodeCount + "話",             sub: "エピソード" },
            { label: formatCount(work.readCompleteCount),   sub: "読了数" },
          ].map((m, i) => (
            <div key={i} className="flex-1 py-3.5 text-center border-r border-border last:border-r-0">
              <p className="text-[18px] font-medium text-text-1 leading-none">{m.label}</p>
              <p className="text-[9.5px] text-text-3 mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* アクションバー */}
        <div className="flex gap-2.5 py-4 border-b border-border">
          <button
            onClick={handleRead}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full
                       bg-accent-2 text-white text-sm font-normal
                       transition-all duration-200 hover:bg-accent hover:-translate-y-px"
            style={{ boxShadow: "0 4px 20px rgba(83,74,183,0.3)" }}
          >
            <PlayIcon />
            第1話から読む
          </button>
          <button
            onClick={() => setBookmarked(b => !b)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
              "border transition-all duration-200",
              bookmarked
                ? "bg-amber/15 border-amber/30"
                : "bg-bg-card border-border-2 hover:bg-accent-dim hover:border-accent-lt/30"
            )}
          >
            <BookmarkIcon filled={bookmarked} />
          </button>
          <button
            onClick={() => setPackModalOpen(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-bg-card border border-border-2 hover:bg-accent-dim hover:border-accent-lt/30 transition-all"
          >
            <PackIcon />
          </button>
          <button
            onClick={() => navigator.share?.({ title: work.title, url: location.href })}
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-bg-card border border-border-2 hover:bg-accent-dim hover:border-accent-lt/30 transition-all"
          >
            <ShareIcon />
          </button>
        </div>

        {/* メインレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-0">

          {/* 左カラム */}
          <div>
            {/* タブ */}
            <div className="flex border-b border-border">
              {(["info", "episodes", "comments"] as TabId[]).map((t, i) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={cn(
                    "flex-1 py-3 text-center text-xs border-b-2 transition-all duration-200",
                    activeTab === t
                      ? "text-accent-lt border-b-accent"
                      : "text-text-3 border-b-transparent hover:text-text-2"
                  )}
                >
                  {["あらすじ・設定", "エピソード一覧", "コメント"][i]}
                </button>
              ))}
            </div>

            {/* あらすじタブ */}
            {activeTab === "info" && (
              <div className="py-5">
                <p className={cn(
                  "text-[13.5px] text-text-2 leading-[2] mb-3",
                  !synopsisExpanded && "line-clamp-3"
                )}>
                  {work.synopsis}
                </p>
                <button
                  onClick={() => setSynopsisExpanded(e => !e)}
                  className="text-[12px] text-accent flex items-center gap-1 hover:text-accent-lt transition-colors"
                >
                  {synopsisExpanded ? "閉じる ∧" : "続きを読む ∨"}
                </button>

                {/* 名前変換パネル */}
                {work.nameChars.length > 0 && (
                  <NamePanel
                    workId={work.id}
                    nameChars={work.nameChars}
                    onApply={handleRead}
                    className="mt-6"
                  />
                )}

                {/* 読書モード選択 */}
                {work.readingMode !== "scroll_only" && work.readingMode !== "flip_only" && (
                  <div className="mt-5">
                    <p className="text-[10px] text-text-3 uppercase tracking-widest mb-3">読書モード</p>
                    <div className="flex gap-2">
                      <ModeButton
                        active={selectedMode === "flip"}
                        onClick={() => setSelectedMode("flip")}
                        icon="📖" label="ページめくり"
                        disabled={work.readingMode === "scroll_only"}
                      />
                      <ModeButton
                        active={selectedMode === "scroll"}
                        onClick={() => setSelectedMode("scroll")}
                        icon="📜" label="縦スクロール"
                        disabled={work.readingMode === "flip_only"}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* エピソードタブ */}
            {activeTab === "episodes" && (
              <div className="py-4">
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-border">
                  <span className="text-[13px] font-medium text-text-1">エピソード一覧</span>
                  <span className="text-[11px] text-text-3">全{allEpisodes.length}話</span>
                </div>
                {chapters.map(ch => (
                  <div key={ch.id}>
                    <p className="text-[10px] text-accent-lt/60 font-medium uppercase tracking-wider
                                  py-2.5 flex items-center gap-2 after:flex-1 after:h-px after:bg-accent-lt/10 after:content-['']">
                      {ch.title}
                    </p>
                    {ch.episodes.map(ep => (
                      <EpisodeRow key={ep.id} episode={ep} workId={work.id} mode={selectedMode} />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* コメントタブ */}
            {activeTab === "comments" && (
              <div className="py-5">
                <div className="flex flex-col gap-4 mb-5">
                  {MOCK_COMMENTS.map(c => (
                    <div key={c.id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-accent/30 text-accent-lt text-[9px] font-medium flex items-center justify-center flex-shrink-0">
                        {c.user.displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-text-2 mb-1">{c.user.displayName}</p>
                        <p className="text-[11px] text-text-2 leading-[1.65]">{c.body}</p>
                        <div className="flex gap-3 mt-1.5">
                          <span className="text-[9.5px] text-text-3">{c.time}</span>
                          <span className="text-[9.5px] text-text-3 cursor-pointer hover:text-accent-lt">♥ {c.likeCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea
                    className="flex-1 bg-white/4 border border-border rounded-lg px-3 py-2 text-[11px] text-text-1 placeholder:text-text-3 outline-none resize-none caret-accent-lt focus:border-accent-lt/30"
                    placeholder="コメントを入力…"
                    rows={2}
                  />
                  <button className="w-8 h-8 self-end rounded-full bg-accent-2 text-white flex items-center justify-center hover:bg-accent transition-colors">
                    <SendIcon />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 右サイドバー */}
          <div className="lg:border-l lg:border-border lg:pl-6 pt-5 hidden lg:block">
            {/* 同じ作者の作品 */}
            <p className="text-[11px] font-medium text-text-2 uppercase tracking-widest mb-3 pb-2 border-b border-border">
              同じ作者の作品
            </p>
            {/* パック */}
            <p className="text-[11px] font-medium text-text-2 uppercase tracking-widest mb-3 pb-2 border-b border-border mt-6">
              メディアパック
            </p>
            <p className="text-[11px] text-text-3 leading-[1.7] mb-3">
              好みのビジュアルパックを選んで、同じ物語を違う雰囲気で楽しもう
            </p>
            <button
              onClick={() => setPackModalOpen(true)}
              className="w-full py-2 text-[11px] text-accent-lt bg-accent-dim border border-accent-lt/25 rounded-lg flex items-center justify-center gap-1.5 hover:bg-accent/20 transition-colors"
            >
              <PackIcon size={12} /> パックを選ぶ（{packs.length}件）
            </button>
          </div>
        </div>
      </div>

      {/* パック選択モーダル */}
      {packModalOpen && (
        <PackModal
          work={work}
          packs={packs}
          activePack={activePack}
          onActivate={packId => { activatePack(work.id, packId); setPackModalOpen(false); }}
          onClose={() => setPackModalOpen(false)}
        />
      )}
    </>
  );
}

/* ── エピソード行 ── */
function EpisodeRow({ episode, workId, mode }: { episode: Episode; workId: string; mode: string }) {
  return (
    <Link
      href={`/works/${workId}/episodes/${episode.id}?mode=${mode}`}
      className="flex items-center gap-3 py-2.5 px-2 rounded-md border border-transparent
                 hover:bg-bg-card hover:border-border transition-all duration-150"
    >
      <span className="text-[11px] text-text-3 min-w-[20px] text-right flex-shrink-0">
        {episode.sortOrder + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] text-text-1 truncate">{episode.title}</p>
        <div className="flex gap-2 mt-0.5">
          <span className="text-[10px] text-text-3">{formatDate(episode.publishedAt ?? episode.createdAt)}</span>
          <span className="text-[10px] text-text-3">{episode.charCount.toLocaleString()}字</span>
        </div>
      </div>
      <div className="flex gap-1.5 items-center flex-shrink-0">
        {episode.hasImage && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue/20 text-[#85b7eb]">画像</span>}
        {episode.hasVideo && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-coral/20 text-[#f0997b]">動画</span>}
        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
      </div>
    </Link>
  );
}

/* ── 読書モードボタン ── */
function ModeButton({ active, onClick, icon, label, disabled }: {
  active: boolean; onClick: () => void; icon: string; label: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex-1 py-2.5 rounded-lg border text-center transition-all duration-200",
        active
          ? "bg-accent/20 border-accent-lt/35 text-accent-lt"
          : "bg-bg-card border-border text-text-2 hover:border-border-2",
        disabled && "opacity-35 cursor-not-allowed hover:border-border"
      )}
    >
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-[10.5px]">{label}</div>
    </button>
  );
}

/* ── パックモーダル ── */
function PackModal({ work, packs, activePack, onActivate, onClose }: {
  work: Work;
  packs: MediaPack[];
  activePack: { packId: string } | null;
  onActivate: (id: string) => void;
  onClose: () => void;
}) {
  const allPacks = [
    { id: "default", packName: "デフォルト（パックなし）", description: "作者直埋めのメディアで表示", downloadCount: 0 },
    ...packs,
  ];
  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 flex items-end justify-center backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[600px] bg-bg-card2 rounded-t-xl border border-border-2 animate-slide-up pb-8">
        <div className="w-8 h-0.5 bg-white/20 rounded-full mx-auto mt-2.5" />
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[14px] font-medium text-text-1">メディアパックを選ぶ</p>
          <p className="text-[11px] text-text-3 mt-0.5">{work.title}　対応パック {packs.length}件</p>
        </div>
        <div className="px-5 py-3 flex flex-col gap-2">
          {allPacks.map(p => {
            const isActive = p.id === "default"
              ? !activePack
              : activePack?.packId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onActivate(p.id)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-lg border text-left transition-all",
                  isActive
                    ? "bg-accent/18 border-accent-lt/40"
                    : "bg-bg-card border-border hover:border-border-2"
                )}
              >
                <div className="w-[52px] h-9 rounded-md flex-shrink-0 flex items-center justify-center text-xl bg-accent/20 border border-accent-lt/15">
                  {p.id === "default" ? "🖼️" : "🌸"}
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-text-1">{p.packName}</p>
                  <p className="text-[10px] text-text-3 mt-0.5">
                    {p.id === "default" ? p.description : `📥 ${(p as MediaPack).downloadCount.toLocaleString()}件`}
                  </p>
                </div>
                <div className={cn(
                  "w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0",
                  isActive ? "border-accent" : "border-white/20"
                )}>
                  {isActive && <div className="w-2 h-2 rounded-full bg-accent-lt" />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="px-5">
          <button className="w-full py-3 border border-dashed border-accent-lt/30 rounded-lg text-[12px] text-accent-lt flex items-center justify-center gap-2 hover:bg-accent-dim transition-colors">
            📥 .nvp ファイルをインポート
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── モックコメント ── */
const MOCK_COMMENTS = [
  { id: "1", user: { displayName: "tsuki_yoru" }, body: "名前変換でさくらにしたら感情移入が半端なかったです。涙が止まらなかった…", likeCount: 24, time: "2日前" },
  { id: "2", user: { displayName: "haru_221" }, body: "ページめくりモードで読んだら一気に世界観に入れました。文体がとにかく美しい。", likeCount: 18, time: "3日前" },
  { id: "3", user: { displayName: "kiri_writer" }, body: "「有村架純パック」を当てて読んだらまた違う印象になって面白かった。パック機能最高。", likeCount: 31, time: "5日前" },
];

/* ── アイコン群 ── */
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8">
    <circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" />
  </svg>
);
const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8">
    <circle cx="12" cy="3" r="1.5" /><circle cx="4" cy="8" r="1.5" /><circle cx="12" cy="13" r="1.5" />
    <path d="M5.5 7.2l5-2.8M5.5 8.8l5 2.8" />
  </svg>
);
const PlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polygon points="4,2 14,8 4,14" fill="white" stroke="none" />
  </svg>
);
const BookmarkIcon = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? "rgba(250,199,117,0.8)" : "none"}
    stroke={filled ? "rgba(250,199,117,0.9)" : "rgba(255,255,255,0.6)"} strokeWidth="1.8">
    <path d="M12 2H4a1 1 0 00-1 1v12l5-2.5L13 15V3a1 1 0 00-1-1z" />
  </svg>
);
const PackIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="2" width="12" height="12" rx="2" /><path d="M2 6h12M6 2v4" />
  </svg>
);
const SendIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8">
    <path d="M14 2L2 7l5 2 2 5 5-12z" />
  </svg>
);
