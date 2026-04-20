import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * ブラウザ（Client Component）用クライアント。
 * 関数内で env を読むことで、Next.js が NEXT_PUBLIC_* を
 * ビルド時に正しくインライン展開できるようにする。
 */
export function createClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      "[NovelFlow] Supabase 環境変数が設定されていません。\n" +
      "Vercel ダッシュボード → Settings → Environment Variables に\n" +
      "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を追加してください。"
    );
  }

  return createBrowserClient<Database>(url, anon);
}
