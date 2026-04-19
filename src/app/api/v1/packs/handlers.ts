/**
 * /api/v1/packs — サブハンドラ
 * Next.js Route として export すると "valid Route export field" エラーになるため
 * route.ts から分離し、各ルートファイルから import して使う。
 *
 * exportPackHandler   → /api/v1/packs/[packId]/export/route.ts
 * importPackHandler   → /api/v1/packs/import/route.ts
 * activatePackHandler → /api/v1/packs/[packId]/activate/route.ts
 */

import { type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import {
  ok, Errors, checkRateLimit,
} from "@/app/api/helpers";
import {
  generateNvpSignature, verifyNvpSignature, buildNvpFile,
  parseNvpFile, getNvpStoragePath, NvpError,
  type NvpMediaMapEntry,
} from "@/lib/nvp";

/* ══════════════════════════════════════
   exportPackHandler  —  .nvp ファイル生成
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

  return new Response(zipBuf as unknown as BodyInit, {
    headers: {
      "Content-Type":        "application/zip",
      "Content-Disposition": `attachment; filename="${pack.id}.nvp"`,
      "Content-Length":      String(zipBuf.length),
    },
  });
}

/* ══════════════════════════════════════
   importPackHandler  —  .nvp インポート（署名検証）
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
      user_id:   userId,
      pack_id:   manifest.packId,
      is_active: false,
    }, { onConflict: "user_id,pack_id" });

  if (error) return Errors.internal(error.message);

  return ok({
    packId:          manifest.packId,
    packName:        manifest.packName,
    targetWorkId:    manifest.targetWorkId,
    targetWorkTitle: manifest.targetWorkTitle,
    verified:        true,
  }, {}, 201);
}

/* ══════════════════════════════════════
   activatePackHandler  —  パック適用切替
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
