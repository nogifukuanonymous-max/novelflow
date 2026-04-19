/**
 * NovelFlow — .nvp / .nvf ファイル署名・検証・パッキングロジック
 * src/lib/nvp/index.ts
 *
 * 【設計方針】
 *  - HMAC-SHA256 でパック固有の署名を生成
 *  - 署名ペイロードに workId を必ず含めることで他作品への流用を技術的に防止
 *  - .nvp は ZIP アーカイブ。ブラウザ・Node.js 両対応のため JSZip を使用
 *  - このファイルはサーバーサイド専用（NVP_SECRET を使うため）
 */

import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import type { MediaPack } from "@/types";

// 型エイリアス
type PackRow = MediaPack;

/* ══════════════════════════════════════
   定数
══════════════════════════════════════ */
const NVP_VERSION  = "1.0";
const NVF_VERSION  = "1.0";
const MIME_IMAGE   = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MIME_VIDEO   = ["video/mp4", "video/webm", "video/quicktime"] as const;
const MAX_PACK_SIZE_BYTES = 500 * 1024 * 1024; // 500MB（Web版）

/* ══════════════════════════════════════
   型定義
══════════════════════════════════════ */
export interface NvpManifest {
  /** スキーマバージョン */
  schema:        string;
  /** パック固有UUID */
  packId:        string;
  /** パック名（例：有村架純パック） */
  packName:      string;
  /** パック作成者名 */
  authorName:    string;
  /** 作成者のユーザーID（署名に含める） */
  authorId:      string;
  /** 【重要】このパックを適用できる作品ID（署名に含める） */
  targetWorkId:  string;
  /** 対象作品タイトル（表示用） */
  targetWorkTitle: string;
  /** パックバージョン */
  version:       string;
  /** メディアマッピング配列 */
  mediaMap:      NvpMediaMapEntry[];
  /** 作成日時 ISO8601 */
  createdAt:     string;
  /** 署名ハッシュ（HMAC-SHA256） */
  signature:     string;
}

export interface NvpMediaMapEntry {
  /** エピソードID */
  episodeId:   string;
  /** スロットID（episode_media_slots.id） */
  slotId:      string;
  /** スロットキー（slot_001 等） */
  slotKey:     string;
  /** パック内のファイルパス（例：images/scene01.jpg） */
  mediaFile:   string;
  /** image | video */
  mediaType:   "image" | "video";
  /** altテキスト（省略可） */
  altText?:    string;
}

export interface NvfManifest {
  schema:        string;
  workId:        string;
  title:         string;
  authorName:    string;
  authorId:      string;
  synopsis:      string | null;
  genre:         string;
  ageRating:     string;
  serialStatus:  string;
  /** 読書モード設定（作者が指定） */
  readingMode:   "both" | "flip_only" | "scroll_only";
  /** 名前変換キャラ定義 */
  nameChars:     { id: string; displayName: string; reading: string; gender: string }[];
  /** チャプター・エピソード構造 */
  chapters:      NvfChapter[];
  createdAt:     string;
  signature:     string;
}

export interface NvfChapter {
  id:        string;
  title:     string;
  sortOrder: number;
  episodes:  NvfEpisode[];
}

export interface NvfEpisode {
  id:          string;
  title:       string;
  sortOrder:   number;
  charCount:   number;
  bodyFile:    string;  // episodes/ep-001.md
  mediaSlots:  { slotKey: string; defaultFile: string | null; mediaType: string | null; altText: string | null }[];
}

/* ══════════════════════════════════════
   署名生成
══════════════════════════════════════ */

/**
 * .nvp 署名ペイロードを生成する（サーバー側）
 * NVP_SECRET 環境変数を使用。絶対にクライアントに送らないこと。
 */
export function generateNvpSignature(params: {
  packId:      string;
  workId:      string;
  authorId:    string;
  version:     string;
  createdAt:   string;
}): string {
  const secret = process.env.NVP_SECRET;
  if (!secret) throw new Error("NVP_SECRET is not set");

  const payload = JSON.stringify({
    packId:    params.packId,
    workId:    params.workId,       // ← workId が署名に含まれる = 流用防止の核心
    authorId:  params.authorId,
    version:   params.version,
    createdAt: params.createdAt,
  });

  return createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

/**
 * .nvf 署名生成（作品本体ファイル用）
 */
export function generateNvfSignature(params: {
  workId:    string;
  authorId:  string;
  createdAt: string;
}): string {
  const secret = process.env.NVP_SECRET;
  if (!secret) throw new Error("NVP_SECRET is not set");

  const payload = JSON.stringify({
    workId:    params.workId,
    authorId:  params.authorId,
    createdAt: params.createdAt,
  });

  return createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

/* ══════════════════════════════════════
   署名検証
══════════════════════════════════════ */

export interface NvpVerifyResult {
  valid:   boolean;
  error?:  "SIGNATURE_INVALID" | "WORK_ID_MISMATCH" | "PACK_NOT_FOUND" | "SCHEMA_VERSION_MISMATCH";
  message?: string;
}

/**
 * インポート時の .nvp 署名検証
 * @param manifest  .nvp 内の pack_manifest.json をパースしたオブジェクト
 * @param dbPack    DBから取得したパック情報（signature_hash / work_id が保存済み）
 */
export function verifyNvpSignature(
  manifest: NvpManifest,
  dbPack: Pick<PackRow, "id" | "workId" | "signatureHash">
): NvpVerifyResult {
  /* ① スキーマバージョン確認 */
  if (manifest.schema !== NVP_VERSION) {
    return { valid: false, error: "SCHEMA_VERSION_MISMATCH",
             message: `スキーマバージョンが一致しません。期待: ${NVP_VERSION}, 実際: ${manifest.schema}` };
  }

  /* ② 作品ID照合（最重要：流用防止） */
  if (manifest.targetWorkId !== dbPack.workId) {
    return { valid: false, error: "WORK_ID_MISMATCH",
             message: "このパックは別の作品用です。他の作品には適用できません。" };
  }

  /* ③ 署名の再計算と比較（タイミング攻撃対策で timingSafeEqual を使用） */
  const expectedSig = generateNvpSignature({
    packId:    dbPack.id,
    workId:    dbPack.workId,
    authorId:  manifest.authorId,
    version:   manifest.version,
    createdAt: manifest.createdAt,
  });

  let sigsMatch: boolean;
  try {
    sigsMatch = timingSafeEqual(
      Buffer.from(manifest.signature,      "hex"),
      Buffer.from(expectedSig,             "hex")
    );
  } catch {
    sigsMatch = false;
  }

  if (!sigsMatch) {
    return { valid: false, error: "SIGNATURE_INVALID",
             message: "署名の検証に失敗しました。ファイルが改ざんされている可能性があります。" };
  }

  return { valid: true };
}

/**
 * .nvp ファイル（ZIP）をパースして manifest を取り出す
 * Node.js 環境（Route Handler）用
 */
export async function parseNvpFile(buffer: Buffer): Promise<{
  manifest: NvpManifest;
  mediaFiles: Map<string, Buffer>;
}> {
  // JSZip を動的インポート（サーバーサイドのみ）
  const JSZip = (await import("jszip")).default;

  let zip: InstanceType<typeof JSZip>;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new NvpError("INVALID_ZIP", ".nvp ファイルの展開に失敗しました。正しい .nvp ファイルか確認してください。");
  }

  /* manifest.json を読み込む */
  const manifestFile = zip.file("pack_manifest.json");
  if (!manifestFile) {
    throw new NvpError("MISSING_MANIFEST", "pack_manifest.json が見つかりません。");
  }

  let manifest: NvpManifest;
  try {
    const json = await manifestFile.async("string");
    manifest   = JSON.parse(json) as NvpManifest;
  } catch {
    throw new NvpError("INVALID_MANIFEST", "pack_manifest.json のパースに失敗しました。");
  }

  /* 必須フィールドチェック */
  const required: (keyof NvpManifest)[] = [
    "schema", "packId", "packName", "authorId", "targetWorkId", "version", "signature", "createdAt"
  ];
  for (const key of required) {
    if (!manifest[key]) {
      throw new NvpError("INVALID_MANIFEST", `pack_manifest.json に必須フィールド "${key}" がありません。`);
    }
  }

  /* メディアファイルを抽出 */
  const mediaFiles = new Map<string, Buffer>();
  const filePromises: Promise<void>[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    if (!relativePath.startsWith("images/") && !relativePath.startsWith("videos/")) return;

    filePromises.push(
      zipEntry.async("nodebuffer").then(buf => {
        if (buf.length > MAX_PACK_SIZE_BYTES) {
          throw new NvpError("FILE_TOO_LARGE", `ファイル ${relativePath} がサイズ上限を超えています。`);
        }
        mediaFiles.set(relativePath, buf);
      })
    );
  });

  await Promise.all(filePromises);

  return { manifest, mediaFiles };
}

/* ══════════════════════════════════════
   .nvp ファイル生成（エクスポート用）
══════════════════════════════════════ */

export interface BuildNvpOptions {
  packId:        string;
  packName:      string;
  authorName:    string;
  authorId:      string;
  workId:        string;
  workTitle:     string;
  version?:      string;
  mediaMap:      NvpMediaMapEntry[];
  /** key = mediaFile パス（例："images/scene01.jpg"）, value = ファイルバッファ */
  mediaBuffers:  Map<string, Buffer>;
}

/**
 * .nvp ファイルを生成してバッファで返す
 * サーバーサイドの Route Handler から呼ぶ
 */
export async function buildNvpFile(options: BuildNvpOptions): Promise<Buffer> {
  const JSZip = (await import("jszip")).default;
  const zip   = new JSZip();

  const createdAt = new Date().toISOString();
  const version   = options.version ?? "1.0.0";

  /* 署名を生成 */
  const signature = generateNvpSignature({
    packId:    options.packId,
    workId:    options.workId,
    authorId:  options.authorId,
    version,
    createdAt,
  });

  /* manifest.json を構築 */
  const manifest: NvpManifest = {
    schema:         NVP_VERSION,
    packId:         options.packId,
    packName:       options.packName,
    authorName:     options.authorName,
    authorId:       options.authorId,
    targetWorkId:   options.workId,
    targetWorkTitle:options.workTitle,
    version,
    mediaMap:       options.mediaMap,
    createdAt,
    signature,
  };

  zip.file("pack_manifest.json", JSON.stringify(manifest, null, 2));

  /* サムネイル（あれば） */
  const thumbBuf = options.mediaBuffers.get("thumbnail.jpg");
  if (thumbBuf) zip.file("thumbnail.jpg", thumbBuf);

  /* メディアファイルを追加 */
  for (const [path, buf] of Array.from(options.mediaBuffers.entries())) {
    if (path === "thumbnail.jpg") continue;
    zip.file(path, buf);
  }

  /* ZIP 生成 */
  const zipBuf = await zip.generateAsync({
    type:               "nodebuffer",
    compression:        "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return zipBuf;
}

/* ══════════════════════════════════════
   .nvf ファイル生成（作品エクスポート用）
══════════════════════════════════════ */

export interface BuildNvfOptions {
  workId:       string;
  title:        string;
  authorName:   string;
  authorId:     string;
  synopsis:     string | null;
  genre:        string;
  ageRating:    string;
  serialStatus: string;
  readingMode:  NvfManifest["readingMode"];
  nameChars:    NvfManifest["nameChars"];
  chapters:     NvfChapter[];
  /** key = episodes/ep-xxx.md のパス, value = Markdownテキスト */
  episodeTexts: Map<string, string>;
  /** key = assets/images/... のパス, value = バッファ */
  assetBuffers?: Map<string, Buffer>;
  coverBuffer?:  Buffer;
}

export async function buildNvfFile(options: BuildNvfOptions): Promise<Buffer> {
  const JSZip = (await import("jszip")).default;
  const zip   = new JSZip();

  const createdAt = new Date().toISOString();

  const signature = generateNvfSignature({
    workId:    options.workId,
    authorId:  options.authorId,
    createdAt,
  });

  const manifest: NvfManifest = {
    schema:      NVF_VERSION,
    workId:      options.workId,
    title:       options.title,
    authorName:  options.authorName,
    authorId:    options.authorId,
    synopsis:    options.synopsis,
    genre:       options.genre,
    ageRating:   options.ageRating,
    serialStatus:options.serialStatus,
    readingMode: options.readingMode,
    nameChars:   options.nameChars,
    chapters:    options.chapters,
    createdAt,
    signature,
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  /* エピソードテキスト */
  for (const [path, text] of Array.from(options.episodeTexts.entries())) {
    zip.file(path, text);
  }

  /* アセット */
  if (options.assetBuffers) {
    for (const [path, buf] of Array.from(options.assetBuffers.entries())) {
      zip.file(path, buf);
    }
  }

  /* カバー画像 */
  if (options.coverBuffer) {
    zip.file("cover.jpg", options.coverBuffer);
  }

  return zip.generateAsync({
    type:               "nodebuffer",
    compression:        "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

/* ══════════════════════════════════════
   ファイルタイプ検証
══════════════════════════════════════ */

/** バッファの先頭バイトからMIMEタイプを判定（マジックバイト） */
export function detectMimeType(buf: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "image/jpeg";
  // PNG:  89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return "image/png";
  // GIF:  47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  // WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  // MP4:  ftyp ボックス（offset 4 or 8）
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return "video/mp4";
  // WebM: 1A 45 DF A3
  if (buf[0] === 0x1A && buf[1] === 0x45 && buf[2] === 0xDF && buf[3] === 0xA3) return "video/webm";
  // MOV:  66 74 79 70 71 74
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70 &&
      buf[8] === 0x71 && buf[9] === 0x74) return "video/quicktime";
  return null;
}

export function isAllowedImageType(mime: string): boolean {
  return (MIME_IMAGE as readonly string[]).includes(mime);
}
export function isAllowedVideoType(mime: string): boolean {
  return (MIME_VIDEO as readonly string[]).includes(mime);
}
export function isAllowedMediaType(mime: string): boolean {
  return isAllowedImageType(mime) || isAllowedVideoType(mime);
}

/** ファイルサイズ上限チェック（Web版） */
export function validateFileSize(bytes: number, type: "image" | "video"): boolean {
  const limits = { image: 10 * 1024 * 1024, video: 100 * 1024 * 1024 }; // 10MB / 100MB
  return bytes <= limits[type];
}

/* ══════════════════════════════════════
   カスタムエラークラス
══════════════════════════════════════ */
export class NvpError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "NvpError";
  }

  toResponse(status = 422) {
    return Response.json(
      { error: { code: this.code, message: this.message, status } },
      { status }
    );
  }
}

/* ══════════════════════════════════════
   ユーティリティ
══════════════════════════════════════ */

/** ランダムなスロットキーを生成（例：slot_a3f2） */
export function generateSlotKey(): string {
  return "slot_" + randomBytes(3).toString("hex");
}

/** パックIDから R2 ストレージパスを生成 */
export function getNvpStoragePath(packId: string): string {
  return `packs/${packId}/${packId}.nvp`;
}

/** 作品IDから .nvf ストレージパスを生成 */
export function getNvfStoragePath(workId: string): string {
  return `nvf/${workId}/${workId}.nvf`;
}
