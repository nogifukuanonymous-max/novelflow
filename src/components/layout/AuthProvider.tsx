"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import { getCurrentUser } from "@/lib/supabase/queries";

/**
 * アプリ全体に配置するAuthProvider。
 * Supabase Authのセッション変更を検知してZustandストアに同期する。
 * src/app/layout.tsx で <body> 直下に置く。
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const sb = createClient();

    // 初回マウント時にセッション確認
    (async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        const user = await getCurrentUser();
        setUser(user);
      }
    })();

    // セッション変更を購読
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const user = await getCurrentUser();
        setUser(user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}
