/* ══════════════════════════════════════
   NovelFlow 型定義
   src/types/index.ts
══════════════════════════════════════ */

/* ── ユーザー ── */
export type UserRole = "reader" | "author" | "admin";
export interface User {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  followerCount: number;
  followingCount: number;
  totalLikeCount: number;
  workCount: number;
}

/* ── 作品 ── */
export type Genre =
  | "romance" | "sf" | "fantasy" | "horror"
  | "mystery" | "comedy" | "historical" | "other";
export type SerialStatus = "ongoing" | "completed" | "hiatus";
export type AgeRating = "all" | "r15" | "r18";
export type ReadingMode = "both" | "flip_only" | "scroll_only";

export interface Tag { id: string; name: string; }

export interface NameChar {
  id: string;
  displayName: string;
  reading: string;
  gender: "male" | "female" | "neutral";
  sortOrder: number;
}

export interface Work {
  id: string;
  title: string;
  synopsis: string | null;
  genre: Genre;
  ageRating: AgeRating;
  serialStatus: SerialStatus;
  readingMode: ReadingMode;
  thumbnailUrl: string | null;
  totalCharCount: number;
  episodeCount: number;
  likeCount: number;
  readCompleteCount: number;
  isPublished: boolean;
  publishedAt: string | null;
  author: Pick<User, "id" | "displayName" | "username" | "avatarUrl">;
  nameChars: NameChar[];
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

/* ── チャプター・エピソード ── */
export interface Chapter {
  id: string;
  title: string;
  sortOrder: number;
  episodes: Episode[];
}

export interface MediaSlot {
  id: string;
  slotKey: string;
  defaultMediaUrl: string | null;
  defaultMediaType: "image" | "video" | null;
  altText: string | null;
  sortOrder: number;
}

export interface Episode {
  id: string;
  workId: string;
  chapterId: string | null;
  title: string;
  bodyJson: Record<string, unknown>;
  charCount: number;
  sortOrder: number;
  isPublished: boolean;
  publishAt: string | null;
  hasImage: boolean;
  hasVideo: boolean;
  likeCount: number;
  mediaSlots: MediaSlot[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── メディアパック ── */
export interface PackMediaMap {
  id: string;
  slotId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  fileSizeBytes: number | null;
}

export interface MediaPack {
  id: string;
  workId: string;
  authorId: string;
  packName: string;
  description: string | null;
  thumbnailUrl: string | null;
  fileUrl: string | null;
  version: string;
  isPublished: boolean;
  downloadCount: number;
  signatureHash: string;
  mediaMaps: PackMediaMap[];
  createdAt: string;
}

/* ── 読書進捗 ── */
export interface ReadProgress {
  workId: string;
  lastEpisodeId: string | null;
  lastScrollPct: number | null;
  lastFlipPage: number | null;
  completedAt: string | null;
  updatedAt: string;
}

/* ── ブックマーク ── */
export interface Bookmark {
  id: string;
  workId: string;
  folderName: string | null;
  createdAt: string;
  work: Pick<Work, "id" | "title" | "thumbnailUrl" | "serialStatus" | "genre" | "author">;
}

/* ── 通知 ── */
export type NotifType =
  | "like" | "follow" | "comment"
  | "new_episode" | "new_pack" | "system";

export interface Notification {
  id: string;
  type: NotifType;
  actorId: string | null;
  actorName: string | null;
  workId: string | null;
  workTitle: string | null;
  episodeId: string | null;
  episodeTitle: string | null;
  packId: string | null;
  packName: string | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;
}

/* ── コメント ── */
export interface Comment {
  id: string;
  episodeId: string;
  user: Pick<User, "id" | "displayName" | "username" | "avatarUrl">;
  parentId: string | null;
  body: string;
  likeCount: number;
  createdAt: string;
  replies?: Comment[];
}

/* ── APIレスポンス共通 ── */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    cursor?: string;
    hasMore?: boolean;
    total?: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

/* ── UIコンポーネント Props ── */
export interface GenreOption {
  value: Genre;
  label: string;
  emoji: string;
}

export const GENRES: GenreOption[] = [
  { value: "romance",    label: "恋愛",     emoji: "💜" },
  { value: "sf",         label: "SF",       emoji: "🌌" },
  { value: "fantasy",    label: "ファンタジー", emoji: "🗡️" },
  { value: "horror",     label: "ホラー",    emoji: "👻" },
  { value: "mystery",    label: "ミステリー", emoji: "🔍" },
  { value: "comedy",     label: "コメディ",  emoji: "😂" },
  { value: "historical", label: "歴史・時代", emoji: "📖" },
  { value: "other",      label: "その他",   emoji: "✨" },
];

export const GENRE_LABEL: Record<Genre, string> = Object.fromEntries(
  GENRES.map(g => [g.value, g.label])
) as Record<Genre, string>;

export const READING_MODE_LABEL: Record<ReadingMode, string> = {
  both:        "両モード対応",
  flip_only:   "めくりのみ",
  scroll_only: "スクロールのみ",
};

export const SERIAL_STATUS_LABEL: Record<SerialStatus, string> = {
  ongoing:   "連載中",
  completed: "完結",
  hiatus:    "休載中",
};
