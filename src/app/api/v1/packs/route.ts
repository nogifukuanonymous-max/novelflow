/**
 * /api/v1/packs — メディアパック API
 *
 * GET    /api/v1/packs                   自分が作成したパック一覧
 * POST   /api/v1/packs                   パック作成
 * GET    /api/v1/packs/[packId]          パック詳細
 * PATCH  /api/v1/packs/[packId]          パック更新
 * DELETE /api/v1/packs/[packId]          パック削除
 * POST   /api/v1/packs/[packId]/export   .nvp ファイル生成
 * POST   /api/v1/packs/import            .nvp インポート（署名検証込み）
 * PUT    /api/v1/packs/[packId]/media-maps メディアマップ一括更新
 */

import { type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import {
  withAuth, ok, Errors, parseJsonBody, requireFields,
  validateLength, checkRateLimit,
} from "@/app/api/helpers";
import {
  generateNvpSignature, verifyNvpSignature, buildNvpFile,
  parseNvpFile, getNvpStoragePath, NvpError,
  type NvpMediaMapEntry,
} from "@/lib/nvp";

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

  const createdAt = new Date().toISOString();
  const version   = body.version ?? "1.0.0";

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

/* ══════════════════════════════════════
   POST /api/v1/packs/[packId]/export  —  .nvp ファイル生成
   （実際のルートは /api/v1/packs/[packId]/export/route.ts に分離する）
   ここでは同ファイルに関数としてエクスポートしておく
══════════════════════════════════════ */
export async function exportPackHandler(req: NextRequest, packId: string, userId: string) {
  const sb = createServerClient(cookies());

  /* パック取得 */
  const { data: pack } = await sb
    .from("media_packs")
    .select("*, pack_media_maps(*)")
    .eq("id", packId)
    .single();
  if (!pack) return Errors.notFound("パック");
  if (pack.author_id !== userId) return Errors.forbidden();

  /* 作品取得 */
  const { data: work } = await sb
    .from("novel_works")
    .select("title")
    .eq("id", pack.work_id as string)
    .single();

  /* 作者取得 */
  const { data: author } = await sb
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  const mediaMaps = (pack.pack_media_maps as Record<string, unknown>[]).map(m => ({
    episodeId: "",     // episode_media_slots から解決する（省略）
    slotId:    m.slot_id as string,
    slotKey:   "",
    mediaFile: new URL(m.media_url as string).pathname.split("/").pop()!,
    mediaType: m.media_type as "image" | "video",
  })) satisfies NvpMediaMapEntry[];

  /* メディアファイルを R2 から取得（簡略化: URLリストのみ返す） */
  // 実際は fetch(mediaUrl) でバッファを取得してZIPに詰める
  const mediaBuffers = new Map<string, Buffer>();

  const zipBuf = await buildNvpFile({
    packId:       pack.id as string,
    packName:     pack.pack_name as string,
    authorName:   author?.display_name ?? "",
    authorId:     userId,
    workId:       pack.work_id as string,
    workTitle:    work?.title ?? "",
    version:      pack.version as string,
    mediaMap:     mediaMaps,
    mediaBuffers,
  });

  /* R2 に保存 → URL を更新 */
  const storagePath = getNvpStoragePath(pack.id as string);
  // TODO: R2 クライアントでアップロード（r2Client.put(storagePath, zipBuf)）

  await sb.from("media_packs").update({ file_url: storagePath }).eq("id", packId);

  return new Response(zipBuf, {
    headers: {
      "Content-Type":        "application/zip",
      "Content-Disposition": `attachment; filename="${pack.id}.nvp"`,
      "Content-Length":      String(zipBuf.length),
    },
  });
}

/* ══════════════════════════════════════
   POST /api/v1/packs/import  —  .nvp インポート（署名検証）
   実際のルートは /api/v1/packs/import/route.ts に置く
══════════════════════════════════════ */
export async function importPackHandler(req: NextRequest, userId: string) {
  /* レートリミット（5回/分） */
  if (!checkRateLimit(`pack_import:${userId}`, 5, 60_000)) {
    return Errors.rateLimited();
  }

  /* multipart/form-data でファイルを受け取る */
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Errors.validation("マルチパートデータのパースに失敗しました");
  }

  const file = formData.get("file") as File | null;
  if (!file) return Errors.validation("file フィールドが必要です");
  if (!file.name.endsWith(".nvp")) return Errors.validation("拡張子 .nvp のファイルを選択してください");

  /* バッファに変換 */
  const buf = Buffer.from(await file.arrayBuffer());

  /* .nvp を展開してmanifestを取得 */
  let manifest: Awaited<ReturnType<typeof parseNvpFile>>["manifest"];
  try {
    const parsed = await parseNvpFile(buf);
    manifest     = parsed.manifest;
  } catch (e) {
    if (e instanceof NvpError) return e.toResponse();
    return Errors.internal("ファイルの解析に失敗しました");
  }

  const sb = createServerClient(cookies());

  /* DBからパック情報を取得（署名検証に必要） */
  const { data: dbPack } = await sb
    .from("media_packs")
    .select("id, work_id, signature_hash")
    .eq("id", manifest.packId)
    .maybeSingle();

  if (!dbPack) {
    /* DBに登録されていないパック → 署名のみで検証（ローカル流通パック） */
    return Errors.unprocessable("PACK_NOT_FOUND",
      "このパックはサービスに登録されていません。作者に確認してください。");
  }

  /* 署名検証 */
  const result = verifyNvpSignature(manifest, {
    id:            dbPack.id as string,
    workId:        dbPack.work_id as string,
    signatureHash: dbPack.signature_hash as string,
  });

  if (!result.valid) {
    return Errors.unprocessable(result.error!, result.message!);
  }

  /* インポート記録を upsert */
  const { error } = await sb
    .from("user_pack_imports")
    .upsert({
      user_id:     userId,
      pack_id:     manifest.packId,
      is_active:   false,
      imported_at: new Date().toISOString(),
    }, { onConflict: "user_id,pack_id" });

  if (error) return Errors.internal(error.message);

  return ok({
    packId:        manifest.packId,
    packName:      manifest.packName,
    targetWorkId:  manifest.targetWorkId,
    targetWorkTitle: manifest.targetWorkTitle,
    verified:      true,
  }, {}, 201);
}

/* ══════════════════════════════════════
   PUT /api/v1/packs/[packId]/activate  —  パック適用切替
══════════════════════════════════════ */
export async function activatePackHandler(packId: string, userId: string) {
  const sb = createServerClient(cookies());

  /* インポート済み確認 */
  const { data: imp } = await sb
    .from("user_pack_imports")
    .select("pack_id")
    .eq("user_id", userId)
    .eq("pack_id", packId)
    .maybeSingle();
  if (!imp) return Errors.notFound("インポートされたパック");

  /* 同じ作品の他パックをすべて非アクティブに */
  const { data: pack } = await sb
    .from("media_packs")
    .select("work_id")
    .eq("id", packId)
    .single();
  if (!pack) return Errors.notFound("パック");

  /* 同作品の全インポートを is_active = false に */
  const { data: workImports } = await sb
    .from("user_pack_imports")
    .select("pack_id, media_packs!inner(work_id)")
    .eq("user_id", userId)
    .eq("media_packs.work_id", pack.work_id as string);

  if (workImports?.length) {
    const packIds = workImports.map(i => i.pack_id as string);
    await sb.from("user_pack_imports")
      .update({ is_active: false })
      .eq("user_id", userId)
      .in("pack_id", packIds);
  }

  /* 対象パックを is_active = true に */
  await sb.from("user_pack_imports")
    .update({ is_active: true })
    .eq("user_id", userId)
    .eq("pack_id", packId);

  return ok({ packId, isActive: true });
}
