import { createClient } from "./client";
import type { Work, Episode, Chapter, MediaPack, User, Notification, Bookmark, Comment, ReadProgress, Genre, SerialStatus } from "@/types";

/* ══════════════════════════════════════════════════════════
   型変換ヘルパー
══════════════════════════════════════════════════════════ */
function toWork(row: Record<string, unknown>, author: Record<string, unknown>, nameChars: Record<string, unknown>[], tags: Record<string, unknown>[]): Work {
  return {
    id:                  row.id as string,
    title:               row.title as string,
    synopsis:            row.synopsis as string | null,
    genre:               row.genre as Genre,
    ageRating:           row.age_rating as Work["ageRating"],
    serialStatus:        row.serial_status as SerialStatus,
    readingMode:         row.reading_mode as Work["readingMode"],
    thumbnailUrl:        row.thumbnail_url as string | null,
    totalCharCount:      row.total_char_count as number,
    episodeCount:        row.episode_count as number,
    likeCount:           row.like_count as number,
    readCompleteCount:   row.read_complete_count as number,
    isPublished:         row.is_published as boolean,
    publishedAt:         row.published_at as string | null,
    author: {
      id:          author.id as string,
      displayName: author.display_name as string,
      username:    author.username as string,
      avatarUrl:   author.avatar_url as string | null,
    },
    nameChars: nameChars.map(c => ({
      id: c.id as string, displayName: c.display_name as string,
      reading: c.reading as string, gender: (c.gender ?? "neutral") as "male"|"female"|"neutral",
      sortOrder: c.sort_order as number,
    })),
    tags: tags.map(t => ({ id: t.id as string, name: t.name as string })),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toEpisode(row: Record<string, unknown>): Episode {
  return {
    id: row.id as string, workId: row.work_id as string,
    chapterId: row.chapter_id as string | null,
    title: row.title as string,
    bodyJson: (row.body_json ?? {}) as Record<string, unknown>,
    charCount: row.char_count as number,
    sortOrder: row.sort_order as number,
    isPublished: row.is_published as boolean,
    publishAt: row.publish_at as string | null,
    hasImage: row.has_image as boolean,
    hasVideo: row.has_video as boolean,
    likeCount: row.like_count as number,
    mediaSlots: [],
    publishedAt: row.published_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/* ══════════════════════════════════════════════════════════
   WORKS
══════════════════════════════════════════════════════════ */

/** 作品一覧取得（フィルタ・ページネーション） */
export async function fetchWorks({
  genre, serialStatus, sort = "popular", cursor, limit = 20,
}: {
  genre?: Genre;
  serialStatus?: SerialStatus;
  sort?: "new" | "popular" | "updated";
  cursor?: string;
  limit?: number;
} = {}): Promise<{ works: Work[]; nextCursor: string | null }> {
  const sb = createClient();
  let q = sb
    .from("novel_works")
    .select(`*, profiles!novel_works_author_id_fkey(id,display_name,username,avatar_url), name_chars(*), work_tags(tags(*))`)
    .eq("is_published", true)
    .is("deleted_at", null);

  if (genre)        q = q.eq("genre", genre);
  if (serialStatus) q = q.eq("serial_status", serialStatus);

  const orderCol = sort === "new" ? "published_at" : sort === "updated" ? "updated_at" : "like_count";
  q = q.order(orderCol, { ascending: false }).limit(limit + 1);

  if (cursor) q = q.lt(orderCol, cursor);

  const { data, error } = await q;
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  const items = (data ?? []).slice(0, limit);
  const lastItem = items[items.length - 1];

  return {
    works: items.map(row => {
      const author = row.profiles as Record<string, unknown>;
      const nameChars = (row.name_chars as Record<string, unknown>[]) ?? [];
      const tags = ((row.work_tags as {tags: Record<string, unknown>}[]) ?? []).map(wt => wt.tags);
      return toWork(row as Record<string, unknown>, author, nameChars, tags);
    }),
    nextCursor: hasMore && lastItem
      ? (lastItem as Record<string, unknown>)[orderCol] as string
      : null,
  };
}

/** 作品詳細取得 */
export async function fetchWork(workId: string): Promise<Work | null> {
  const sb = createClient();
  const { data, error } = await sb
    .from("novel_works")
    .select(`*, profiles!novel_works_author_id_fkey(id,display_name,username,avatar_url), name_chars(*), work_tags(tags(*))`)
    .eq("id", workId)
    .eq("is_published", true)
    .is("deleted_at", null)
    .single();
  if (error || !data) return null;
  const author = data.profiles as Record<string, unknown>;
  const nameChars = (data.name_chars as Record<string, unknown>[]) ?? [];
  const tags = ((data.work_tags as {tags: Record<string, unknown>}[]) ?? []).map(wt => wt.tags);
  return toWork(data as Record<string, unknown>, author, nameChars, tags);
}

/** ランキング取得（Redisの代わりにDBから直接） */
export async function fetchRanking({
  period = "weekly", genre, limit = 20,
}: {
  period?: "daily" | "weekly" | "monthly" | "all";
  genre?: Genre;
  limit?: number;
} = {}): Promise<Work[]> {
  const sb = createClient();
  let q = sb
    .from("novel_works")
    .select(`*, profiles!novel_works_author_id_fkey(id,display_name,username,avatar_url), name_chars(*), work_tags(tags(*))`)
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("like_count", { ascending: false })
    .limit(limit);

  if (genre) q = q.eq("genre", genre);

  if (period !== "all") {
    const days = { daily: 1, weekly: 7, monthly: 30 }[period];
    const since = new Date(Date.now() - days * 86400000).toISOString();
    q = q.gte("published_at", since);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(row => {
    const author = row.profiles as Record<string, unknown>;
    const nameChars = (row.name_chars as Record<string, unknown>[]) ?? [];
    const tags = ((row.work_tags as {tags: Record<string, unknown>}[]) ?? []).map(wt => wt.tags);
    return toWork(row as Record<string, unknown>, author, nameChars, tags);
  });
}

/** 作品検索 */
export async function searchWorks(query: string, limit = 20): Promise<Work[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("novel_works")
    .select(`*, profiles!novel_works_author_id_fkey(id,display_name,username,avatar_url), name_chars(*), work_tags(tags(*))`)
    .eq("is_published", true)
    .is("deleted_at", null)
    .ilike("title", `%${query}%`)
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(row => {
    const author = row.profiles as Record<string, unknown>;
    const nameChars = (row.name_chars as Record<string, unknown>[]) ?? [];
    const tags = ((row.work_tags as {tags: Record<string, unknown>}[]) ?? []).map(wt => wt.tags);
    return toWork(row as Record<string, unknown>, author, nameChars, tags);
  });
}

/* ══════════════════════════════════════
   EPISODES
══════════════════════════════════════ */

/** 作品のチャプター＋エピソード一覧 */
export async function fetchChapters(workId: string): Promise<Chapter[]> {
  const sb = createClient();
  const { data: chapters, error: chapErr } = await sb
    .from("chapters")
    .select("*")
    .eq("work_id", workId)
    .order("sort_order");
  if (chapErr) throw chapErr;

  const { data: episodes, error: epErr } = await sb
    .from("episodes")
    .select("*, episode_media_slots(*)")
    .eq("work_id", workId)
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("sort_order");
  if (epErr) throw epErr;

  const epMap = new Map<string | null, Episode[]>();
  for (const ep of episodes ?? []) {
    const chId = ep.chapter_id as string | null;
    const arr = epMap.get(chId) ?? [];
    const epObj = toEpisode(ep as Record<string, unknown>);
    epObj.mediaSlots = ((ep.episode_media_slots as Record<string, unknown>[]) ?? []).map(s => ({
      id: s.id as string, slotKey: s.slot_key as string,
      defaultMediaUrl: s.default_media_url as string | null,
      defaultMediaType: s.default_media_type as "image" | "video" | null,
      altText: s.alt_text as string | null,
      sortOrder: s.sort_order as number,
    }));
    arr.push(epObj);
    epMap.set(chId, arr);
  }

  // チャプターなしエピソードを「第0章」として先頭に
  const result: Chapter[] = [];
  const noCh = epMap.get(null) ?? [];
  if (noCh.length > 0) {
    result.push({ id: "__no_chapter__", title: "", sortOrder: -1, episodes: noCh });
  }
  for (const ch of chapters ?? []) {
    result.push({ id: ch.id as string, title: ch.title as string, sortOrder: ch.sort_order as number, episodes: epMap.get(ch.id as string) ?? [] });
  }
  return result;
}

/** エピソード詳細（本文込み） */
export async function fetchEpisode(workId: string, episodeId: string): Promise<Episode | null> {
  const sb = createClient();
  const { data, error } = await sb
    .from("episodes")
    .select("*, episode_media_slots(*)")
    .eq("id", episodeId)
    .eq("work_id", workId)
    .eq("is_published", true)
    .is("deleted_at", null)
    .single();
  if (error || !data) return null;
  const ep = toEpisode(data as Record<string, unknown>);
  ep.mediaSlots = ((data.episode_media_slots as Record<string, unknown>[]) ?? []).map(s => ({
    id: s.id as string, slotKey: s.slot_key as string,
    defaultMediaUrl: s.default_media_url as string | null,
    defaultMediaType: s.default_media_type as "image" | "video" | null,
    altText: s.alt_text as string | null,
    sortOrder: s.sort_order as number,
  }));
  return ep;
}

/* ══════════════════════════════════════
   LIKES
══════════════════════════════════════ */
export async function likeEpisode(episodeId: string): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  const { error } = await sb.from("likes").insert({ user_id: user.id, episode_id: episodeId });
  if (error && error.code !== "23505") throw error; // 23505 = unique違反（既にいいね済み）
}

export async function unlikeEpisode(episodeId: string): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  const { error } = await sb.from("likes").delete().eq("user_id", user.id).eq("episode_id", episodeId);
  if (error) throw error;
}

export async function fetchLikedEpisodeIds(episodeIds: string[]): Promise<Set<string>> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Set();
  const { data } = await sb.from("likes").select("episode_id").eq("user_id", user.id).in("episode_id", episodeIds);
  return new Set((data ?? []).map(r => r.episode_id as string));
}

/* ══════════════════════════════════════
   BOOKMARKS
══════════════════════════════════════ */
export async function addBookmark(workId: string): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  const { error } = await sb.from("bookmarks").insert({ user_id: user.id, work_id: workId });
  if (error && error.code !== "23505") throw error;
}

export async function removeBookmark(workId: string): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  const { error } = await sb.from("bookmarks").delete().eq("user_id", user.id).eq("work_id", workId);
  if (error) throw error;
}

export async function fetchBookmarks(): Promise<Bookmark[]> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data, error } = await sb
    .from("bookmarks")
    .select("*, novel_works(id,title,thumbnail_url,serial_status,genre, profiles!novel_works_author_id_fkey(id,display_name,username,avatar_url))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(r => ({
    id: r.id as string, workId: r.work_id as string,
    folderName: r.folder_name as string | null,
    createdAt: r.created_at as string,
    work: {
      id:           (r.novel_works as Record<string, unknown>).id as string,
      title:        (r.novel_works as Record<string, unknown>).title as string,
      thumbnailUrl: (r.novel_works as Record<string, unknown>).thumbnail_url as string | null,
      serialStatus: (r.novel_works as Record<string, unknown>).serial_status as SerialStatus,
      genre:        (r.novel_works as Record<string, unknown>).genre as Genre,
      author: {
        id:          ((r.novel_works as Record<string, unknown>).profiles as Record<string, unknown>).id as string,
        displayName: ((r.novel_works as Record<string, unknown>).profiles as Record<string, unknown>).display_name as string,
        username:    ((r.novel_works as Record<string, unknown>).profiles as Record<string, unknown>).username as string,
        avatarUrl:   ((r.novel_works as Record<string, unknown>).profiles as Record<string, unknown>).avatar_url as string | null,
      },
    },
  }));
}

export async function isBookmarked(workId: string): Promise<boolean> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { data } = await sb.from("bookmarks").select("id").eq("user_id", user.id).eq("work_id", workId).maybeSingle();
  return !!data;
}

/* ══════════════════════════════════════
   READ PROGRESS
══════════════════════════════════════ */
export async function saveProgress(workId: string, progress: {
  lastEpisodeId?: string;
  lastScrollPct?: number;
  lastFlipPage?: number;
  completed?: boolean;
}): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  const { error } = await sb.from("read_progresses").upsert({
    user_id:         user.id,
    work_id:         workId,
    last_episode_id: progress.lastEpisodeId,
    last_scroll_pct: progress.lastScrollPct,
    last_flip_page:  progress.lastFlipPage,
    completed_at:    progress.completed ? new Date().toISOString() : undefined,
    updated_at:      new Date().toISOString(),
  }, { onConflict: "user_id,work_id" });
  if (error) console.error("saveProgress error:", error);
}

export async function fetchProgress(workId: string): Promise<ReadProgress | null> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("read_progresses").select("*").eq("user_id", user.id).eq("work_id", workId).maybeSingle();
  if (!data) return null;
  return {
    workId:        data.work_id as string,
    lastEpisodeId: data.last_episode_id as string | null,
    lastScrollPct: data.last_scroll_pct as number | null,
    lastFlipPage:  data.last_flip_page as number | null,
    completedAt:   data.completed_at as string | null,
    updatedAt:     data.updated_at as string,
  };
}

/* ══════════════════════════════════════
   COMMENTS
══════════════════════════════════════ */
export async function fetchComments(episodeId: string): Promise<Comment[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("comments")
    .select("*, profiles!comments_user_id_fkey(id,display_name,username,avatar_url)")
    .eq("episode_id", episodeId)
    .eq("is_hidden", false)
    .is("deleted_at", null)
    .is("parent_id", null)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(c => ({
    id: c.id as string, episodeId: c.episode_id as string,
    user: {
      id:          (c.profiles as Record<string, unknown>).id as string,
      displayName: (c.profiles as Record<string, unknown>).display_name as string,
      username:    (c.profiles as Record<string, unknown>).username as string,
      avatarUrl:   (c.profiles as Record<string, unknown>).avatar_url as string | null,
    },
    parentId: c.parent_id as string | null,
    body: c.body as string,
    likeCount: c.like_count as number,
    createdAt: c.created_at as string,
  }));
}

export async function postComment(episodeId: string, body: string, parentId?: string): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  const { error } = await sb.from("comments").insert({ episode_id: episodeId, user_id: user.id, body, parent_id: parentId ?? null });
  if (error) throw error;
}

/* ══════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════ */
export async function fetchNotifications(limit = 30): Promise<Notification[]> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data, error } = await sb
    .from("notifications")
    .select("*, actor:profiles!notifications_actor_id_fkey(display_name), work:novel_works(title), episode:episodes(title), pack:media_packs(pack_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map(n => ({
    id: n.id as string, type: n.type as Notification["type"],
    actorId:      n.actor_id as string | null,
    actorName:    (n.actor as Record<string, unknown>|null)?.display_name as string | null,
    workId:       n.work_id as string | null,
    workTitle:    (n.work as Record<string, unknown>|null)?.title as string | null,
    episodeId:    n.episode_id as string | null,
    episodeTitle: (n.episode as Record<string, unknown>|null)?.title as string | null,
    packId:       n.pack_id as string | null,
    packName:     (n.pack as Record<string, unknown>|null)?.pack_name as string | null,
    message:      n.message as string | null,
    isRead:       n.is_read as boolean,
    createdAt:    n.created_at as string,
  }));
}

export async function markNotifRead(notifId: string): Promise<void> {
  const sb = createClient();
  await sb.from("notifications").update({ is_read: true }).eq("id", notifId);
}

export async function markAllNotifRead(): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  await sb.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
}

export async function fetchUnreadNotifCount(): Promise<number> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return 0;
  const { count } = await sb.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false);
  return count ?? 0;
}

/* ══════════════════════════════════════
   MEDIA PACKS
══════════════════════════════════════ */
export async function fetchPacks(workId: string): Promise<MediaPack[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("media_packs")
    .select("*, pack_media_maps(*)")
    .eq("work_id", workId)
    .eq("is_published", true);
  if (error) return [];
  return (data ?? []).map(p => ({
    id: p.id as string, workId: p.work_id as string, authorId: p.author_id as string,
    packName: p.pack_name as string, description: p.description as string | null,
    thumbnailUrl: p.thumbnail_url as string | null, fileUrl: p.file_url as string | null,
    version: p.version as string, isPublished: p.is_published as boolean,
    downloadCount: p.download_count as number, signatureHash: p.signature_hash as string,
    mediaMaps: ((p.pack_media_maps as Record<string, unknown>[]) ?? []).map(m => ({
      id: m.id as string, slotId: m.slot_id as string,
      mediaUrl: m.media_url as string, mediaType: m.media_type as "image" | "video",
      fileSizeBytes: m.file_size_bytes as number | null,
    })),
    createdAt: p.created_at as string,
  }));
}

/* ══════════════════════════════════════
   AUTH（ユーティリティ）
══════════════════════════════════════ */
export async function getCurrentUser(): Promise<User | null> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!data) return null;
  return {
    id:              data.id as string,
    displayName:     data.display_name as string,
    username:        data.username as string,
    avatarUrl:       data.avatar_url as string | null,
    bio:             data.bio as string | null,
    role:            data.role as User["role"],
    followerCount:   data.follower_count as number,
    followingCount:  data.following_count as number,
    totalLikeCount:  data.total_like_count as number,
    workCount:       data.work_count as number,
  };
}

