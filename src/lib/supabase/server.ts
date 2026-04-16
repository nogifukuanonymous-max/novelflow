import { createServerClient as _createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { Database } from "./database.types";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Route Handler から cookies() を渡すための最小限のインターフェース */
interface CookieStore {
  get(name: string): { value: string } | undefined;
  set(options: { name: string; value: string } & Record<string, unknown>): void;
}

/**
 * サーバー（Route Handler）用クライアント
 * 呼び出し元で cookies() を取得して渡すこと: createServerClient(cookies())
 */
export function createServerClient(cookieStore: CookieStore) {
  return _createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try { cookieStore.set({ name, value, ...options }); } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try { cookieStore.set({ name, value: "", ...options }); } catch {}
      },
    },
  });
}
