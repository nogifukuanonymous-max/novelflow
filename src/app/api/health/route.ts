import { NextResponse } from "next/server";

/**
 * GET /api/health
 * 環境変数の読み込み状況を確認するための診断エンドポイント。
 * シークレット値はマスクして返す。
 */
export async function GET() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const urlOk  = url.startsWith("https://") && url.includes(".supabase.co");
  const anonOk = anon.startsWith("eyJ") && anon.length > 100;

  return NextResponse.json({
    ok: urlOk && anonOk,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: urlOk
        ? url                           // URL はプロジェクト識別のため全文表示
        : url === "" ? "NOT SET" : `INVALID (${url.slice(0, 30)}…)`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anonOk
        ? `SET (${anon.slice(0, 20)}…)`  // 先頭20文字のみ
        : anon === "" ? "NOT SET" : `INVALID (${anon.slice(0, 20)}…)`,
    },
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
