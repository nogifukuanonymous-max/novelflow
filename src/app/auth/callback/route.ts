import { createServerClient as _createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

/* ══════════════════════════════════════
   OAuthコールバック処理
══════════════════════════════════════ */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code     = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/";

  if (code) {
    const response = NextResponse.redirect(`${origin}${redirect}`);

    const sb = _createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get:    name => request.cookies.get(name)?.value,
          set:    (name: string, value: string, options: CookieOptions) => {
            response.cookies.set({ name, value, ...options });
          },
          remove: (name: string, options: CookieOptions) => {
            response.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_error`);
}
