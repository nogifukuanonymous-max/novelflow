/**
 * /api/v1/packs — メディアパック API
 *
 * GET  /api/v1/packs  自分が作成したパック一覧
 * POST /api/v1/packs  パック作成
 *
 * その他のハンドラは handlers.ts に分離済み。
 */

import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import {
  withAuth, ok, Errors, parseJsonBody, requireFields,
  validateLength, checkRateLimit,
} from "@/app/api/helpers";
import { generateNvpSignature } from "@/lib/nvp";

/* ══════════════════════════════════════
   GET /api/v1/packs  —  自分のパック一覧
══════════════════════════════════════ */
export const GET = withAuth(async (_req, ctx) => {
  const sb = createServerClient(cookies());
  const { data, error } = await sb
    .from("media_packs")
    .select("*, pack_media_maps(*)")
    .eq("author_id", ctx.userId)
    .order("created_at", { ascending: false });
  if (error) return Errors.internal(error.message);
  return ok(data);
});

/* ══════════════════════════════════════
   POST /api/v1/packs  —  パック作成
══════════════════════════════════════ */
export const POST = withAuth(async (req, ctx) => {
  /* レートリミット（10回/分） */
  if (!checkRateLimit(`pack_create:${ctx.userId}`, 10, 60_000)) {
    return Errors.rateLimited();
  }

  const body = await parseJsonBody<{
    work_id:     string;
    pack_name:   string;
    description: string;
    version?:    string;
  }>(req);

  const miss = requireFields(body, ["work_id", "pack_name"]);
  if (miss) return Errors.validation(miss);

  const lenErr = validateLength(body.pack_name, 100, "パック名");
  if (lenErr) return Errors.validation(lenErr);

  const sb = createServerClient(cookies());

  /* 作品の所有者確認 */
  const { data: work } = await sb
    .from("novel_works")
    .select("id, title, author_id")
    .eq("id", body.work_id)
    .single();
  if (!work) return Errors.notFound("作品");
  if (work.author_id !== ctx.userId) return Errors.forbidden();

  /* キャラ情報を取得（作者名用） */
  const { data: profile } = await sb
    .from("profiles")
    .select("display_name")
    .eq("id", ctx.userId)
    .single();
  void profile; // 現在未使用（将来の署名拡張用）

  const version = body.version ?? "1.0.0";

  /* 仮パックIDで一度インサートし、そのIDで署名を生成 */
  const { data: newPack, error: insertErr } = await sb
    .from("media_packs")
    .insert({
      work_id:        body.work_id,
      author_id:      ctx.userId,
      pack_name:      body.pack_name,
      description:    body.description ?? null,
      version,
      signature_hash: "pending", // 後で更新
      is_published:   false,
    })
    .select()
    .single();
  if (insertErr || !newPack) return Errors.internal(insertErr?.message);

  /* 本番の署名を生成してレコードを更新 */
  const sig = generateNvpSignature({
    packId:    newPack.id as string,
    workId:    body.work_id,
    authorId:  ctx.userId,
    version,
    createdAt: newPack.created_at as string,
  });

  await sb
    .from("media_packs")
    .update({ signature_hash: sig })
    .eq("id", newPack.id as string);

  return ok({ ...newPack, signature_hash: sig, work_title: work.title }, {}, 201);
}, { authorOnly: true });
