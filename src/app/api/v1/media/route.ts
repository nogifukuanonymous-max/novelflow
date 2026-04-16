/**
 * POST /api/v1/media/upload — ファイルアップロード
 *
 * 受け取り: multipart/form-data
 *   file     File    アップロードするファイル（必須）
 *   purpose  string  "avatar" | "work_thumbnail" | "episode_media" | "pack_thumbnail" | "pack_media" | "nvp" | "nvf"
 *   work_id  string  purpose が episode_media / pack系 の場合は必須
 *
 * 返却:
 *   { url, mediaType, fileSizeBytes, width?, height? }
 */

import { type NextRequest } from "next/server";
import { withAuth, Errors, ok } from "@/app/api/helpers";
import {
  detectMimeType, isAllowedImageType, isAllowedVideoType,
  validateFileSize, NvpError,
} from "@/lib/nvp";

/* ── R2/S3 設定 ── */
const R2_ENDPOINT  = process.env.R2_ENDPOINT ?? "";
const R2_BUCKET    = process.env.R2_BUCKET_NAME ?? "novelflow-assets";
const R2_PUBLIC    = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
const R2_KEY       = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET    = process.env.R2_SECRET_ACCESS_KEY ?? "";

/* ── purpose 別のサイズ上限と保存パス ── */
const PURPOSE_CONFIG = {
  avatar:          { maxBytes: 2  * 1024 * 1024, pathFn: (uid: string, name: string) => `avatars/${uid}/${name}` },
  work_thumbnail:  { maxBytes: 5  * 1024 * 1024, pathFn: (uid: string, name: string) => `works/${uid}/thumbnail/${name}` },
  episode_media:   { maxBytes: 100 * 1024 * 1024, pathFn: (uid: string, name: string) => `works/${uid}/episodes/media/${name}` },
  pack_thumbnail:  { maxBytes: 5  * 1024 * 1024, pathFn: (uid: string, name: string) => `packs/${uid}/thumbnail/${name}` },
  pack_media:      { maxBytes: 100 * 1024 * 1024, pathFn: (uid: string, name: string) => `packs/${uid}/media/${name}` },
  nvp:             { maxBytes: 500 * 1024 * 1024, pathFn: (uid: string, name: string) => `packs/${uid}/${name}` },
  nvf:             { maxBytes: 500 * 1024 * 1024, pathFn: (uid: string, name: string) => `nvf/${uid}/${name}` },
} as const;
type Purpose = keyof typeof PURPOSE_CONFIG;

export const POST = withAuth(async (req, ctx) => {
  /* フォームデータ取得 */
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Errors.validation("マルチパートデータのパースに失敗しました");
  }

  const file    = formData.get("file") as File | null;
  const purpose = formData.get("purpose") as Purpose | null;
  const refId   = formData.get("work_id") as string | null
               ?? formData.get("pack_id") as string | null
               ?? ctx.userId;

  /* バリデーション */
  if (!file)    return Errors.validation("file フィールドが必要です");
  if (!purpose || !PURPOSE_CONFIG[purpose]) {
    return Errors.validation("purpose が不正です");
  }

  const config = PURPOSE_CONFIG[purpose];
  if (file.size > config.maxBytes) {
    return Errors.tooLarge(`ファイルサイズが上限（${Math.round(config.maxBytes / 1024 / 1024)}MB）を超えています`);
  }

  /* バッファに変換 */
  const buf = Buffer.from(await file.arrayBuffer());

  /* マジックバイトでMIME検証（拡張子偽装対策） */
  const mime = detectMimeType(buf);
  if (!mime) return Errors.validation("対応していないファイル形式です");

  const isImg = isAllowedImageType(mime);
  const isVid = isAllowedVideoType(mime);
  const isZip = file.name.endsWith(".nvp") || file.name.endsWith(".nvf");

  if (!isImg && !isVid && !isZip) {
    return Errors.validation(`${mime} は対応していません。JPEG/PNG/WebP/GIF/MP4/WebM/MOV/.nvp/.nvf のみ許可されています`);
  }

  /* purpose 別の追加チェック */
  if (purpose === "avatar" || purpose === "work_thumbnail" || purpose === "pack_thumbnail") {
    if (!isImg) return Errors.validation("画像ファイルを選択してください");
  }
  if (purpose === "episode_media" || purpose === "pack_media") {
    if (!isImg && !isVid) return Errors.validation("画像または動画ファイルを選択してください");
    const mediaType = isImg ? "image" : "video";
    if (!validateFileSize(buf.length, mediaType)) {
      return Errors.tooLarge(`${mediaType === "image" ? "画像は10MB" : "動画は100MB"}以内にしてください`);
    }
  }

  /* ファイル名をサニタイズ */
  const ext      = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeName = `${Date.now()}_${randomHex(8)}.${ext}`;
  const path     = config.pathFn(refId ?? ctx.userId, safeName);

  /* R2 / S3 にアップロード */
  let publicUrl: string;
  try {
    publicUrl = await uploadToR2(buf, path, mime);
  } catch (e) {
    console.error("[Upload Error]", e);
    return Errors.internal("ファイルのアップロードに失敗しました");
  }

  return ok({
    url:           publicUrl,
    path,
    mediaType:     isImg ? "image" : isVid ? "video" : "file",
    fileSizeBytes: buf.length,
    mimeType:      mime,
  }, {}, 201);
});

/* ══════════════════════════════════════
   R2 アップロード実装
══════════════════════════════════════ */
async function uploadToR2(buf: Buffer, path: string, contentType: string): Promise<string> {
  if (!R2_ENDPOINT || !R2_KEY) {
    /* 開発環境: Supabase Storage にフォールバック */
    return uploadToSupabaseStorage(buf, path, contentType);
  }

  /* AWS SDK v3（@aws-sdk/client-s3）を使用 */
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const s3 = new S3Client({
    region:      "auto",
    endpoint:    R2_ENDPOINT,
    credentials: { accessKeyId: R2_KEY, secretAccessKey: R2_SECRET },
  });

  await s3.send(new PutObjectCommand({
    Bucket:      R2_BUCKET,
    Key:         path,
    Body:        buf,
    ContentType: contentType,
    CacheControl:"public, max-age=31536000, immutable",
  }));

  return `${R2_PUBLIC}/${path}`;
}

async function uploadToSupabaseStorage(buf: Buffer, path: string, contentType: string): Promise<string> {
  const { createClient: createSbClient } = await import("@/lib/supabase/client");
  const sb = createSbClient();
  const { data, error } = await sb.storage
    .from("novelflow-assets")
    .upload(path, buf, { contentType, upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = sb.storage.from("novelflow-assets").getPublicUrl(data.path);
  return publicUrl;
}

function randomHex(len: number): string {
  const { randomBytes } = require("crypto") as typeof import("crypto");
  return randomBytes(len / 2).toString("hex");
}
