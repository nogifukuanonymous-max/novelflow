/**
 * src/lib/nvp/__tests__/nvp.test.ts
 *
 * .nvp 署名・検証ロジックのユニットテスト
 * 実行: npx jest src/lib/nvp/__tests__/nvp.test.ts
 */

import {
  generateNvpSignature,
  verifyNvpSignature,
  detectMimeType,
  isAllowedImageType,
  isAllowedVideoType,
  validateFileSize,
  type NvpManifest,
} from "../index";

/* テスト用に NVP_SECRET をセット */
process.env.NVP_SECRET = "test_secret_key_for_unit_tests_minimum_64_chars_xxxxxxxxxxxxxxxxxx";

/* ══════════════════════════════════════
   1. 署名生成・検証
══════════════════════════════════════ */
describe("generateNvpSignature / verifyNvpSignature", () => {
  const params = {
    packId:    "pack-001",
    workId:    "work-001",
    authorId:  "user-001",
    version:   "1.0.0",
    createdAt: "2025-01-01T00:00:00.000Z",
  };

  it("同じパラメータで同一の署名を生成する", () => {
    const sig1 = generateNvpSignature(params);
    const sig2 = generateNvpSignature(params);
    expect(sig1).toBe(sig2);
  });

  it("workId が異なると署名が変わる", () => {
    const sig1 = generateNvpSignature({ ...params, workId: "work-001" });
    const sig2 = generateNvpSignature({ ...params, workId: "work-002" });
    expect(sig1).not.toBe(sig2);
  });

  it("正しい署名で検証が通る", () => {
    const sig = generateNvpSignature(params);
    const manifest: NvpManifest = {
      schema:         "1.0",
      packId:         params.packId,
      packName:       "テストパック",
      authorName:     "テスト作者",
      authorId:       params.authorId,
      targetWorkId:   params.workId,
      targetWorkTitle:"テスト作品",
      version:        params.version,
      mediaMap:       [],
      createdAt:      params.createdAt,
      signature:      sig,
    };
    const result = verifyNvpSignature(manifest, {
      id:            params.packId,
      workId:        params.workId,
      signatureHash: sig,
    });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("workId 不一致で WORK_ID_MISMATCH エラーになる", () => {
    const sig = generateNvpSignature(params);
    const manifest: NvpManifest = {
      schema: "1.0", packId: params.packId, packName: "テスト",
      authorName: "テスト", authorId: params.authorId,
      targetWorkId: "wrong-work-id",  // ← 不一致
      targetWorkTitle: "テスト", version: params.version,
      mediaMap: [], createdAt: params.createdAt, signature: sig,
    };
    const result = verifyNvpSignature(manifest, {
      id: params.packId, workId: params.workId, signatureHash: sig,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("WORK_ID_MISMATCH");
  });

  it("改ざんされた署名で SIGNATURE_INVALID エラーになる", () => {
    const sig = generateNvpSignature(params);
    const manifest: NvpManifest = {
      schema: "1.0", packId: params.packId, packName: "テスト",
      authorName: "テスト", authorId: params.authorId,
      targetWorkId: params.workId, targetWorkTitle: "テスト",
      version: params.version, mediaMap: [], createdAt: params.createdAt,
      signature: sig.replace(/^.{8}/, "deadbeef"), // 先頭8文字を改ざん
    };
    const result = verifyNvpSignature(manifest, {
      id: params.packId, workId: params.workId, signatureHash: sig,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("SIGNATURE_INVALID");
  });

  it("スキーマバージョン不一致で SCHEMA_VERSION_MISMATCH になる", () => {
    const sig = generateNvpSignature(params);
    const manifest: NvpManifest = {
      schema: "2.0",  // ← 不一致
      packId: params.packId, packName: "テスト", authorName: "テスト",
      authorId: params.authorId, targetWorkId: params.workId,
      targetWorkTitle: "テスト", version: params.version,
      mediaMap: [], createdAt: params.createdAt, signature: sig,
    };
    const result = verifyNvpSignature(manifest, {
      id: params.packId, workId: params.workId, signatureHash: sig,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("SCHEMA_VERSION_MISMATCH");
  });
});

/* ══════════════════════════════════════
   2. MIME検証
══════════════════════════════════════ */
describe("detectMimeType", () => {
  it("JPEG を正しく検出する", () => {
    const buf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00]);
    expect(detectMimeType(buf)).toBe("image/jpeg");
  });

  it("PNG を正しく検出する", () => {
    const buf = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D]);
    expect(detectMimeType(buf)).toBe("image/png");
  });

  it("WebP を正しく検出する", () => {
    const buf = Buffer.alloc(12);
    buf[0] = 0x52; buf[1] = 0x49; buf[2] = 0x46; buf[3] = 0x46; // RIFF
    buf[8] = 0x57; buf[9] = 0x45; buf[10] = 0x42; buf[11] = 0x50; // WEBP
    expect(detectMimeType(buf)).toBe("image/webp");
  });

  it("WebM を正しく検出する", () => {
    const buf = Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0x00]);
    expect(detectMimeType(buf)).toBe("video/webm");
  });

  it("不明なファイルは null を返す", () => {
    const buf = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    expect(detectMimeType(buf)).toBeNull();
  });
});

describe("isAllowedImageType / isAllowedVideoType", () => {
  it("許可されている画像MIMEを通す", () => {
    expect(isAllowedImageType("image/jpeg")).toBe(true);
    expect(isAllowedImageType("image/png")).toBe(true);
    expect(isAllowedImageType("image/webp")).toBe(true);
    expect(isAllowedImageType("image/gif")).toBe(true);
  });

  it("許可されていないMIMEを弾く", () => {
    expect(isAllowedImageType("image/bmp")).toBe(false);
    expect(isAllowedImageType("application/pdf")).toBe(false);
    expect(isAllowedVideoType("video/avi")).toBe(false);
  });

  it("許可されている動画MIMEを通す", () => {
    expect(isAllowedVideoType("video/mp4")).toBe(true);
    expect(isAllowedVideoType("video/webm")).toBe(true);
    expect(isAllowedVideoType("video/quicktime")).toBe(true);
  });
});

/* ══════════════════════════════════════
   3. ファイルサイズ検証
══════════════════════════════════════ */
describe("validateFileSize", () => {
  it("画像 10MB 以内は OK", () => {
    expect(validateFileSize(10 * 1024 * 1024, "image")).toBe(true);
  });

  it("画像 10MB 超は NG", () => {
    expect(validateFileSize(10 * 1024 * 1024 + 1, "image")).toBe(false);
  });

  it("動画 100MB 以内は OK", () => {
    expect(validateFileSize(100 * 1024 * 1024, "video")).toBe(true);
  });

  it("動画 100MB 超は NG", () => {
    expect(validateFileSize(100 * 1024 * 1024 + 1, "video")).toBe(false);
  });
});
