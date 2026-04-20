import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/* ══════════════════════════════════════
   保護ルート（未認証でアクセスするとログインページへ）
══════════════════════════════════════ */
const PROTECTED_ROUTES = [
  "/editor",
  "/library",
  "/mypage",
  "/settings",
];

/* ══════════════════════════════════════
   認証後リダイレクト（ログイン済みでアクセスするとホームへ）
══════════════════════════════════════ */
const AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  /* 環境変数が未設定の場合はミドルウェアをスキップ（診断しやすくするため） */
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    console.error("[middleware] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です");
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnon,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  /* 保護ルートへの未認証アクセス → ログインへ */
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  /* ログイン済みで認証ページへのアクセス → ホームへ */
  const isAuth = AUTH_ROUTES.some(r => pathname.startsWith(r));
  if (isAuth && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
