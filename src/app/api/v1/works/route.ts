/**
 * /api/v1/works — 作品 API
 * GET    /api/v1/works          作品一覧
 * POST   /api/v1/works          作品作成
 * GET    /api/v1/works/ranking  ランキング
 */

import { type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import {
  withAuth, ok, Errors, parseJsonBody, requireFields,
  validateLength, parsePagination,
} from "@/app/api/helpers";

/* ══════════════════════════════════════
   GET /api/v1/works
══════════════════════════════════════ */
export async function GET(req: NextRequest) {
  const url    = new URL(req.url);
  const genre  = url.searchParams.get("genre") ?? undefined;
  const status = url.searchParams.get("serial_status") ?? undefined;
  const sort   = (url.searchParams.get("sort") ?? "popular") as "new" | "popular" | "updated";
  const { cursor, limit } = parsePagination(url);

  const sb = createServerClient(cookies());
  let q = sb
    .from("novel_works")
    .select(
      `id, title, synopsis, genre, age_rating, serial_status, reading_mode,
       thumbnail_url, total_char_count, episode_count, like_count, read_complete_count,
       published_at, updated_at,
       profiles!novel_works_author_id_fkey(id, display_name, username, avatar_url),
       name_chars(id, display_name, reading, sort_order),
       work_tags(tags(id, name))`
    )
    .eq("is_published", true)
    .is("deleted_at", null)
    .limit(limit + 1);

  if (genre)  q = q.eq("genre", genre);
  if (status) q = q.eq("serial_status", status);

  const orderField = sort === "new" ? "published_at" : sort === "updated" ? "updated_at" : "like_count";
  q = q.order(orderField, { ascending: false });
  if (cursor) q = q.lt(orderField, cursor);

  const { data, error } = await q;
  if (error) return Errors.internal(error.message);

  const hasMore = (data?.length ?? 0) > limit;
  const items   = (data ?? []).slice(0, limit);

  return ok(items, {
    hasMore,
    cursor: hasMore ? String((items[items.length - 1] as Record<string, unknown>)[orderField]) : null,
  });
}

/* ══════════════════════════════════════
   POST /api/v1/works
══════════════════════════════════════ */
export const POST = withAuth(async (req, ctx) => {
  const body = await parseJsonBody<{
    title:        string;
    synopsis?:    string;
    genre:        string;
    age_rating?:  string;
    reading_mode?:string;
    thumbnail_url?:string;
  }>(req);

  const miss = requireFields(body, ["title", "genre"]);
  if (miss) return Errors.validation(miss);

  const lenErr = validateLength(body.title, 200, "タイトル");
  if (lenErr) return Errors.validation(lenErr);

  const VALID_GENRES = ["romance","sf","fantasy","horror","mystery","comedy","historical","other"];
  if (!VALID_GENRES.includes(body.genre)) return Errors.validation("不正なジャンルです");

  const sb = createServerClient(cookies());
  const { data, error } = await sb
    .from("novel_works")
    .insert({
      author_id:    ctx.userId,
      title:        body.title,
      synopsis:     body.synopsis ?? null,
      genre:        body.genre,
      age_rating:   body.age_rating ?? "all",
      reading_mode: body.reading_mode ?? "both",
      thumbnail_url:body.thumbnail_url ?? null,
      is_published: false,
    })
    .select()
    .single();

  if (error) return Errors.internal(error.message);
  return ok(data, {}, 201);
}, { authorOnly: true });

/* ══════════════════════════════════════
   作品詳細 (/api/v1/works/[workId])
══════════════════════════════════════ */
export async function getWorkById(workId: string) {
  const sb = createServerClient(cookies());
  const { data, error } = await sb
    .from("novel_works")
    .select(`
      *, 
      profiles!novel_works_author_id_fkey(id, display_name, username, avatar_url),
      name_chars(*),
      work_tags(tags(*))
    `)
    .eq("id", workId)
    .eq("is_published", true)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;
  return data;
}

/* ══════════════════════════════════════
   エピソード CRUD
   /api/v1/works/[workId]/episodes
══════════════════════════════════════ */
export async function getEpisodes(workId: string) {
  const sb = createServerClient(cookies());
  const { data, error } = await sb
    .from("episodes")
    .select("*, episode_media_slots(*)")
    .eq("work_id", workId)
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("sort_order");
  if (error) return [];
  return data ?? [];
}

export const createEpisode = withAuth(async (req, ctx) => {
  const url    = new URL(req.url);
  const workId = url.pathname.split("/").at(-2); // /api/v1/works/[workId]/episodes

  const sb = createServerClient(cookies());
  const { data: work } = await sb.from("novel_works").select("author_id").eq("id", workId!).single();
  if (!work) return Errors.notFound("作品");
  if (work.author_id !== ctx.userId) return Errors.forbidden();

  const body = await parseJsonBody<{
    title:        string;
    body_json:    Record<string, unknown>;
    chapter_id?:  string;
    sort_order?:  number;
    is_published?:boolean;
    publish_at?:  string;
    char_count?:  number;
  }>(req);

  const miss = requireFields(body, ["title", "body_json"]);
  if (miss) return Errors.validation(miss);

  const { data, error } = await sb
    .from("episodes")
    .insert({
      work_id:      workId!,
      chapter_id:   body.chapter_id ?? null,
      title:        body.title,
      body_json:    body.body_json as unknown as Json,
      char_count:   body.char_count ?? 0,
      sort_order:   body.sort_order ?? 0,
      is_published: body.is_published ?? false,
      publish_at:   body.publish_at ?? null,
    })
    .select()
    .single();

  if (error) return Errors.internal(error.message);
  return ok(data, {}, 201);
}, { authorOnly: true });

/* ══════════════════════════════════════
   いいね API
   /api/v1/works/[workId]/episodes/[episodeId]/likes
══════════════════════════════════════ */
export const addLike = withAuth(async (req, ctx) => {
  const url       = new URL(req.url);
  const parts     = url.pathname.split("/");
  const episodeId = parts.at(-2); // /likes の一個前

  const sb = createServerClient(cookies());
  const { error } = await sb
    .from("likes")
    .insert({ user_id: ctx.userId, episode_id: episodeId! });

  if (error) {
    if (error.code === "23505") return Errors.conflict("既にいいねしています");
    return Errors.internal(error.message);
  }
  return ok({ liked: true });
});

export const removeLike = withAuth(async (req, ctx) => {
  const url       = new URL(req.url);
  const episodeId = url.pathname.split("/").at(-2);

  const sb = createServerClient(cookies());
  const { error } = await sb
    .from("likes")
    .delete()
    .eq("user_id", ctx.userId)
    .eq("episode_id", episodeId!);

  if (error) return Errors.internal(error.message);
  return ok({ liked: false });
});

/* ══════════════════════════════════════
   ブックマーク API
   /api/v1/bookmarks
══════════════════════════════════════ */
export const getBookmarks = withAuth(async (_req, ctx) => {
  const sb = createServerClient(cookies());
  const { data, error } = await sb
    .from("bookmarks")
    .select(`
      id, work_id, folder_name, created_at,
      novel_works(
        id, title, thumbnail_url, serial_status, genre,
        profiles!novel_works_author_id_fkey(id, display_name, username, avatar_url)
      )
    `)
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });

  if (error) return Errors.internal(error.message);
  return ok(data ?? []);
});

export const addBookmark = withAuth(async (req, ctx) => {
  const body = await parseJsonBody<{ work_id: string; folder_name?: string }>(req);
  const miss  = requireFields(body, ["work_id"]);
  if (miss) return Errors.validation(miss);

  const sb = createServerClient(cookies());
  const { error } = await sb
    .from("bookmarks")
    .insert({ user_id: ctx.userId, work_id: body.work_id, folder_name: body.folder_name ?? null });

  if (error) {
    if (error.code === "23505") return Errors.conflict("既にブックマークしています");
    return Errors.internal(error.message);
  }
  return ok({ bookmarked: true }, {}, 201);
});

export const removeBookmark = withAuth(async (req, ctx) => {
  const url    = new URL(req.url);
  const workId = url.pathname.split("/").pop();

  const sb = createServerClient(cookies());
  const { error } = await sb
    .from("bookmarks")
    .delete()
    .eq("user_id", ctx.userId)
    .eq("work_id", workId!);

  if (error) return Errors.internal(error.message);
  return ok({ bookmarked: false });
});

/* ══════════════════════════════════════
   読書進捗 API
   PUT /api/v1/works/[workId]/progress
══════════════════════════════════════ */
export const saveProgressHandler = withAuth(async (req, ctx) => {
  const url    = new URL(req.url);
  const workId = url.pathname.split("/").at(-2); // /progress の一個前

  const body = await parseJsonBody<{
    last_episode_id?: string;
    last_scroll_pct?: number;
    last_flip_page?:  number;
    completed?:       boolean;
  }>(req);

  const sb = createServerClient(cookies());
  const { error } = await sb
    .from("read_progresses")
    .upsert({
      user_id:         ctx.userId,
      work_id:         workId!,
      last_episode_id: body.last_episode_id ?? null,
      last_scroll_pct: body.last_scroll_pct ?? null,
      last_flip_page:  body.last_flip_page  ?? null,
      completed_at:    body.completed ? new Date().toISOString() : null,
      updated_at:      new Date().toISOString(),
    }, { onConflict: "user_id,work_id" });

  if (error) return Errors.internal(error.message);
  return ok({ saved: true });
});

/* ══════════════════════════════════════
   通知 API
   GET   /api/v1/notifications
   PATCH /api/v1/notifications/:id
   POST  /api/v1/notifications/read-all
══════════════════════════════════════ */
export const getNotifications = withAuth(async (req, ctx) => {
  const url   = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "30", 10), 100);

  const sb = createServerClient(cookies());
  const { data, error } = await sb
    .from("notifications")
    .select(`
      id, type, is_read, message, created_at,
      actor_id,
      actor:profiles!notifications_actor_id_fkey(display_name),
      work:novel_works(title),
      episode:episodes(title),
      pack:media_packs(pack_name)
    `)
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return Errors.internal(error.message);
  return ok(data ?? []);
});

export const markNotifReadHandler = withAuth(async (req, ctx) => {
  const url    = new URL(req.url);
  const notifId = url.pathname.split("/").pop();

  const sb = createServerClient(cookies());
  const { error } = await sb
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notifId!)
    .eq("user_id", ctx.userId); // 自分の通知のみ

  if (error) return Errors.internal(error.message);
  return ok({ read: true });
});

export const markAllNotifReadHandler = withAuth(async (_req, ctx) => {
  const sb = createServerClient(cookies());
  await sb
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", ctx.userId)
    .eq("is_read", false);

  return ok({ read: true });
});

/* ══════════════════════════════════════
   コメント API
   GET  /api/v1/works/[workId]/episodes/[episodeId]/comments
   POST /api/v1/works/[workId]/episodes/[episodeId]/comments
══════════════════════════════════════ */
export async function getComments(episodeId: string) {
  const sb = createServerClient(cookies());
  const { data, error } = await sb
    .from("comments")
    .select(`
      id, body, like_count, created_at, parent_id,
      profiles!comments_user_id_fkey(id, display_name, username, avatar_url)
    `)
    .eq("episode_id", episodeId)
    .eq("is_hidden", false)
    .is("deleted_at", null)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return data ?? [];
}

export const postComment = withAuth(async (req, ctx) => {
  const url       = new URL(req.url);
  const episodeId = url.pathname.split("/").at(-2);

  const body = await parseJsonBody<{ body: string; parent_id?: string }>(req);
  const miss  = requireFields(body, ["body"]);
  if (miss) return Errors.validation(miss);
  if (body.body.length > 500) return Errors.validation("コメントは500文字以内で入力してください");

  const sb = createServerClient(cookies());
  const { data, error } = await sb
    .from("comments")
    .insert({
      episode_id: episodeId!,
      user_id:    ctx.userId,
      body:       body.body,
      parent_id:  body.parent_id ?? null,
    })
    .select()
    .single();

  if (error) return Errors.internal(error.message);
  return ok(data, {}, 201);
});
