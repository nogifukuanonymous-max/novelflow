import { clsx, type ClassValue } from "clsx";
import type { Genre, SerialStatus, ReadingMode, NameChar } from "@/types";

/* ── clsx wrapper ── */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/* ── 数値フォーマット ── */
export function formatCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, "") + "万";
  if (n >= 1000)  return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toLocaleString();
}

export function formatCharCount(n: number): string {
  if (n >= 10000) return Math.floor(n / 1000) + "k字";
  return n.toLocaleString() + "字";
}

/* ── 日付フォーマット ── */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "たった今";
  if (mins  < 60) return `${mins}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days  < 7)  return `${days}日前`;
  return formatDate(iso);
}

/* ── ジャンルラベル ── */
const GENRE_LABELS: Record<Genre, { label: string; emoji: string; color: string }> = {
  romance:    { label: "恋愛",     emoji: "💜", color: "bg-accent/15 text-accent-lt border-accent-lt/20" },
  sf:         { label: "SF",       emoji: "🌌", color: "bg-teal/12 text-[#5dcaa5] border-teal/20" },
  fantasy:    { label: "ファンタジー", emoji: "🗡️", color: "bg-blue/12 text-[#85b7eb] border-blue/20" },
  horror:     { label: "ホラー",    emoji: "👻", color: "bg-coral/12 text-[#f0997b] border-coral/20" },
  mystery:    { label: "ミステリー", emoji: "🔍", color: "bg-amber/12 text-amber border-amber/20" },
  comedy:     { label: "コメディ",  emoji: "😂", color: "bg-teal/12 text-[#5dcaa5] border-teal/20" },
  historical: { label: "歴史・時代", emoji: "📖", color: "bg-white/7 text-text-2 border-border" },
  other:      { label: "その他",   emoji: "✨", color: "bg-white/7 text-text-2 border-border" },
};
export const getGenreInfo = (genre: Genre) => GENRE_LABELS[genre];

/* ── シリアルステータス ── */
const STATUS_MAP: Record<SerialStatus, { label: string; color: string }> = {
  completed: { label: "完結",   color: "bg-teal/15 text-[#5dcaa5]" },
  ongoing:   { label: "連載中", color: "bg-amber/12 text-amber" },
  hiatus:    { label: "休載中", color: "bg-white/7 text-text-3" },
};
export const getStatusInfo = (status: SerialStatus) => STATUS_MAP[status];

/* ── 読書モードラベル ── */
const MODE_MAP: Record<ReadingMode, string> = {
  both:        "両モード対応",
  flip_only:   "めくりのみ",
  scroll_only: "スクロールのみ",
};
export const getReadingModeLabel = (mode: ReadingMode) => MODE_MAP[mode];

/* ── 名前変換 ── */
/**
 * テキスト中の {{キャラ名_よみ}} を変換する
 * nameMap: { charId -> userInputName }
 * chars:   NameChar[]
 */
export function applyNameTransform(
  text: string,
  chars: NameChar[],
  nameMap: Record<string, string>
): string {
  let result = text;
  for (const c of chars) {
    const replacement = nameMap[c.id] || c.displayName;
    const pattern = new RegExp(
      `\\{\\{${escapeRegex(c.displayName)}_${escapeRegex(c.reading)}\\}\\}`,
      "g"
    );
    result = result.replace(pattern, replacement);
  }
  return result;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ── カバー背景グラデーション（サムネなし時） ── */
const COVER_GRADS = [
  "linear-gradient(135deg,#2e1f52,#7b4a8a)",
  "linear-gradient(135deg,#0f2a38,#1d9e75)",
  "linear-gradient(135deg,#3a0f0f,#d85a30)",
  "linear-gradient(135deg,#0f1e38,#378add)",
  "linear-gradient(135deg,#1a1f3a,#534ab7)",
  "linear-gradient(135deg,#1a2a0a,#639922)",
] as const;

export function getWorkGradient(workId: string): string {
  let hash = 0;
  for (let i = 0; i < workId.length; i++) {
    hash = (hash * 31 + workId.charCodeAt(i)) % COVER_GRADS.length;
  }
  return COVER_GRADS[Math.abs(hash) % COVER_GRADS.length];
}

/* ── 進捗パーセント計算 ── */
export function calcProgressPct(
  currentEpisodeSortOrder: number,
  totalEpisodes: number
): number {
  if (totalEpisodes === 0) return 0;
  return Math.round(((currentEpisodeSortOrder + 1) / totalEpisodes) * 100);
}

/* ── 通知テキスト生成 ── */
import type { Notification, NotifType } from "@/types";
export function getNotifText(n: Notification): string {
  switch (n.type as NotifType) {
    case "like":
      return `${n.actorName} さんが「${n.workTitle}」にいいねしました`;
    case "follow":
      return `${n.actorName} さんがあなたをフォローしました`;
    case "comment":
      return `「${n.workTitle}」${n.episodeTitle ? n.episodeTitle + "に" : "に"}新しいコメントがあります`;
    case "new_episode":
      return `フォロー中の ${n.actorName} さんが「${n.episodeTitle}」を投稿しました`;
    case "new_pack":
      return `${n.actorName} さんが新しいパックを公開しました：「${n.packName}」`;
    case "system":
      return n.message ?? "システムからのお知らせがあります";
    default:
      return "新しい通知があります";
  }
}
