"use client";
import Link from "next/link";
import { cn, formatCount, getGenreInfo, getStatusInfo, getWorkGradient } from "@/lib/utils";
import { ReadingModeBadge } from "@/components/ui";
import type { Work } from "@/types";

/* ══════════════════════════════════════
   NovelCard（横スクロールグリッド用）
══════════════════════════════════════ */
interface NovelCardProps {
  work: Work;
  className?: string;
}

export function NovelCard({ work, className }: NovelCardProps) {
  const genreInfo   = getGenreInfo(work.genre);
  const statusInfo  = getStatusInfo(work.serialStatus);
  const grad        = getWorkGradient(work.id);
  const hasNameConv = work.nameChars.length > 0;

  return (
    <Link
      href={`/works/${work.id}`}
      className={cn(
        "flex-shrink-0 w-[148px]",
        "bg-bg-card border border-border rounded-md overflow-hidden",
        "scroll-snap-align-start",
        "transition-all duration-200",
        "hover:-translate-y-1 hover:border-accent-lt/20",
        className
      )}
    >
      {/* カバー */}
      <div
        className="w-full h-[108px] relative overflow-hidden"
        style={{ background: grad }}
      >
        {work.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={work.thumbnailUrl}
            alt={work.title}
            className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
          />
        )}
        {/* バッジ */}
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          {hasNameConv && (
            <span className="text-[8.5px] px-1.5 py-0.5 rounded-lg bg-accent/70 backdrop-blur-sm text-[#e0d5ff] border border-accent-lt/30">
              名前変換
            </span>
          )}
          {work.readingMode !== "both" && (
            <span className="text-[8.5px] px-1.5 py-0.5 rounded-lg bg-black/55 backdrop-blur-sm text-white/75 border border-white/15">
              {work.readingMode === "flip_only" ? "めくり専用" : "スクロール専用"}
            </span>
          )}
        </div>
      </div>

      {/* ボディ */}
      <div className="px-2.5 pt-2 pb-3">
        <p className="text-[11px] font-medium text-text-1 leading-[1.4] mb-1 line-clamp-2">
          {work.title}
        </p>
        <p className="text-[9.5px] text-text-3 mb-1.5">{work.author.displayName}</p>

        {/* ジャンルタグ */}
        <div className="flex gap-1 flex-wrap mb-2">
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-md border",
            genreInfo.color
          )}>
            {genreInfo.label}
          </span>
        </div>

        {/* スタッツ */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-text-3">♥ {formatCount(work.likeCount)}</span>
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md", statusInfo.color)}>
            {statusInfo.label}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════
   RankCard（ランキングリスト用）
══════════════════════════════════════ */
interface RankCardProps {
  work: Work;
  rank: number;
  className?: string;
}

const RANK_COLORS: Record<number, string> = {
  1: "text-amber",
  2: "text-[#B4B2A9]",
  3: "text-[#f0997b]",
};

export function RankCard({ work, rank, className }: RankCardProps) {
  const genreInfo = getGenreInfo(work.genre);
  const grad = getWorkGradient(work.id);

  return (
    <Link
      href={`/works/${work.id}`}
      className={cn(
        "flex items-center gap-3.5 px-4 py-3",
        "bg-bg-card border border-border rounded-sm",
        "transition-all duration-200 hover:border-accent-lt/20 hover:bg-bg-card2",
        className
      )}
    >
      {/* 順位 */}
      <span className={cn(
        "font-serif text-xl font-normal min-w-[22px] text-center",
        RANK_COLORS[rank] ?? "text-text-3 text-[15px]"
      )}>
        {rank}
      </span>

      {/* カバー */}
      <div
        className="w-[38px] h-[50px] rounded-[5px] flex-shrink-0 overflow-hidden"
        style={{ background: grad }}
      />

      {/* 情報 */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-text-1 truncate">{work.title}</p>
        <p className="text-[10px] text-text-3 mt-0.5">{work.author.displayName}</p>
      </div>

      {/* 右側 */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[11px] text-accent">♥ {formatCount(work.likeCount)}</span>
        <span className={cn(
          "text-[9px] px-1.5 py-0.5 rounded-md border",
          genreInfo.color
        )}>
          {genreInfo.label}
        </span>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════
   WorkListItem（ライブラリ・検索結果用）
══════════════════════════════════════ */
interface WorkListItemProps {
  work: Work;
  progress?: number;   // 読了率 0-100
  newEpisodes?: number;
  className?: string;
}
export function WorkListItem({ work, progress, newEpisodes, className }: WorkListItemProps) {
  const grad = getWorkGradient(work.id);
  return (
    <Link
      href={`/works/${work.id}`}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5",
        "bg-bg-card border border-border rounded-sm",
        "transition-all duration-200 hover:border-accent-lt/20 hover:bg-bg-card2",
        className
      )}
    >
      {/* カバー */}
      <div className="w-[38px] h-[52px] rounded-[5px] flex-shrink-0" style={{ background: grad }} />

      {/* 情報 */}
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-medium text-text-1 truncate mb-0.5">{work.title}</p>
        <p className="text-[10px] text-text-3 mb-1.5">{work.author.displayName}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <ReadingModeBadge mode={work.readingMode} />
          {newEpisodes && newEpisodes > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-teal/15 text-[#5dcaa5]">
              NEW {newEpisodes}話
            </span>
          )}
        </div>
      </div>

      {/* 右側 */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {progress !== undefined && (
          <span className="text-[10px] text-text-3">{progress}%</span>
        )}
        <span className="text-[12px] text-accent-lt/60">🔖</span>
      </div>
    </Link>
  );
}
